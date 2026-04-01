"use client";

import * as React from "react";
import { FormSubmitButton } from "@/components/form-status";
import { ActionToast } from "@/components/action-toast";
import { idleFormActionState } from "@/lib/action-state";
import { sendWorkspaceMessageAction } from "./actions";

export function WorkspaceComposerForm({
  teamId,
  discussionId,
  participantEmployeeIds,
  textareaStyle,
  buttonStyle
}: {
  teamId: string;
  discussionId?: string;
  participantEmployeeIds: string[];
  textareaStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(sendWorkspaceMessageAction, idleFormActionState);

  return (
    <form action={action} style={{ display: "grid" }}>
      <input type="hidden" name="teamId" value={teamId} />
      {discussionId ? <input type="hidden" name="discussionId" value={discussionId} /> : null}
      {participantEmployeeIds.map((employeeId) => (
        <input key={employeeId} type="hidden" name="participantEmployeeIds" value={employeeId} />
      ))}

      <div style={{ position: "relative", display: "block" }}>
        <textarea
          name="content"
          aria-label="工作台输入框"
          placeholder="向团队下达任务、补充要求，或调整当前执行计划..."
          style={textareaStyle}
          required
        />
        <FormSubmitButton idleLabel="发送" pendingLabel="发送中..." style={buttonStyle} />
      </div>

      <ActionToast state={state} offset={108} />
    </form>
  );
}
