"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type LiveRefreshProps = {
  active: boolean;
  intervalMs?: number;
};

export function LiveRefresh({ active, intervalMs = 3000 }: LiveRefreshProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (!active) {
      return;
    }

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      router.refresh();
    };

    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs, router]);

  return null;
}
