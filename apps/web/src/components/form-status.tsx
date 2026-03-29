"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import type { FormActionState } from "@/lib/action-state";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel?: string;
  style?: React.CSSProperties;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  style
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" style={{ ...style, opacity: pending ? 0.72 : 1, cursor: pending ? "progress" : "pointer" }} disabled={pending}>
      {pending ? pendingLabel ?? `${idleLabel}中...` : idleLabel}
    </button>
  );
}

export function FormFeedback({ state }: { state: FormActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <div
      style={{
        borderRadius: 14,
        padding: "10px 12px",
        border: isError
          ? "1px solid rgba(255, 120, 120, 0.24)"
          : "1px solid rgba(77, 208, 255, 0.18)",
        background: isError ? "rgba(78, 24, 24, 0.36)" : "rgba(8, 30, 44, 0.72)",
        color: isError ? "#ffc2c2" : "#c9f4ff",
        fontSize: 14,
        lineHeight: 1.5
      }}
    >
      {state.message}
    </div>
  );
}
