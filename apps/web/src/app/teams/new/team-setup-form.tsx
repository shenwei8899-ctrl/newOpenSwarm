"use client";

import * as React from "react";
import type { EmployeeCatalogItem, ProjectSummary } from "@openswarm/shared";
import { createTeamAction } from "./actions";

type TeamSetupFormProps = {
  employees: EmployeeCatalogItem[];
  projects: ProjectSummary[];
  preselectedEmployeeIds: string[];
};

function getEmployeeAvatar(employeeId: string, index: number) {
  const avatarMap: Record<string, string> = {
    employee_xhs_ops: "/assets/avatar/avatar-01.svg",
    employee_crawler: "/assets/avatar/researcher-01.svg",
    employee_backend: "/assets/avatar/professor-01.svg"
  };

  if (avatarMap[employeeId]) {
    return avatarMap[employeeId];
  }

  const fallback = [
    "/assets/avatar/avatar-02.svg",
    "/assets/avatar/avatar-03.svg",
    "/assets/avatar/avatar-04.svg",
    "/assets/avatar/avatar-05.svg"
  ];

  return fallback[index % fallback.length];
}

export function TeamSetupForm({
  employees,
  projects,
  preselectedEmployeeIds
}: TeamSetupFormProps) {
  const [teamMode, setTeamMode] = React.useState<"create" | "select">("create");
  const preselectedSet = React.useMemo(
    () => new Set(preselectedEmployeeIds),
    [preselectedEmployeeIds]
  );

  return (
    <form
      action={createTeamAction}
      className={`team-form${teamMode === "select" ? " team-form-select" : ""}`}
    >
      <div className="mode-row">
        <label className="mode-option">
          <input
            type="radio"
            name="teamMode"
            value="create"
            checked={teamMode === "create"}
            onChange={() => setTeamMode("create")}
          />
          <span>创建新团队</span>
        </label>
        <label className="mode-option">
          <input
            type="radio"
            name="teamMode"
            value="select"
            checked={teamMode === "select"}
            onChange={() => setTeamMode("select")}
          />
          <span>选择已有团队</span>
        </label>
      </div>

      <div className="section-divider" />

      {teamMode === "select" ? (
        <div className="select-team-block">
          <label className="field-label" htmlFor="existing-team-id">
            选择团队
          </label>
          <select
            id="existing-team-id"
            name="existingTeamId"
            className="field-select"
            defaultValue=""
            required
          >
            <option value="">从已有团队继续</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {teamMode === "create" ? (
        <>
          <div className="team-name-block">
            <label className="field-label" htmlFor="team-name">
              团队名称
            </label>
            <input
              id="team-name"
              name="name"
              className="field-input"
              defaultValue={preselectedSet.size > 0 ? "我的数字员工团队" : ""}
              placeholder="输入团队名称"
              required
            />
          </div>

          <div className="team-employee-section">
            <div className="section-title">选择数字员工 · 点击加入/取消加入本项目</div>
            <div className="employee-grid">
              {employees.map((employee, index) => {
                const checked = preselectedSet.has(employee.id);

                return (
                  <label key={employee.id} className="employee-card">
                    <input
                      type="checkbox"
                      name="employeeId"
                      value={employee.id}
                      defaultChecked={checked}
                    />
                    <div className="employee-card-box">
                      <img
                        className="employee-avatar"
                        src={getEmployeeAvatar(employee.id, index)}
                        alt={employee.name}
                      />
                      <div className="employee-name">{employee.name}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <div className="submit-row">
        <button type="submit" className="submit-button">
          下一步
        </button>
      </div>
    </form>
  );
}
