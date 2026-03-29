"use server";

import { revalidatePath } from "next/cache";
import { postToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createTaskAction(formData: FormData): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const title = toStringValue(formData.get("title"));
  const description = toStringValue(formData.get("description"));
  const sourceDiscussionId = toStringValue(formData.get("sourceDiscussionId"));

  if (!projectId || !title) {
    return;
  }

  await postToBackend(`/projects/${projectId}/tasks`, {
    title,
    description,
    sourceDiscussionId: sourceDiscussionId || null
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
}

export async function assignTaskAction(formData: FormData): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const taskId = toStringValue(formData.get("taskId"));
  const employeeId = toStringValue(formData.get("employeeId"));

  if (!projectId || !taskId || !employeeId) {
    return;
  }

  await postToBackend(`/tasks/${taskId}/assign`, {
    employeeIds: [employeeId]
  });

  revalidatePath(`/projects/${projectId}/tasks`);
}

export async function runTaskAction(formData: FormData): Promise<void> {
  const projectId = toStringValue(formData.get("projectId"));
  const taskId = toStringValue(formData.get("taskId"));
  const employeeId = toStringValue(formData.get("employeeId"));

  if (!projectId || !taskId || !employeeId) {
    return;
  }

  await postToBackend(`/tasks/${taskId}/run`, {
    employeeId
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
}
