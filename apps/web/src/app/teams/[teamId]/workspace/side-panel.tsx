"use client";

import * as React from "react";
import type {
  AutonomyPlan,
  AutonomyPlanStep,
  AutonomyRunDetail,
  DiscussionSessionSummary,
  ProjectEmployeeItem
} from "@openswarm/shared";
import { AutoScrollPanel } from "@/components/auto-scroll-panel";
import { FormFeedback, FormSubmitButton } from "@/components/form-status";
import { idleFormActionState } from "@/lib/action-state";
import {
  previewAutonomyPlanAction,
  reassignAutonomyStepAction,
  retryAutonomyStepAction,
  startAutonomyRunAction,
  type AutonomyPlanActionState,
  yinReviewAutonomyRunAction
} from "./autonomy-actions";

type WorkspaceSidePanelProps = {
  teamId: string;
  latestDiscussion: DiscussionSessionSummary | null;
  selectedEmployees: ProjectEmployeeItem[];
  latestAutonomyRun: AutonomyRunDetail | null;
  suggestedGoal: string;
  initialTab?: PanelTab;
};

export type PanelTab = "discussion" | "team" | "autonomy";

const idleAutonomyPlanActionState: AutonomyPlanActionState = {
  status: "idle"
};

export function WorkspaceSidePanel({
  teamId,
  latestDiscussion,
  selectedEmployees,
  latestAutonomyRun,
  suggestedGoal,
  initialTab
}: WorkspaceSidePanelProps) {
  const [tab, setTab] = React.useState<PanelTab>(
    initialTab ?? (latestAutonomyRun ? "autonomy" : "discussion")
  );

  React.useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const sideScrollWatchKey = [
    tab,
    latestDiscussion?.id ?? "no-discussion",
    latestDiscussion?.updatedAt ?? "no-discussion-update",
    latestAutonomyRun?.id ?? "no-autonomy",
    latestAutonomyRun?.updatedAt ?? "no-autonomy-update",
    selectedEmployees.map((employee) => employee.id).join(",") || "no-employees"
  ].join("|");

  return (
    <aside style={sideColumnStyle}>
      <div style={sideTabsStyle}>
        <TabButton active={tab === "discussion"} onClick={() => setTab("discussion")}>
          讨论
        </TabButton>
        <TabButton active={tab === "team"} onClick={() => setTab("team")}>
          团队
        </TabButton>
        <TabButton active={tab === "autonomy"} onClick={() => setTab("autonomy")}>
          ∞ 自治接力
        </TabButton>
      </div>

      <AutoScrollPanel style={sideBodyStyle} watchKey={sideScrollWatchKey}>
        {tab === "discussion" ? (
          <DiscussionPanel latestDiscussion={latestDiscussion} />
        ) : null}
        {tab === "team" ? <TeamPanel employees={selectedEmployees} /> : null}
        {tab === "autonomy" ? (
          <AutonomyPanel
            teamId={teamId}
            latestDiscussion={latestDiscussion}
            selectedEmployees={selectedEmployees}
            latestAutonomyRun={latestAutonomyRun}
            suggestedGoal={suggestedGoal}
          />
        ) : null}
      </AutoScrollPanel>
    </aside>
  );
}

