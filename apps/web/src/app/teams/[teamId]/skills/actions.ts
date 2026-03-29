"use server";

import { redirect } from "next/navigation";
import { putToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveTeamSkillsAction(formData: FormData): Promise<void> {
  const teamId = toStringValue(formData.get("teamId"));
  const employeeIds = formData
    .getAll("employeeId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!teamId) {
    return;
  }

  const assignments = employeeIds.map((employeeId) => {
    const skillIds = formData
      .getAll(`skill:${employeeId}`)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    return {
      employeeId,
      skillIds
    };
  });

  await putToBackend(`/projects/${teamId}/skill-assignments`, {
    assignments
  });

  redirect(`/teams/${teamId}/workspace`);
}
