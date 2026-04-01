"use client";

import * as React from "react";
import type { FormActionState } from "@/lib/action-state";

export function ActionToast({
  state,
  offset = 0
}: {
  state: FormActionState;
  offset?: number;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (state.status === "idle" || !state.message) {
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [state.status, state.message]);

  if (!visible || state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";

  return (
    <div
      style={{
        ...toastStyle,
        bottom: 20 + offset,
        border: isError
          ? "1px solid rgba(255, 120, 120, 0.22)"
          : "1px solid rgba(77, 208, 255, 0.16)",
        background: isError
          ? "rgba(78, 24, 24, 0.9)"
          : "rgba(7, 25, 39, 0.94)",
        color: isError ? "#ffc2c2" : "#d2f7ff"
      }}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </div>
  );
}

const toastStyle = {
  position: "fixed",
  right: 20,
  zIndex: 80,
  maxWidth: 420,
  minWidth: 220,
  padding: "11px 14px",
  borderRadius: 12,
  boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
  fontSize: 13,
  lineHeight: 1.55,
  pointerEvents: "none"
} satisfies React.CSSProperties;
