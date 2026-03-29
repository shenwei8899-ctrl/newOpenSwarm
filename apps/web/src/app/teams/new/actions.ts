"use server";

import { redirect } from "next/navigation";
import { postToBackend, putToBackend } from "@/lib/server-api";
import type { ProjectSummary } from "@openswarm/shared";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createTeamAction(formData: FormData): Promise<void> {
  const teamMode = toStringValue(formData.get("teamMode")) || "create";
  const name = toStringValue(formData.get("name"));
  const existingTeamId = toStringValue(formData.get("existingTeamId"));
  const selectedEmployeeIds = formData
    .getAll("employeeId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (teamMode === "select" && existingTeamId) {
    if (selectedEmployeeIds.length > 0) {
      await putToBackend(`/projects/${existingTeamId}/employees`, {
        employeeIds: selectedEmployeeIds
      });
    }

    redirect(`/teams/${existingTeamId}/skills`);
  }

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

  redirect(`/teams/${project.id}/skills`);
}
