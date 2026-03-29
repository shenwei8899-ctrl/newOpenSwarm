"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/action-state";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createDiscussionAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const title = toStringValue(formData.get("title"));
  const participantEmployeeIds = formData
    .getAll("participantEmployeeIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (!teamId || !title || participantEmployeeIds.length === 0) {
    return { status: "error", message: "请填写讨论标题，并至少选择一位参与员工。" };
  }

  try {
    await postToBackend(`/projects/${teamId}/discussions`, {
      mode: "group",
      title,
      participantEmployeeIds
    });

    revalidatePath(`/teams/${teamId}/discussion`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "讨论已创建，可以继续发送消息或直接运行讨论。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "创建讨论失败，请稍后重试。"
    };
  }
}

export async function sendDiscussionMessageAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const discussionId = toStringValue(formData.get("discussionId"));
  const content = toStringValue(formData.get("content"));

  if (!teamId || !discussionId || !content) {
    return { status: "error", message: "请输入消息内容后再发送。" };
  }

  try {
    await postToBackend(`/discussions/${discussionId}/messages`, { content });

    revalidatePath(`/teams/${teamId}/discussion`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "消息已发送，讨论记录已更新。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "发送消息失败，请稍后重试。"
    };
  }
}

export async function runDiscussionAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const discussionId = toStringValue(formData.get("discussionId"));
  const rounds = Number(toStringValue(formData.get("rounds")) || "1");

  if (!teamId || !discussionId) {
    return { status: "error", message: "缺少讨论上下文，无法运行。" };
  }

  try {
    await postToBackend(`/discussions/${discussionId}/run`, {
      rounds: Number.isFinite(rounds) && rounds > 0 ? rounds : 1
    });

    revalidatePath(`/teams/${teamId}/discussion`);
    revalidatePath(`/teams/${teamId}/workspace`);

    return { status: "success", message: "讨论已进入执行队列，稍后会回写最新消息与摘要。" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "运行讨论失败，请稍后重试。"
    };
  }
}
