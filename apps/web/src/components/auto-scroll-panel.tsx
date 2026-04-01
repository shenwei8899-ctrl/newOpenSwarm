"use client";

import * as React from "react";

type AutoScrollPanelProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  watchKey?: string;
};

export function AutoScrollPanel({
  children,
  style,
  watchKey
}: AutoScrollPanelProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [watchKey]);

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}
