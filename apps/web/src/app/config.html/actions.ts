"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/lib/action-state";
import { putToBackend } from "@/lib/server-api";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveModelSettingsAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const provider = toStringValue(formData.get("provider"));
  const model = toStringValue(formData.get("model"));
  const apiKey = toStringValue(formData.get("apiKey"));

  if (!provider || !model) {
    return { status: "error", message: "请先选择模型提供商和主模型。" };
  }

  try {
    await putToBackend("/settings/model", {
      provider,
      model,
      apiKey: apiKey || null
    });

    revalidatePath("/config.html");

    return {
      status: "success",
      message: "模型配置已保存。重启 DeerFlow 服务后，新模型和 Key 会正式生效。"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "保存模型配置失败，请稍后重试。"
    };
  }
}