function formatStableDateTime(isoString: string) {
  const timestamp = new Date(isoString).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function splitDiscussionSummary(summary: string) {
  const normalized = summary
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length > 1) {
    return normalized;
  }

  return summary
    .split(/(?<=[。！？；])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function DiscussionPanel({
  latestDiscussion
}: {
  latestDiscussion: DiscussionSessionSummary | null;
}) {
  return (
    <section style={discussionPanelStyle}>
      <div style={discussionHeaderStyle}>
        <span style={discussionEyebrowStyle}>最近讨论</span>
        {latestDiscussion?.updatedAt ? (
          <span style={discussionMetaStyle}>
            {formatStableDateTime(latestDiscussion.updatedAt)}
          </span>
        ) : null}
      </div>

      <div style={recentDiscussionStyle}>
        <div style={recentDiscussionTitleWrapStyle}>
          <div style={recentDiscussionTitleStyle}>
            {latestDiscussion?.title ?? "还没有讨论"}
          </div>
          <span style={recentDiscussionStatusStyle}>
            {latestDiscussion ? "最新摘要" : "待开始"}
          </span>
        </div>
        {latestDiscussion ? (
          <div style={recentDiscussionInfoRowStyle}>
            <span style={recentDiscussionInfoChipStyle}>
              {latestDiscussion.participantEmployeeIds.length} 位员工
            </span>
            <span style={recentDiscussionInfoTextStyle}>已同步到团队主工作台</span>
          </div>
        ) : null}
        <div style={recentDiscussionTextWrapStyle}>
          {splitDiscussionSummary(
            latestDiscussion?.summary ?? "从讨论页发起一轮协作，这里会自动显示团队最新结论。"
          ).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`} style={recentDiscussionTextStyle}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamPanel({ employees }: { employees: ProjectEmployeeItem[] }) {
  const employeeIndexById = new Map(employees.map((employee, index) => [employee.id, index]));

  return (
    <section style={teamPanelStyle}>
      <div style={employeeListStyle}>
        {employees.length > 0 ? (
          employees.map((employee) => (
            <div key={employee.id} style={employeeCardStyle}>
              <div style={employeeHeadStyle}>
                <div style={employeeAvatarStyle}>
                  <img
                    src={getEmployeeAvatar(employee.id, employeeIndexById.get(employee.id) ?? 0)}
                    alt={employee.name}
                    style={employeeAvatarImageStyle}
                  />
                </div>
                <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                  <div style={employeeNameStyle}>{employee.name}</div>
                  <div style={employeeDescStyle}>{employee.description}</div>
                </div>
              </div>
              <div style={employeeMetaStyle}>
                <span style={employeeStatusStyle}>预热中</span>
                <span>{fakeGateway(employee.id)}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={emptySideStyle}>当前团队还没有选择员工。</div>
        )}
      </div>
    </section>
  );
}

function AutonomyPanel({
  teamId,
  latestDiscussion,
  selectedEmployees,
  latestAutonomyRun,
  suggestedGoal
}: {
  teamId: string;
  latestDiscussion: DiscussionSessionSummary | null;
  selectedEmployees: ProjectEmployeeItem[];
  latestAutonomyRun: AutonomyRunDetail | null;
  suggestedGoal: string;
}) {
  const [planState, planAction] = React.useActionState(
    previewAutonomyPlanAction,
    idleAutonomyPlanActionState
  );
  const [createState, createAction] = React.useActionState(
    startAutonomyRunAction,
    idleFormActionState
  );
  const [draftPlan, setDraftPlan] = React.useState<AutonomyPlan | null>(null);
  const [draggedStepKey, setDraggedStepKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraftPlan(planState.plan ?? null);
    setDraggedStepKey(null);
  }, [planState.plan]);

  const effectivePlan = draftPlan ?? planState.plan ?? null;
  const effectiveGoal = planState.goal ?? latestAutonomyRun?.goal ?? suggestedGoal;
  const effectiveSourceDiscussionId =
    planState.sourceDiscussionId ??
    latestDiscussion?.id ??
    latestAutonomyRun?.sourceDiscussionId ??
    "";
  const effectiveParticipantEmployeeIds =
    planState.participantEmployeeIds ?? selectedEmployees.map((employee) => employee.id);
  const currentStepId =
    latestAutonomyRun?.steps.find((step) => ["running", "blocked", "ready"].includes(step.status))
      ?.id ?? latestAutonomyRun?.steps.find((step) => step.status !== "done")?.id ?? null;
  const rawCompletedCount =
    latestAutonomyRun?.steps.filter(
      (step) => step.status === "done" || step.status === "completed"
    ).length ?? 0;
  const totalCount = latestAutonomyRun?.steps.length ?? 0;
  const completedCount =
    latestAutonomyRun?.status === "completed" ? totalCount : rawCompletedCount;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const latestEvent = latestAutonomyRun?.events.at(-1) ?? null;
  const runningSteps = latestAutonomyRun?.steps.filter((step) => step.status === "running") ?? [];

  return (
    <section style={{ ...panelSectionStyle, minHeight: 0 }}>
      <div style={autonomyHeaderStyle}>
        <span style={autonomyBadgeStyle}>{latestAutonomyRun?.status ?? "idle"}</span>
      </div>

      <form action={planAction} style={autonomyLaunchStyle}>
        <input type="hidden" name="teamId" value={teamId} />
        <input type="hidden" name="sourceDiscussionId" value={effectiveSourceDiscussionId} />
        {selectedEmployees.map((employee) => (
          <input
            key={employee.id}
            type="hidden"
            name="participantEmployeeIds"
            value={employee.id}
          />
        ))}
        <textarea
          name="goal"
          defaultValue={effectiveGoal}
          style={autonomyGoalStyle}
          placeholder="输入需要团队自治接力完成的目标..."
        />
        <FormSubmitButton
          idleLabel="生成执行计划"
          pendingLabel="规划中..."
          style={secondaryActionStyle}
        />
        <AutonomyFeedback state={planState} />
      </form>

      {effectivePlan ? (
        <section style={planPreviewStyle}>
          <div style={planPreviewHeadStyle}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={planPreviewEyebrowStyle}>计划预览</div>
              <div style={planPreviewTitleStyle}>{effectivePlan.title}</div>
            </div>
            <span style={planStepCountStyle}>{effectivePlan.steps.length} 步</span>
          </div>

          <div style={planHintStyle}>拖动步骤可调整接力顺序，系统会按新的顺序重建前后依赖。</div>

          <div style={planStepListStyle}>
            {effectivePlan.steps.map((step, index) => (
              <div
                key={step.stepKey}
                draggable
                onDragStart={() => setDraggedStepKey(step.stepKey)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!draggedStepKey || draggedStepKey === step.stepKey || !effectivePlan) {
                    return;
                  }

                  setDraftPlan(reorderPlanSteps(effectivePlan, draggedStepKey, step.stepKey));
                  setDraggedStepKey(null);
                }}
                onDragEnd={() => setDraggedStepKey(null)}
                style={{
                  ...planStepCardStyle,
                  ...(draggedStepKey === step.stepKey ? planStepCardDraggingStyle : null)
                }}
              >
                <div style={planStepTopStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={planStepIndexStyle}>STEP {index + 1}</span>
                    <span style={planModeChipStyle}>
                      {step.executionMode === "parallel" ? "并行" : "串行"}
                    </span>
                  </div>
                  <span style={planStepOwnerStyle}>
                    {selectedEmployees.find((employee) => employee.id === step.ownerEmployeeId)?.name ??
                      step.ownerEmployeeId}
                  </span>
                </div>
                <div style={planStepTitleStyle}>{step.title}</div>
                <div style={planStepGoalStyle}>{step.goal}</div>
                <div style={dependsWrapStyle}>
                  <span style={dependsLabelStyle}>依赖</span>
                  {step.dependsOn.length > 0 ? (
                    step.dependsOn.map((dependency) => (
                      <span key={dependency} style={dependencyChipStyle}>
                        {dependency.replaceAll("_", " ")}
                      </span>
                    ))
                  ) : (
                    <span style={dependencyChipStyle}>无前置步骤</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {effectivePlan.warnings.length > 0 ? (
            <div style={planWarningsStyle}>
              {effectivePlan.warnings.map((warning, index) => (
                <div key={`${warning}-${index}`} style={planWarningItemStyle}>
                  {warning}
                </div>
              ))}
            </div>
          ) : null}

          <form action={createAction} style={planConfirmStyle}>
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="goal" value={effectiveGoal} />
            <input type="hidden" name="sourceDiscussionId" value={effectiveSourceDiscussionId} />
            <input type="hidden" name="plannerOutput" value={JSON.stringify(effectivePlan)} />
            {effectiveParticipantEmployeeIds.map((employeeId) => (
              <input
                key={employeeId}
                type="hidden"
                name="participantEmployeeIds"
                value={employeeId}
              />
            ))}
            <label style={planSelectWrapStyle}>
              <span style={planSelectLabelStyle}>首棒员工</span>
              <select
                name="initialEmployeeId"
                defaultValue={effectivePlan.steps[0]?.ownerEmployeeId ?? selectedEmployees[0]?.id ?? ""}
                style={planSelectStyle}
              >
                {selectedEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <FormSubmitButton
              idleLabel="确认计划并启动"
              pendingLabel="启动中..."
              style={primaryActionStyle}
            />
            <FormFeedback state={createState} />
          </form>
        </section>
      ) : null}

      {latestAutonomyRun ? (
        <div style={timelineWrapStyle}>
          {["needs_yin", "blocked", "waiting_user"].includes(latestAutonomyRun.status) ? (
            <div
              style={{
                ...runAlertStyle,
                ...getRunAlertTone(latestAutonomyRun.status)
              }}
            >
              <div style={runAlertTitleStyle}>
                {latestAutonomyRun.status === "needs_yin"
                  ? "当前自治链需要主控仲裁"
                  : latestAutonomyRun.status === "waiting_user"
                    ? "当前自治链等待用户补充"
                    : "当前自治链已阻塞"}
              </div>
              <div style={runAlertTextStyle}>
                {latestAutonomyRun.lastError ??
                  latestAutonomyRun.summary ??
                  "请查看下方时间轴和步骤详情，决定继续、等待用户或终止。"}
              </div>
            </div>
          ) : null}

          <div style={timelineMetaStyle}>
            <div style={timelineMetaTopStyle}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={timelineMetaTitleStyle}>{latestAutonomyRun.title}</div>
                <div style={timelineMetaTextStyle}>
                  {latestAutonomyRun.summary ?? latestAutonomyRun.goal}
                </div>
                {runningSteps.length > 1 ? (
                  <div style={parallelHintStyle}>
                    当前并行执行 {runningSteps.length} 步：
                    {runningSteps
                      .map((step) => selectedEmployees.find((employee) => employee.id === step.ownerEmployeeId)?.name ?? step.ownerEmployeeId)
                      .join(" / ")}
                  </div>
                ) : null}
              </div>
              <div style={runStatsStyle}>
                <div style={runStatCardStyle}>
                  <span style={runStatLabelStyle}>进度</span>
                  <strong style={runStatValueStyle}>
                    {completedCount}/{totalCount || 0}
                  </strong>
                </div>
                <div style={runStatCardStyle}>
                  <span style={runStatLabelStyle}>当前状态</span>
                  <strong style={runStatValueStyle}>
                    {formatStatusLabel(latestAutonomyRun.status)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressFillStyle,
                  width: `${Math.max(progressRatio * 100, totalCount ? 8 : 0)}%`
                }}
              />
            </div>

            {latestEvent ? (
              <div style={latestEventStyle}>
                <span style={latestEventBadgeStyle}>最新事件</span>
                <span style={latestEventTextStyle}>
                  {latestEvent.message ?? formatEventLabel(latestEvent.type)}
                </span>
              </div>
            ) : null}
          </div>

          {["needs_yin", "waiting_user", "blocked"].includes(latestAutonomyRun.status) ? (
            <YinReviewPanel
              teamId={teamId}
              runId={latestAutonomyRun.id}
              selectedEmployees={selectedEmployees}
              currentEmployeeId={latestAutonomyRun.currentEmployeeId}
            />
          ) : null}

          <div style={timelineListStyle}>
            {latestAutonomyRun.steps.map((step, index) => (
              <AutonomyStepCard
                key={step.id}
                teamId={teamId}
                runId={latestAutonomyRun.id}
                index={index}
                step={step}
                employees={selectedEmployees}
                current={step.id === currentStepId}
              />
            ))}
          </div>

          {latestAutonomyRun.events.length > 0 ? (
            <section style={eventTimelineWrapStyle}>
              <div style={eventTimelineTitleStyle}>事件时间轴</div>
              <div style={eventTimelineListStyle}>
                {[...latestAutonomyRun.events].reverse().map((event, index) => (
                  <article key={event.id} style={eventCardStyle}>
                    <div style={eventRailStyle}>
                      <span style={eventDotStyle} />
                      {index < latestAutonomyRun.events.length - 1 ? (
                        <span style={eventLineStyle} />
                      ) : null}
                    </div>
                    <div style={eventContentStyle}>
                      <div style={eventTopStyle}>
                        <span style={eventTypeStyle}>{formatEventLabel(event.type)}</span>
                        <span style={eventTimeStyle}>
                          {new Date(event.createdAt).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      {event.agentId ? (
                        <div style={eventAgentStyle}>
                          相关员工：
                          {selectedEmployees.find((employee) => employee.id === event.agentId)?.name ??
                            event.agentId}
                        </div>
                      ) : null}
                      <div style={eventMessageStyle}>
                        {event.message ?? "系统已记录本次自治接力事件。"}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div style={emptySideStyle}>还没有自治 run，点击上方按钮即可按当前团队启动一条接力链。</div>
      )}
    </section>
  );
}

function reorderPlanSteps(plan: AutonomyPlan, draggedStepKey: string, targetStepKey: string): AutonomyPlan {
  const steps = [...plan.steps];
  const fromIndex = steps.findIndex((step) => step.stepKey === draggedStepKey);
  const toIndex = steps.findIndex((step) => step.stepKey === targetStepKey);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return plan;
  }

  const [moved] = steps.splice(fromIndex, 1);
  steps.splice(toIndex, 0, moved);

  const normalizedSteps: AutonomyPlanStep[] = steps.map((step, index) => ({
    ...step,
    dependsOn: index === 0 ? [] : [steps[index - 1]!.stepKey],
    executionMode: "serial"
  }));

  return {
    ...plan,
    steps: normalizedSteps
  };
}

function AutonomyFeedback({ state }: { state: AutonomyPlanActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return <FormFeedback state={state} />;
}

function YinReviewPanel({
  teamId,
  runId,
  selectedEmployees,
  currentEmployeeId
}: {
  teamId: string;
  runId: string;
  selectedEmployees: ProjectEmployeeItem[];
  currentEmployeeId: string | null;
}) {
  const [state, action] = React.useActionState(
    yinReviewAutonomyRunAction,
    idleFormActionState
  );

  return (
    <form action={action} style={yinReviewPanelStyle}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="runId" value={runId} />

      <div style={{ display: "grid", gap: 4 }}>
        <div style={yinReviewTitleStyle}>主控仲裁</div>
        <div style={yinReviewHintStyle}>
          当前自治链已进入待仲裁状态。你可以指定下一棒继续、切为等待用户，或直接终止。
        </div>
      </div>

      <textarea
        name="note"
        style={yinReviewTextareaStyle}
        placeholder="补充本次仲裁说明，例如：先由行业研究员明确目标，再继续后续接力。"
      />

      <select
        name="nextEmployeeId"
        defaultValue={currentEmployeeId ?? selectedEmployees[0]?.id ?? ""}
        style={yinReviewSelectStyle}
      >
        {selectedEmployees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            下一棒：{employee.name}
          </option>
        ))}
      </select>

      <div style={yinReviewActionsStyle}>
        <button type="submit" name="decision" value="continue" style={yinReviewPrimaryStyle}>
          继续执行
        </button>
        <button type="submit" name="decision" value="waiting_user" style={yinReviewSecondaryStyle}>
          等待用户
        </button>
        <button type="submit" name="decision" value="terminate" style={yinReviewDangerStyle}>
          终止
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}

function AutonomyStepCard({
  teamId,
  runId,
  index,
  step,
  employees,
  current
}: {
  teamId: string;
  runId: string;
  index: number;
  step: AutonomyRunDetail["steps"][number];
  employees: ProjectEmployeeItem[];
  current: boolean;
}) {
  const [retryState, retryAction] = React.useActionState(
    retryAutonomyStepAction,
    idleFormActionState
  );
  const [reassignState, reassignAction] = React.useActionState(
    reassignAutonomyStepAction,
    idleFormActionState
  );

  const owner = employees.find((employee) => employee.id === step.ownerEmployeeId);
  const canOperate = ["blocked", "failed", "ready"].includes(step.status);

  return (
    <article style={timelineStepShellStyle}>
      <div style={timelineStepRailStyle}>
        <span
          style={{
            ...timelineStepDotStyle,
            ...getStepDotTone(step.status)
          }}
        />
        <span style={timelineStepConnectorStyle} />
      </div>
      <div
        style={{
          ...timelineCardStyle,
          ...(current ? timelineCardCurrentStyle : null)
        }}
      >
        <div style={timelineStepTopStyle}>
          <div style={{ display: "grid", gap: 4 }}>
                <div style={timelineStepIndexStyle}>STEP {index + 1}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={timelineStepTitleStyle}>{step.title}</div>
              <span style={timelineModeChipStyle}>
                {step.executionMode === "parallel" ? "并行" : "串行"}
              </span>
            </div>
          </div>
          <span
            style={{
              ...timelineStepStatusStyle,
              ...getStatusTone(step.status)
            }}
          >
            {formatStatusLabel(step.status)}
          </span>
        </div>

        <div style={timelineOwnerStyle}>
          负责人：{owner?.name ?? step.ownerEmployeeId}
        </div>
        {step.dependsOn.length > 0 ? (
          <div style={dependsWrapStyle}>
            <span style={dependsLabelStyle}>依赖</span>
            {step.dependsOn.map((dependency) => (
              <span key={dependency} style={dependencyChipStyle}>
                {dependency.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        ) : (
          <div style={dependsWrapStyle}>
            <span style={dependsLabelStyle}>依赖</span>
            <span style={dependencyChipStyle}>无前置步骤</span>
          </div>
        )}
        <div style={timelineGoalStyle}>{step.goal}</div>
        {step.outputSummary ? <div style={timelineSummaryStyle}>{step.outputSummary}</div> : null}
        {step.handoffTo ? (
          <div style={handoffHintStyle}>
            下一棒建议：{employees.find((employee) => employee.id === step.handoffTo)?.name ?? step.handoffTo}
          </div>
        ) : null}

        {canOperate ? (
          <div style={timelineActionsWrapStyle}>
            <form action={retryAction} style={inlineFormStyle}>
              <input type="hidden" name="teamId" value={teamId} />
              <input type="hidden" name="runId" value={runId} />
              <input type="hidden" name="stepId" value={step.id} />
              <FormSubmitButton idleLabel="重试" pendingLabel="重试中..." style={secondaryActionStyle} />
            </form>

            <form action={reassignAction} style={reassignFormStyle}>
              <input type="hidden" name="teamId" value={teamId} />
              <input type="hidden" name="runId" value={runId} />
              <input type="hidden" name="stepId" value={step.id} />
              <select
                name="employeeId"
                defaultValue={step.ownerEmployeeId}
                style={reassignSelectStyle}
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    改派给 {employee.name}
                  </option>
                ))}
              </select>
              <FormSubmitButton idleLabel="提交" pendingLabel="改派中..." style={secondaryActionStyle} />
            </form>
          </div>
        ) : null}

        <FormFeedback state={retryState.status !== "idle" ? retryState : reassignState} />
      </div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...sideTabButtonStyle,
        ...(active ? sideTabButtonActiveStyle : null)
      }}
    >
      {children}
    </button>
  );
}

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

function fakeGateway(seed: string) {
  const tail = seed.replace(/\D/g, "").slice(-4) || "18791";
  return `127.0.0.1:${tail}`;
}

function formatStatusLabel(status: string) {
  const map: Record<string, string> = {
    idle: "待启动",
    queued: "排队中",
    ready: "待执行",
    running: "执行中",
    done: "已完成",
    completed: "已完成",
    blocked: "已阻塞",
    failed: "失败",
    needs_yin: "待主控",
    waiting_user: "待用户",
    terminated: "已终止"
  };

  return map[status] ?? status;
}

function formatEventLabel(type: string) {
  const map: Record<string, string> = {
    run_started: "自治 run 已启动",
    plan_generated: "已生成执行计划",
    step_started: "步骤开始执行",
    step_completed: "步骤执行完成",
    handoff: "已完成交接",
    needs_yin: "已升级主控仲裁"
  };

  return map[type] ?? type;
}

function getStatusTone(status: string): React.CSSProperties {
  if (status === "done" || status === "completed") {
    return {
      color: "#6ef2c8",
      background: "rgba(64, 202, 160, 0.14)"
    };
  }

  if (status === "blocked" || status === "failed") {
    return {
      color: "#ffb1b1",
      background: "rgba(203, 78, 78, 0.16)"
    };
  }

  if (status === "needs_yin") {
    return {
      color: "#ffd38c",
      background: "rgba(221, 161, 64, 0.16)"
    };
  }

  return {
    color: "#8ce7ff",
    background: "rgba(88, 217, 255, 0.12)"
  };
}

function getStepDotTone(status: string): React.CSSProperties {
  if (status === "done" || status === "completed") {
    return {
      background: "#39d8ae",
      boxShadow: "0 0 0 4px rgba(57, 216, 174, 0.14)"
    };
  }

  if (status === "blocked" || status === "failed") {
    return {
      background: "#ff8d8d",
      boxShadow: "0 0 0 4px rgba(255, 141, 141, 0.14)"
    };
  }

  if (status === "needs_yin" || status === "waiting_user") {
    return {
      background: "#ffc75d",
      boxShadow: "0 0 0 4px rgba(255, 199, 93, 0.14)"
    };
  }

  return {
    background: "#58d9ff",
    boxShadow: "0 0 0 4px rgba(88, 217, 255, 0.14)"
  };
}

function getRunAlertTone(status: string): React.CSSProperties {
  if (status === "waiting_user") {
    return {
      background: "#f6f0e5",
      color: "#775d2d"
    };
  }

  if (status === "blocked") {
    return {
      background: "#fdeaea",
      color: "#8e3131"
    };
  }

  return {
    background: "#fff3de",
    color: "#8d5f17"
  };
}

const sideColumnStyle = {
  minHeight: 0,
  background: "rgba(255,255,255,0.96)",
  borderRadius: 24,
  padding: "10px 12px 10px",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: 10,
  color: "#0b1620",
  overflow: "hidden",
  minWidth: 0
} satisfies React.CSSProperties;

const sideTabsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 6
} satisfies React.CSSProperties;

const sideTabButtonStyle = {
  height: 34,
  borderRadius: 10,
  border: 0,
  background: "#e8f0f7",
  color: "#224055",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer"
} satisfies React.CSSProperties;

const sideTabButtonActiveStyle = {
  background: "#112133",
  color: "#7fe6ff"
} satisfies React.CSSProperties;

const sideBodyStyle = {
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  paddingRight: 4
} satisfies React.CSSProperties;

const panelSectionStyle = {
  display: "grid",
  gap: 10,
  minHeight: 0
} satisfies React.CSSProperties;

const discussionPanelStyle = {
  display: "grid",
  gap: 10,
  alignContent: "start",
  minHeight: 0
} satisfies React.CSSProperties;

const discussionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  minHeight: 24
} satisfies React.CSSProperties;

const discussionEyebrowStyle = {
  color: "#0f2334",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase"
} satisfies React.CSSProperties;

const discussionMetaStyle = {
  color: "#688090",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const recentDiscussionStyle = {
  borderRadius: 20,
  padding: "14px 14px 12px",
  background: "#112133",
  color: "#eff9ff",
  display: "grid",
  gap: 8,
  minWidth: 0
} satisfies React.CSSProperties;

const recentDiscussionTitleWrapStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 10
} satisfies React.CSSProperties;

const recentDiscussionTitleStyle = {
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 900
} satisfies React.CSSProperties;

const recentDiscussionInfoRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap"
} satisfies React.CSSProperties;

const recentDiscussionInfoChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 22,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  color: "#d8ecf7",
  fontSize: 11,
  fontWeight: 800
} satisfies React.CSSProperties;

const recentDiscussionInfoTextStyle = {
  color: "#86a6ba",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const recentDiscussionTextWrapStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const recentDiscussionStatusStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 24,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(87, 220, 255, 0.14)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
} satisfies React.CSSProperties;

const recentDiscussionTextStyle = {
  color: "#aec7d8",
  fontSize: 12,
  lineHeight: 1.65,
  whiteSpace: "pre-wrap",
  margin: 0
} satisfies React.CSSProperties;

const employeeListStyle = {
  minHeight: 0,
  overflow: "auto",
  display: "grid",
  gap: 10,
  paddingRight: 4,
  alignContent: "start",
  gridAutoRows: "max-content"
} satisfies React.CSSProperties;

const employeeCardStyle = {
  borderRadius: 16,
  background: "#0f1f31",
  color: "#eef8ff",
  padding: "10px 12px",
  display: "grid",
  gap: 8,
  minWidth: 0,
  minHeight: 118
} satisfies React.CSSProperties;

const employeeHeadStyle = {
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  gap: 8,
  alignItems: "start"
} satisfies React.CSSProperties;

const employeeAvatarStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "#dbe7f2",
  overflow: "hidden"
} satisfies React.CSSProperties;

const employeeAvatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block"
} satisfies React.CSSProperties;

const employeeNameStyle = {
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const employeeDescStyle = {
  color: "#a8c0d1",
  fontSize: 11,
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
} satisfies React.CSSProperties;

const employeeMetaStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "#98d2cf",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const employeeStatusStyle = {
  color: "#4ae0ad"
} satisfies React.CSSProperties;

const teamPanelStyle = {
  display: "grid",
  minHeight: 0,
  alignContent: "start"
} satisfies React.CSSProperties;

const autonomyHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8
} satisfies React.CSSProperties;

const autonomyBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 22,
  padding: "0 10px",
  borderRadius: 999,
  background: "#112133",
  color: "#7fe6ff",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
} satisfies React.CSSProperties;

const autonomyLaunchStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const planPreviewStyle = {
  display: "grid",
  gap: 10,
  padding: "12px 12px 14px",
  borderRadius: 16,
  background: "#edf5fb",
  border: "1px solid rgba(164, 192, 211, 0.55)"
} satisfies React.CSSProperties;

const planPreviewHeadStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
} satisfies React.CSSProperties;

const planPreviewEyebrowStyle = {
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#4b7089",
  fontWeight: 800
} satisfies React.CSSProperties;

const planPreviewTitleStyle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#112133"
} satisfies React.CSSProperties;

const planModeChipStyle = {
  height: 20,
  borderRadius: 999,
  padding: "0 8px",
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(88, 217, 255, 0.1)",
  color: "#3e7c95",
  fontSize: 11,
  fontWeight: 800
} satisfies React.CSSProperties;

const planStepCountStyle = {
  height: 28,
  borderRadius: 999,
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#112133",
  color: "#7fe6ff",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
} satisfies React.CSSProperties;

const planStepListStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const planHintStyle = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "#5b778d"
} satisfies React.CSSProperties;

const planStepCardStyle = {
  borderRadius: 14,
  padding: "11px 11px 10px",
  background: "rgba(255,255,255,0.8)",
  border: "1px solid rgba(164, 192, 211, 0.52)",
  display: "grid",
  gap: 7,
  cursor: "grab"
} satisfies React.CSSProperties;

const planStepCardDraggingStyle = {
  opacity: 0.56,
  transform: "scale(0.985)"
} satisfies React.CSSProperties;

const planStepTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
} satisfies React.CSSProperties;

const planStepIndexStyle = {
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#5f7b92",
  fontWeight: 800
} satisfies React.CSSProperties;

const planStepTitleStyle = {
  fontSize: 14,
  fontWeight: 900,
  color: "#112133"
} satisfies React.CSSProperties;

const planStepOwnerStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#32536b"
} satisfies React.CSSProperties;

const planStepGoalStyle = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "#5f798e"
} satisfies React.CSSProperties;

const planWarningsStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const planWarningItemStyle = {
  borderRadius: 12,
  padding: "9px 10px",
  background: "#fff4e3",
  color: "#8d5f17",
  fontSize: 12,
  lineHeight: 1.5,
  border: "1px solid rgba(221, 161, 64, 0.22)"
} satisfies React.CSSProperties;

const planConfirmStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const planSelectWrapStyle = {
  display: "grid",
  gap: 6
} satisfies React.CSSProperties;

const planSelectLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: "#4b7089"
} satisfies React.CSSProperties;

const planSelectStyle = {
  width: "100%",
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(34, 64, 85, 0.18)",
  background: "rgba(255,255,255,0.85)",
  color: "#10202d",
  padding: "0 12px",
  fontSize: 12,
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const autonomyGoalStyle = {
  width: "100%",
  minHeight: 78,
  resize: "vertical",
  border: "1px solid rgba(34, 64, 85, 0.18)",
  outline: "none",
  background: "#f4f8fb",
  color: "#10202d",
  padding: "10px 12px",
  borderRadius: 12,
  fontSize: 13,
  lineHeight: 1.6,
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const primaryActionStyle = {
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(127, 230, 255, 0.18)",
  background: "#112133",
  color: "#7fe6ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const timelineWrapStyle = {
  display: "grid",
  gap: 10
} satisfies React.CSSProperties;

const timelineMetaStyle = {
  borderRadius: 14,
  background: "#eef4f8",
  padding: "10px 12px",
  display: "grid",
  gap: 6
} satisfies React.CSSProperties;

const timelineMetaTitleStyle = {
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const timelineMetaTopStyle = {
  display: "grid",
  gap: 10
} satisfies React.CSSProperties;

const timelineMetaTextStyle = {
  color: "#54697a",
  fontSize: 12,
  lineHeight: 1.55
} satisfies React.CSSProperties;

const parallelHintStyle = {
  color: "#2f738f",
  fontSize: 11,
  lineHeight: 1.6,
  fontWeight: 700
} satisfies React.CSSProperties;

const runStatsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8
} satisfies React.CSSProperties;

const runStatCardStyle = {
  borderRadius: 12,
  background: "rgba(17, 33, 51, 0.06)",
  padding: "8px 10px",
  display: "grid",
  gap: 4
} satisfies React.CSSProperties;

const runStatLabelStyle = {
  color: "#5c7588",
  fontSize: 10,
  fontWeight: 800
} satisfies React.CSSProperties;

const runStatValueStyle = {
  color: "#10202d",
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const progressTrackStyle = {
  height: 8,
  borderRadius: 999,
  background: "rgba(17, 33, 51, 0.08)",
  overflow: "hidden"
} satisfies React.CSSProperties;

const progressFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #4fdcff, #11a0ff)"
} satisfies React.CSSProperties;

const latestEventStyle = {
  borderRadius: 10,
  background: "rgba(17, 33, 51, 0.04)",
  padding: "8px 10px",
  display: "grid",
  gap: 4
} satisfies React.CSSProperties;

const latestEventBadgeStyle = {
  color: "#4baecc",
  fontSize: 10,
  fontWeight: 800
} satisfies React.CSSProperties;

const latestEventTextStyle = {
  color: "#405a6d",
  fontSize: 12,
  lineHeight: 1.5
} satisfies React.CSSProperties;

const runAlertStyle = {
  borderRadius: 14,
  padding: "12px 12px 10px",
  display: "grid",
  gap: 6
} satisfies React.CSSProperties;

const runAlertTitleStyle = {
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const runAlertTextStyle = {
  fontSize: 12,
  lineHeight: 1.55
} satisfies React.CSSProperties;

const yinReviewPanelStyle = {
  borderRadius: 14,
  background: "#fff5e8",
  padding: "12px 12px 10px",
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const yinReviewTitleStyle = {
  color: "#7d4a10",
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const yinReviewHintStyle = {
  color: "#866236",
  fontSize: 12,
  lineHeight: 1.55
} satisfies React.CSSProperties;

const yinReviewTextareaStyle = {
  width: "100%",
  minHeight: 70,
  resize: "vertical",
  border: "1px solid rgba(125, 74, 16, 0.14)",
  outline: "none",
  background: "rgba(255,255,255,0.72)",
  color: "#53391b",
  padding: "10px 12px",
  borderRadius: 12,
  fontSize: 12,
  lineHeight: 1.6,
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const yinReviewSelectStyle = {
  width: "100%",
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(125, 74, 16, 0.14)",
  background: "rgba(255,255,255,0.72)",
  color: "#53391b",
  padding: "0 12px",
  fontSize: 12,
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const yinReviewActionsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8
} satisfies React.CSSProperties;

const yinReviewBaseButtonStyle = {
  height: 34,
  borderRadius: 10,
  border: 0,
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer"
} satisfies React.CSSProperties;

const yinReviewPrimaryStyle = {
  ...yinReviewBaseButtonStyle,
  background: "#112133",
  color: "#7fe6ff"
} satisfies React.CSSProperties;

const yinReviewSecondaryStyle = {
  ...yinReviewBaseButtonStyle,
  background: "rgba(17, 33, 51, 0.12)",
  color: "#5a4b35"
} satisfies React.CSSProperties;

const yinReviewDangerStyle = {
  ...yinReviewBaseButtonStyle,
  background: "rgba(181, 66, 66, 0.16)",
  color: "#9c2f2f"
} satisfies React.CSSProperties;

const timelineListStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const timelineStepShellStyle = {
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 1fr)",
  gap: 10,
  alignItems: "start"
} satisfies React.CSSProperties;

const timelineStepRailStyle = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  minHeight: "100%"
} satisfies React.CSSProperties;

const timelineStepDotStyle = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  marginTop: 10
} satisfies React.CSSProperties;

const timelineStepConnectorStyle = {
  position: "absolute",
  top: 24,
  bottom: -12,
  width: 2,
  borderRadius: 999,
  background: "rgba(17, 33, 51, 0.12)"
} satisfies React.CSSProperties;

const timelineCardStyle = {
  borderRadius: 16,
  background: "#112133",
  color: "#eff9ff",
  padding: "12px 12px 10px",
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const timelineCardCurrentStyle = {
  boxShadow: "inset 0 0 0 1px rgba(97, 226, 255, 0.24)",
  background: "linear-gradient(180deg, #13273b, #112133)"
} satisfies React.CSSProperties;

const timelineStepTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 8
} satisfies React.CSSProperties;

const timelineStepIndexStyle = {
  color: "#74e3ff",
  fontSize: 11,
  fontWeight: 900
} satisfies React.CSSProperties;

const timelineStepTitleStyle = {
  fontSize: 14,
  fontWeight: 900
} satisfies React.CSSProperties;

const timelineModeChipStyle = {
  height: 20,
  borderRadius: 999,
  padding: "0 8px",
  display: "inline-flex",
  alignItems: "center",
  background: "rgba(127, 230, 255, 0.12)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 800
} satisfies React.CSSProperties;

const timelineStepStatusStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 22,
  padding: "0 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
} satisfies React.CSSProperties;

const timelineOwnerStyle = {
  color: "#7fe6ff",
  fontSize: 12,
  fontWeight: 700
} satisfies React.CSSProperties;

const dependsWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap"
} satisfies React.CSSProperties;

const dependsLabelStyle = {
  color: "#7f99ad",
  fontSize: 10,
  fontWeight: 800
} satisfies React.CSSProperties;

const dependencyChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 22,
  padding: "0 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  color: "#c9d9e4",
  fontSize: 10,
  fontWeight: 700
} satisfies React.CSSProperties;

const timelineGoalStyle = {
  color: "#d5e7f3",
  fontSize: 12,
  lineHeight: 1.55
} satisfies React.CSSProperties;

const timelineSummaryStyle = {
  color: "#9fb8ca",
  fontSize: 11,
  lineHeight: 1.6,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
} satisfies React.CSSProperties;

const handoffHintStyle = {
  color: "#9fe9ff",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const eventTimelineWrapStyle = {
  display: "grid",
  gap: 10
} satisfies React.CSSProperties;

const eventTimelineTitleStyle = {
  color: "#173247",
  fontSize: 13,
  fontWeight: 900
} satisfies React.CSSProperties;

const eventTimelineListStyle = {
  display: "grid",
  gap: 10
} satisfies React.CSSProperties;

const eventCardStyle = {
  display: "grid",
  gridTemplateColumns: "14px minmax(0, 1fr)",
  gap: 10,
  alignItems: "start"
} satisfies React.CSSProperties;

const eventRailStyle = {
  position: "relative",
  display: "grid",
  justifyItems: "center",
  minHeight: 100
} satisfies React.CSSProperties;

const eventDotStyle = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#11a0ff",
  boxShadow: "0 0 0 3px rgba(17, 160, 255, 0.16)"
} satisfies React.CSSProperties;

const eventLineStyle = {
  position: "absolute",
  top: 14,
  bottom: -12,
  width: 2,
  borderRadius: 999,
  background: "rgba(17, 33, 51, 0.12)"
} satisfies React.CSSProperties;

const eventContentStyle = {
  borderRadius: 14,
  background: "#f2f7fb",
  padding: "10px 12px",
  display: "grid",
  gap: 6
} satisfies React.CSSProperties;

const eventTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8
} satisfies React.CSSProperties;

const eventTypeStyle = {
  color: "#14344b",
  fontSize: 12,
  fontWeight: 900
} satisfies React.CSSProperties;

const eventTimeStyle = {
  color: "#6c8597",
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0
} satisfies React.CSSProperties;

const eventAgentStyle = {
  color: "#2c5169",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const eventMessageStyle = {
  color: "#5b7181",
  fontSize: 12,
  lineHeight: 1.55
} satisfies React.CSSProperties;

const timelineActionsWrapStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const inlineFormStyle = {
  display: "grid"
} satisfies React.CSSProperties;

const reassignFormStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8
} satisfies React.CSSProperties;

const reassignSelectStyle = {
  minWidth: 0,
  height: 32,
  borderRadius: 10,
  border: "1px solid rgba(126, 230, 255, 0.14)",
  background: "#0b1725",
  color: "#dff7ff",
  padding: "0 10px",
  fontSize: 12
} satisfies React.CSSProperties;

const secondaryActionStyle = {
  height: 32,
  minWidth: 68,
  borderRadius: 10,
  border: "1px solid rgba(127, 230, 255, 0.18)",
  background: "#112133",
  color: "#7fe6ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const emptySideStyle = {
  color: "#738798",
  fontSize: 13,
  lineHeight: 1.6
} satisfies React.CSSProperties;
