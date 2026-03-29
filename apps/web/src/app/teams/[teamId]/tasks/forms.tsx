"use client";

import * as React from "react";
import { FormFeedback, FormSubmitButton } from "@/components/form-status";
import { idleFormActionState } from "@/lib/action-state";
import { assignTaskAction, createTaskAction, runTaskAction } from "./actions";

type EmployeeOption = { id: string; name: string };
type DiscussionOption = { id: string; title: string };

export function CreateTaskForm({
  teamId,
  discussions,
  defaultDiscussionId,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  discussions: DiscussionOption[];
  defaultDiscussionId: string;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(createTaskAction, idleFormActionState);

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <input type="hidden" name="teamId" value={teamId} />
      <input name="title" placeholder="例如：输出门店两周引流执行方案" style={inputStyle} required />
      <textarea
        name="description"
        placeholder="补充任务目标、结构要求或交付格式..."
        style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
      />
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: "#95b4c7", fontSize: 14 }}>关联讨论</div>
        <select
          name="sourceDiscussionId"
          defaultValue={defaultDiscussionId}
          style={inputStyle}
        >
          <option value="">不关联讨论</option>
          {discussions.map((discussion) => (
            <option key={discussion.id} value={discussion.id}>
              {discussion.title}
            </option>
          ))}
        </select>
        <div style={{ color: "#7fa8be", fontSize: 13 }}>
          默认选中最近讨论，也可以改成不关联或切换到其他讨论。
        </div>
      </div>
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="创建任务" pendingLabel="创建中..." style={buttonStyle} />
    </form>
  );
}

export function AssignTaskForm({
  teamId,
  taskId,
  employees,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  taskId: string;
  employees: EmployeeOption[];
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(assignTaskAction, idleFormActionState);

  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="taskId" value={taskId} />
      <select name="employeeId" defaultValue={employees[0]?.id} style={inputStyle}>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="指派员工" pendingLabel="指派中..." style={buttonStyle} />
    </form>
  );
}

export function RunTaskForm({
  teamId,
  taskId,
  employees,
  inputStyle,
  buttonStyle
}: {
  teamId: string;
  taskId: string;
  employees: EmployeeOption[];
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
}) {
  const [state, action] = React.useActionState(runTaskAction, idleFormActionState);

  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="taskId" value={taskId} />
      <select name="employeeId" defaultValue={employees[0]?.id} style={inputStyle}>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
      <FormFeedback state={state} />
      <FormSubmitButton idleLabel="执行任务" pendingLabel="执行中..." style={buttonStyle} />
    </form>
  );
}
