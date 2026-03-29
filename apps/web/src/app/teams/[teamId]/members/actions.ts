"use server";

import { redirect } from "next/navigation";
import { putToBackend } from "@/lib/server-api";

export async function saveTeamMembersAction(formData: FormData): Promise<void> {
  const teamId = typeof formData.get("teamId") === "string" ? String(formData.get("teamId")) : "";
  const employeeIds = formData
    .getAll("employeeId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!teamId) {
    return;
  }

  await putToBackend(`/projects/${teamId}/employees`, {
    employeeIds
  });

  redirect(`/teams/${teamId}/skills`);
}
