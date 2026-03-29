"use client";

import * as React from "react";
import { FormFeedback, FormSubmitButton } from "@/components/form-status";
import { idleFormActionState } from "@/lib/action-state";
import {
  createDiscussionAction,
  runDiscussionAction,
  sendDiscussionMessageAction
} from "./actions";

export function CreateDiscussionForm({
  teamId,
  selectedEmployees,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  selectedEmployees: Array<{ id: string; name: string }>;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(createDiscussionAction, idleFormActionState);

  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <input type="hidden" name="teamId" value={teamId} />
      <input name="title" placeholder="例如：早餐店小红书引流讨论" style={inputStyle} required />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {selectedEmployees.map((employee) => (
          <label
            key={employee.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 999,
              border: "1px solid rgba(77, 208, 255, 0.18)",
              background: "rgba(255,255,255,0.02)",
              color: "#d9f5ff"
            }}
          >
            <input type="checkbox" name="participantEmployeeIds" value={employee.id} defaultChecked />
            {employee.name}
          </label>
        ))}
      </div>
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="创建讨论" pendingLabel="创建中..." style={buttonStyle} />
    </form>
  );
}

export function SendDiscussionMessageForm({
  teamId,
  discussionId,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  discussionId: string;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(sendDiscussionMessageAction, idleFormActionState);

  return (
    <form
      action={action}
      style={{
        borderRadius: 24,
        padding: 24,
        border: "1px solid rgba(77, 208, 255, 0.14)",
        background: "rgba(7, 21, 38, 0.9)",
        display: "grid",
        gap: 12
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="discussionId" value={discussionId} />
      <textarea
        name="content"
        placeholder="输入你的任务、问题或补充背景..."
        style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
        required
      />
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="发送消息" pendingLabel="发送中..." style={buttonStyle} />
    </form>
  );
}

export function RunDiscussionForm({
  teamId,
  discussionId,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  discussionId: string;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(runDiscussionAction, idleFormActionState);

  return (
    <form
      action={action}
      style={{
        borderRadius: 24,
        padding: 24,
        border: "1px solid rgba(77, 208, 255, 0.14)",
        background: "rgba(7, 21, 38, 0.9)",
        display: "grid",
        gap: 12,
        alignContent: "start"
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="discussionId" value={discussionId} />
      <div style={{ color: "#95b4c7", fontSize: 14 }}>运行轮次</div>
      <input type="number" name="rounds" min={1} max={3} defaultValue={1} style={{ ...inputStyle, width: 120 }} />
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="运行讨论" pendingLabel="排队中..." style={buttonStyle} />
    </form>
  );
}
