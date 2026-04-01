"use server";

import { revalidatePath } from "next/cache";
import { deleteFromBackend } from "@/lib/server-api";

export async function deleteTeamAction(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "").trim();

  if (!teamId) {
    throw new Error("缺少团队 ID，无法删除。");
  }

  await deleteFromBackend<{ ok: true }>(`/projects/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/");
}
