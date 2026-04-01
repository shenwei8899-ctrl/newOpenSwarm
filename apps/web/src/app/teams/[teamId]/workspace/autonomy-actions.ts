"use server";

import { revalidatePath } from "next/cache";
import type { AutonomyPlan } from "@openswarm/shared";
import type { FormActionState } from "@/lib/action-state";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export type AutonomyPlanActionState = FormActionState & {
  plan?: AutonomyPlan;
  goal?: string;
  sourceDiscussionId?: string | null;
  participantEmployeeIds?: string[];
};

export async function previewAutonomyPlanAction(
  _prevState: AutonomyPlanActionState,
  formData: FormData
): Promise<AutonomyPlanActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const goal = toStringValue(formData.get("goal"));
  const sourceDiscussionId = toStringValue(formData.get("sourceDiscussionId"));
  const participantEmployeeIds = formData
    .getAll("participantEmployeeIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (!teamId || !goal || participantEmployeeIds.length === 0) {
    return {
      status: "error",
      message: "请先填写自治目标，并确保当前团队里至少有一位员工。"
    };
  }

  try {
    const plan = await postToBackend<AutonomyPlan>("/autonomy/plans", {
      projectId: teamId,
      goal,
      sourceDiscussionId: sourceDiscussionId || null,
      participantEmployeeIds
    });

    return {
      status: "success",
      message: "已生成协作计划，请确认步骤后再启动自治接力。",
      plan,
      goal,
      sourceDiscussionId: sourceDiscussionId || null,
      participantEmployeeIds
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "生成协作计划失败。"
    };
  }
}

export async function startAutonomyRunAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const goal = toStringValue(formData.get("goal"));
  const sourceDiscussionId = toStringValue(formData.get("sourceDiscussionId"));
  const participantEmployeeIds = formData
    .getAll("participantEmployeeIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
  const plannerOutputRaw = toStringValue(formData.get("plannerOutput"));
  let plannerOutput: AutonomyPlan | null = null;

  if (plannerOutputRaw) {
    try {
      plannerOutput = JSON.parse(plannerOutputRaw) as AutonomyPlan;
    } catch {
      return {
        status: "error",
        message: "协作计划数据损坏，请重新生成计划后再启动。"
      };
    }
  }

  const initialEmployeeId =
    toStringValue(formData.get("initialEmployeeId")) ||
    plannerOutput?.steps[0]?.ownerEmployeeId ||
    "";

  if (plannerOutput?.steps.length && initialEmployeeId) {
    plannerOutput = {
      ...plannerOutput,
      steps: plannerOutput.steps.map((step, index) =>
        index === 0
          ? {
              ...step,
              ownerEmployeeId: initialEmployeeId
            }
          : step
      )
    };
  }

  if (!teamId || !goal || !initialEmployeeId || participantEmployeeIds.length === 0) {
    return {
      status: "error",
      message: "自治接力需要任务目标、首位员工和参与员工。"
    };
  }

  try {
    await postToBackend("/autonomy/task-runs", {
      projectId: teamId,
      title: goal.length > 24 ? `${goal.slice(0, 24)}...` : goal,
      goal,
      initialEmployeeId,
      participantEmployeeIds,
      sourceDiscussionId: sourceDiscussionId || null,
      plannerOutput
    });

    revalidatePath(`/teams/${teamId}/workspace`);
    return {
      status: "success",
      message: "自治接力已启动，正在执行第一棒。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "启动自治接力失败。"
    };
  }
}

export async function retryAutonomyStepAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const runId = toStringValue(formData.get("runId"));
  const stepId = toStringValue(formData.get("stepId"));

  if (!teamId || !runId || !stepId) {
    return {
      status: "error",
      message: "缺少自治步骤上下文，无法重试。"
    };
  }

  try {
    await postToBackend(`/autonomy/task-runs/${runId}/retry-step`, { stepId });
    revalidatePath(`/teams/${teamId}/workspace`);
    return {
      status: "success",
      message: "当前棒次已重新入队。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "重试失败。"
    };
  }
}

export async function reassignAutonomyStepAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const runId = toStringValue(formData.get("runId"));
  const stepId = toStringValue(formData.get("stepId"));
  const employeeId = toStringValue(formData.get("employeeId"));

  if (!teamId || !runId || !stepId || !employeeId) {
    return {
      status: "error",
      message: "请选择改派员工后再提交。"
    };
  }

  try {
    await postToBackend(`/autonomy/task-runs/${runId}/reassign-step`, {
      stepId,
      employeeId
    });
    revalidatePath(`/teams/${teamId}/workspace`);
    return {
      status: "success",
      message: "当前棒次已改派并重新入队。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "改派失败。"
    };
  }
}

export async function yinReviewAutonomyRunAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const runId = toStringValue(formData.get("runId"));
  const decision = toStringValue(formData.get("decision"));
  const nextEmployeeId = toStringValue(formData.get("nextEmployeeId"));
  const note = toStringValue(formData.get("note"));

  if (!teamId || !runId || !decision) {
    return {
      status: "error",
      message: "缺少主控仲裁上下文。"
    };
  }

  if (!["continue", "waiting_user", "terminate"].includes(decision)) {
    return {
      status: "error",
      message: "无效的主控决策。"
    };
  }

  try {
    await postToBackend(`/autonomy/task-runs/${runId}/yin-review`, {
      decision,
      nextEmployeeId: nextEmployeeId || null,
      note: note || null
    });
    revalidatePath(`/teams/${teamId}/workspace`);

    return {
      status: "success",
      message:
        decision === "continue"
          ? "主控已下达继续执行决策。"
          : decision === "waiting_user"
            ? "当前自治 run 已切换为等待用户。"
            : "当前自治 run 已终止。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "主控仲裁失败。"
    };
  }
}
