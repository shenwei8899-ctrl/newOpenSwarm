"use server";

import { redirect } from "next/navigation";
import { postToBackend, putToBackend } from "@/lib/server-api";
import type { ProjectSummary } from "@openswarm/shared";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createTeamAction(formData: FormData): Promise<void> {
  const name = toStringValue(formData.get("name"));
  const selectedEmployeeIds = formData
    .getAll("employeeId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!name) {
    return;
  }

  const project = await postToBackend<ProjectSummary>("/projects", {
    name,
    templateId: null
  });

  if (selectedEmployeeIds.length > 0) {
    await putToBackend(`/projects/${project.id}/employees`, {
      employeeIds: selectedEmployeeIds
    });
  }

  redirect(`/teams/${project.id}/members`);
}
