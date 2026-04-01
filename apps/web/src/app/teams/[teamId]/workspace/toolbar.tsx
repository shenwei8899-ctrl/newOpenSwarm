"use client";

import * as React from "react";
import type { ArtifactSummary } from "@openswarm/shared";
import { FormSubmitButton } from "@/components/form-status";
import { ActionToast } from "@/components/action-toast";
import { idleFormActionState } from "@/lib/action-state";
import {
  clearWorkspaceRecordsAction,
  refreshWorkspaceMemoryAction
} from "./actions";

type ProjectArtifactItem = {
  taskId: string;
  taskTitle: string;
  artifact: ArtifactSummary;
  openHref: string;
  downloadHref: string;
};

export function WorkspaceToolbar({
  teamId,
  discussionId,
  projectArtifacts
}: {
  teamId: string;
  discussionId?: string;
  projectArtifacts: ProjectArtifactItem[];
}) {
  const [showArtifacts, setShowArtifacts] = React.useState(false);
  const [clearState, clearAction] = React.useActionState(
    clearWorkspaceRecordsAction,
    idleFormActionState
  );
  const [memoryState, memoryAction] = React.useActionState(
    refreshWorkspaceMemoryAction,
    idleFormActionState
  );

  return (
    <>
      <div style={toolRowStyle}>
        <form action={clearAction} style={toolFormStyle}>
          <input type="hidden" name="teamId" value={teamId} />
          {discussionId ? <input type="hidden" name="discussionId" value={discussionId} /> : null}
          <FormSubmitButton
            idleLabel="清空记录"
            pendingLabel="清空中..."
            style={toolButtonStyle}
          />
        </form>

        <form action={memoryAction} style={toolFormStyle}>
          <input type="hidden" name="teamId" value={teamId} />
          <FormSubmitButton
            idleLabel="更新记忆"
            pendingLabel="更新中..."
            style={toolButtonStyle}
          />
        </form>

        <button
          type="button"
          onClick={() => setShowArtifacts(true)}
          style={toolButtonStyle}
        >
          产出文件
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          派发任务
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          添加附件
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          定时任务
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          SOP流程
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          ∞ 自治接力
        </button>

        <button type="button" style={toolButtonDisabledStyle} disabled>
          员工技能
        </button>
      </div>

      <ActionToast state={clearState} offset={0} />
      <ActionToast state={memoryState} offset={54} />

      {showArtifacts ? (
        <div style={modalOverlayStyle} onClick={() => setShowArtifacts(false)}>
          <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={modalTitleStyle}>项目产出文件</strong>
                <span style={modalSubtitleStyle}>
                  当前项目的文件产出都集中展示在这里，可直接打开或下载。
                </span>
              </div>
              <button type="button" onClick={() => setShowArtifacts(false)} style={closeButtonStyle}>
                关闭
              </button>
            </div>

            <div style={artifactListStyle}>
              {projectArtifacts.length > 0 ? (
                projectArtifacts.map((item) => (
                  <div key={item.artifact.id} style={artifactItemStyle}>
                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <strong style={artifactTitleStyle}>{item.artifact.filename}</strong>
                      <span style={artifactMetaStyle}>来源任务：{item.taskTitle}</span>
                      <code style={artifactPathStyle}>{item.artifact.virtualPath}</code>
                    </div>
                    <div style={artifactActionsStyle}>
                      <a
                        href={item.openHref}
                        target="_blank"
                        rel="noreferrer"
                        style={artifactOpenStyle}
                      >
                        打开
                      </a>
                      <a href={item.downloadHref} download style={artifactDownloadStyle}>
                        下载
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyArtifactsStyle}>当前项目还没有产出文件。</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const toolRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
  gap: 8,
  flexShrink: 0
} satisfies React.CSSProperties;

const toolFormStyle = {
  display: "contents"
} satisfies React.CSSProperties;

const toolButtonStyle = {
  minHeight: 28,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  color: "#70ddff",
  background: "rgba(10, 22, 36, 0.92)",
  fontSize: 11,
  fontWeight: 800,
  border: "none",
  cursor: "pointer"
} satisfies React.CSSProperties;

const toolButtonDisabledStyle = {
  ...toolButtonStyle,
  color: "#5b7186",
  opacity: 0.78,
  cursor: "not-allowed"
} satisfies React.CSSProperties;

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(3, 8, 15, 0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 50
} satisfies React.CSSProperties;

const modalCardStyle = {
  width: "min(920px, calc(100vw - 48px))",
  maxHeight: "min(78vh, 860px)",
  overflow: "auto",
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(10, 21, 35, 0.98), rgba(6, 13, 23, 0.99))",
  border: "1px solid rgba(88, 217, 255, 0.18)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
  padding: 18,
  display: "grid",
  gap: 14
} satisfies React.CSSProperties;

const modalHeaderStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 12
} satisfies React.CSSProperties;

const modalTitleStyle = {
  color: "#f3fbff",
  fontSize: 18
} satisfies React.CSSProperties;

const modalSubtitleStyle = {
  color: "#94b3c7",
  fontSize: 12,
  lineHeight: 1.6
} satisfies React.CSSProperties;

const closeButtonStyle = {
  height: 34,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid rgba(88, 217, 255, 0.18)",
  background: "rgba(255,255,255,0.04)",
  color: "#d8f7ff",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer"
} satisfies React.CSSProperties;

const artifactListStyle = {
  display: "grid",
  gap: 10
} satisfies React.CSSProperties;

const artifactItemStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 14,
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(88, 217, 255, 0.1)"
} satisfies React.CSSProperties;

const artifactTitleStyle = {
  color: "#f2fbff",
  fontSize: 14,
  lineHeight: 1.5
} satisfies React.CSSProperties;

const artifactMetaStyle = {
  color: "#7fb5c8",
  fontSize: 12
} satisfies React.CSSProperties;

const artifactPathStyle = {
  margin: 0,
  color: "#bddfed",
  fontSize: 11,
  lineHeight: 1.5,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
} satisfies React.CSSProperties;

const artifactActionsStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
} satisfies React.CSSProperties;

const artifactOpenStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "#08131d",
  background: "#58d9ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const artifactDownloadStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "#d8f7ff",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(88, 217, 255, 0.18)",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const emptyArtifactsStyle = {
  color: "#91abbb",
  fontSize: 13,
  lineHeight: 1.6,
  padding: "14px 4px"
} satisfies React.CSSProperties;
