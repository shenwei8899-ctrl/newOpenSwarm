import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OpenSwarm SaaS",
  description: "Shared-runtime digital employee SaaS"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ height: "100%" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(109, 214, 255, 0.7) transparent;
          }

          *::-webkit-scrollbar {
            width: 2px;
            height: 2px;
          }

          *::-webkit-scrollbar-track {
            background: transparent;
          }

          *::-webkit-scrollbar-thumb {
            background: rgba(109, 214, 255, 0.72);
            border-radius: 999px;
          }

          *::-webkit-scrollbar-thumb:hover {
            background: rgba(140, 232, 255, 0.92);
          }
        `}</style>
      </head>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          minHeight: "100%",
          background: "#050b16"
        }}
      >
        {children}
      </body>
    </html>
  );
}
