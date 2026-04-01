"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/action-state";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildDiscussionTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "工作台讨论";
  }

  return normalized.length > 20 ? `${normalized.slice(0, 20)}...` : normalized;
}

export async function sendWorkspaceMessageAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const teamId = toStringValue(formData.get("teamId"));
  const discussionId = toStringValue(formData.get("discussionId"));
  const content = toStringValue(formData.get("content"));
  const participantEmployeeIds = formData
    .getAll("participantEmployeeIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (!teamId || !content) {
    return { status: "error", message: "请输入消息内容后再发送。" };
  }

  if (!discussionId && participantEmployeeIds.length === 0) {
    return { status: "error", message: "当前团队还没有可参与讨论的员工。" };
  }

  try {
    let resolvedDiscussionId = discussionId;

    if (!resolvedDiscussionId) {
      const created = await postToBackend<{ id: string }>(`/projects/${teamId}/discussions`, {
        mode: "group",
        title: buildDiscussionTitle(content),
        participantEmployeeIds
      });
      resolvedDiscussionId = created.id;
    }

    await postToBackend(`/discussions/${resolvedDiscussionId}/messages`, { content });
    await postToBackend(`/discussions/${resolvedDiscussionId}/run`, { rounds: 1 });

    revalidatePath(`/teams/${teamId}/workspace`);
    revalidatePath(`/teams/${teamId}/discussion`);
    revalidatePath(`/teams/${teamId}/tasks`);

    return {
      status: "success",
      message: "消息已发送，团队正在生成最新讨论结果。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "发送失败，请稍后重试。"
    };
  }
}
