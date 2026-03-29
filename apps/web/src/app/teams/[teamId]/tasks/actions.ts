"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/action-state";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createTaskAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const title = toStringValue(formData.get("title"));
  const description = toStringValue(formData.get("description"));
  const sourceDiscussionId = toStringValue(formData.get("sourceDiscussionId"));

  if (!teamId || !title) {
    return { status: "error", message: "请先填写任务标题。" };
  }

  try {
    await postToBackend(`/projects/${teamId}/tasks`, {
      title,
      description,
      sourceDiscussionId: sourceDiscussionId || null
    });

    revalidatePath(`/teams/${teamId}/tasks`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "任务已创建，可以继续指派员工或直接执行。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "创建任务失败，请稍后重试。"
    };
  }
}

export async function assignTaskAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const taskId = toStringValue(formData.get("taskId"));
  const employeeId = toStringValue(formData.get("employeeId"));

  if (!teamId || !taskId || !employeeId) {
    return { status: "error", message: "请选择员工后再执行指派。" };
  }

  try {
    await postToBackend(`/tasks/${taskId}/assign`, {
      employeeIds: [employeeId]
    });

    revalidatePath(`/teams/${teamId}/tasks`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "员工指派成功，任务归属已更新。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "指派员工失败，请稍后重试。"
    };
  }
}

export async function runTaskAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const taskId = toStringValue(formData.get("taskId"));
  const employeeId = toStringValue(formData.get("employeeId"));

  if (!teamId || !taskId || !employeeId) {
    return { status: "error", message: "请选择执行员工后再运行任务。" };
  }

  try {
    await postToBackend(`/tasks/${taskId}/run`, {
      employeeId
    });

    revalidatePath(`/teams/${teamId}/tasks`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "任务已进入执行队列，稍后刷新即可看到最新状态。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "执行任务失败，请稍后重试。"
    };
  }
}
