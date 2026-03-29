"use server";

import { revalidatePath } from "next/cache";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createDiscussionAction(formData: FormData): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const title = toStringValue(formData.get("title"));
  const participantEmployeeIds = formData
    .getAll("participantEmployeeIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (!projectId || !title || participantEmployeeIds.length === 0) {
    return;
  }

  await postToBackend(`/projects/${projectId}/discussions`, {
    mode: "group",
    title,
    participantEmployeeIds
  });

  revalidatePath(`/projects/${projectId}/discussion`);
  revalidatePath(`/projects/${projectId}`);
}

export async function sendDiscussionMessageAction(
  formData: FormData
): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const discussionId = toStringValue(formData.get("discussionId"));
  const content = toStringValue(formData.get("content"));

  if (!projectId || !discussionId || !content) {
    return;
  }

  await postToBackend(`/discussions/${discussionId}/messages`, {
    content
  });

  revalidatePath(`/projects/${projectId}/discussion`);
}

export async function runDiscussionAction(formData: FormData): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const discussionId = toStringValue(formData.get("discussionId"));
  const rounds = Number(toStringValue(formData.get("rounds")) || "1");

  if (!projectId || !discussionId) {
    return;
  }

  await postToBackend(`/discussions/${discussionId}/run`, {
    rounds: Number.isFinite(rounds) && rounds > 0 ? rounds : 1
  });

  revalidatePath(`/projects/${projectId}/discussion`);
}
