import Link from "next/link";
import type { PanelTab } from "./side-panel";
import {
  getAutonomyRun,
  getProjectAutonomyRuns,
  getProject,
  getProjectDiscussions,
  getProjectEmployees,
  getProjectTasks,
  getTaskArtifactDownloadUrl,
  getTaskArtifactOpenUrl,
  getTaskArtifacts,
  getDiscussionMessages
} from "@/lib/api";
import { AutoScrollPanel } from "@/components/auto-scroll-panel";
import { LiveRefresh } from "@/components/live-refresh";
import { WorkspaceComposerForm } from "./composer-form";
import { WorkspaceSidePanel } from "./side-panel";
import { WorkspaceToolbar } from "./toolbar";

type TeamWorkspacePageProps = {
  params: Promise<{
    teamId: string;
  }>;
  searchParams?: Promise<{
    panel?: string;
  }>;
};

export default async function TeamWorkspacePage({
  params,
  searchParams
}: TeamWorkspacePageProps) {
  const { teamId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sidePanelTab = resolvePanelTab(resolvedSearchParams?.panel);
  const [team, employees, discussions, tasks, autonomyRuns] = await Promise.all([
    getProject(teamId),
    getProjectEmployees(teamId),
    getProjectDiscussions(teamId),
    getProjectTasks(teamId),
    getProjectAutonomyRuns(teamId)
  ]);

  const selectedEmployees = employees.filter((employee) => employee.selected);
  const employeeNameById = new Map(selectedEmployees.map((employee) => [employee.id, employee.name]));
  const employeeIndexById = new Map(selectedEmployees.map((employee, index) => [employee.id, index]));
  const latestAutonomyRunSummary = autonomyRuns[0] ?? null;
  const latestDiscussion = discussions[0] ?? null;
  const latestTask = tasks[0] ?? null;
  const [discussionMessages, latestArtifacts, latestAutonomyRun] = await Promise.all([
    latestDiscussion ? getDiscussionMessages(latestDiscussion.id) : Promise.resolve([]),
    latestTask ? getTaskArtifacts(latestTask.id) : Promise.resolve([]),
    latestAutonomyRunSummary ? getAutonomyRun(latestAutonomyRunSummary.id) : Promise.resolve(null)
  ]);
  const projectArtifacts = (
    await Promise.all(
      tasks.map(async (task) => ({
        taskId: task.id,
        taskTitle: task.title,
        artifacts: await getTaskArtifacts(task.id)
      }))
    )
  ).flatMap(({ taskId, taskTitle, artifacts }) =>
    artifacts.map((artifact) => ({
      taskId,
      taskTitle,
      artifact,
      openHref: getTaskArtifactOpenUrl(taskId, artifact.id),
      downloadHref: getTaskArtifactDownloadUrl(taskId, artifact.id)
    }))
  );

  const latestUserMessage = [...discussionMessages].reverse().find((message) => message.senderType === "user") ?? null;
  const latestEmployeeMessages = [...discussionMessages]
    .reverse()
    .filter((message) => message.senderType === "employee")
    .slice(0, 3);
  const latestArtifact = latestArtifacts[0] ?? null;
  const autonomyDisplayStep =
    latestAutonomyRun?.steps.find((step) => step.status === "running") ??
    latestAutonomyRun?.steps.find((step) => step.status === "blocked") ??
    latestAutonomyRun?.steps.find((step) => step.status === "ready") ??
    [...(latestAutonomyRun?.steps ?? [])].reverse().find((step) => step.outputSummary) ??
    null;
  const parallelMergeSignal = getParallelMergeSignal(
    latestAutonomyRun,
    employeeNameById
  );
  const autonomyResultArtifact = autonomyDisplayStep?.artifacts[0] ?? null;
  const autonomyArtifactRecord =
    autonomyResultArtifact && latestTask
      ? latestArtifacts.find(
          (artifact) =>
            artifact.virtualPath === autonomyResultArtifact ||
            artifact.filename === autonomyResultArtifact.split("/").pop()
        ) ?? null
      : null;
  const showAutonomyResult = Boolean(latestAutonomyRun);
  const autonomyPlan = latestAutonomyRun?.plannerOutput;
  const workspaceDispatchSignal = getWorkspaceDispatchSignal(
    latestAutonomyRun,
    latestEmployeeMessages,
    employeeNameById
  );
  const shouldAutoRefresh =
    latestAutonomyRun?.status === "running" ||
    latestTask?.status === "queued" ||
    latestTask?.status === "running" ||
    latestTask?.runtimeJobs.some((job) => job.status === "queued" || job.status === "running") === true;
  const mainScrollWatchKey = [
    latestUserMessage?.id ?? "no-user",
    latestEmployeeMessages.map((message) => message.id).join(",") || "no-employees",
    latestDiscussion?.id ?? "no-discussion",
    latestTask?.id ?? "no-task",
    latestArtifact?.id ?? "no-artifact",
    latestAutonomyRun?.id ?? "no-autonomy",
    latestAutonomyRun?.updatedAt ?? "no-autonomy-update"
  ].join("|");

  return (
    <main style={pageStyle}>
      <LiveRefresh active={shouldAutoRefresh} />
      <section style={shellStyle}>
        <header style={topbarStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <Link href="/teams" style={backLinkStyle}>
              返回团队列表
            </Link>
            <h1 style={titleStyle}>{team?.name ?? "未命名团队"}</h1>
          </div>

          <div style={topbarRightStyle}>
            {shouldAutoRefresh ? <span style={liveBadgeStyle}>实时更新中...</span> : null}
            <nav style={navStyle}>
              <Link href={`/teams/${teamId}/discussion`} style={navLinkStyle}>历史讨论</Link>
              <Link href={`/teams/${teamId}/tasks`} style={navLinkStyle}>任务</Link>
              <Link href={`/teams/${teamId}/skills`} style={navLinkStyle}>员工技能</Link>
            </nav>
          </div>
        </header>

        <section style={workspaceStyle}>
          <section style={mainColumnStyle}>
            <AutoScrollPanel style={contentStageStyle} watchKey={mainScrollWatchKey}>
              <div style={promptBarWrapStyle}>
                <div style={promptBarStyle}>
                  <span style={groupBadgeStyle}>群</span>
                  <span style={promptTextStyle}>
                    {latestUserMessage?.content ?? "我家有个早餐店，你们给我出一个线上运营的方案"}
                  </span>
                  <span style={youBadgeStyle}>你</span>
                </div>
              </div>

              {latestUserMessage ? (
                <article style={workspaceEventCardStyle}>
                  <div style={workspaceEventTopStyle}>
                    <span style={workspaceEventBadgeStyle}>系统事件</span>
                    <span style={workspaceEventStatusStyle}>协作中</span>
                  </div>
                  <div style={workspaceEventTitleStyle}>已向团队发起协作请求</div>
                  <div style={workspaceEventTextStyle}>
                    系统已将你的最新要求接入当前团队协作流。接下来团队会直接在这个工作台里回复、调整计划，或继续推进任务执行。
                  </div>
                  {latestDiscussion?.title ? (
                    <div style={workspaceEventMetaStyle}>当前协作线程：{latestDiscussion.title}</div>
                  ) : null}
                </article>
              ) : null}

              {workspaceDispatchSignal ? (
                <article
                  style={{
                    ...workspaceEventCardStyle,
                    ...workspaceDispatchSignalCardStyle
                  }}
                >
                  <div style={workspaceEventTopStyle}>
                    <span style={workspaceEventBadgeStyle}>系统调度</span>
                    <span
                      style={{
                        ...workspaceDispatchStatusStyle,
                        ...getWorkspaceDispatchTone(workspaceDispatchSignal.tone)
                      }}
                    >
                      {workspaceDispatchSignal.status}
                    </span>
                  </div>
                  <div style={workspaceEventTitleStyle}>{workspaceDispatchSignal.title}</div>
                  <div style={workspaceEventTextStyle}>{workspaceDispatchSignal.description}</div>
                  {workspaceDispatchSignal.meta ? (
                    <div style={workspaceEventMetaStyle}>{workspaceDispatchSignal.meta}</div>
                  ) : null}
                </article>
              ) : null}

              {autonomyPlan ? (
                <article style={systemPlanCardStyle}>
                  <div style={systemPlanTopStyle}>
                    <div style={systemPlanBadgeStyle}>系统</div>
                    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <div style={systemPlanTitleStyle}>系统已生成协作计划</div>
                      <div style={systemPlanTextStyle}>
                        {autonomyPlan.title} · 共 {autonomyPlan.steps.length} 步
                      </div>
                    </div>
                  </div>
                  <div style={systemPlanStepListStyle}>
                    {autonomyPlan.steps.map((step, index) => (
                      <div key={step.stepKey} style={systemPlanStepItemStyle}>
                        <span style={systemPlanStepIndexStyle}>{index + 1}</span>
                        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                          <strong style={systemPlanStepTitleStyle}>
                            {step.title}
                          </strong>
                          <span style={systemPlanStepTextStyle}>
                            负责人：
                            {employeeNameById.get(step.ownerEmployeeId) ?? step.ownerEmployeeId}
                            {step.dependsOn.length > 0
                              ? ` · 依赖 ${step.dependsOn.join(" / ")}`
                              : " · 无前置步骤"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {parallelMergeSignal ? (
                <article
                  style={{
                    ...systemPlanCardStyle,
                    ...parallelMergeCardStyle
                  }}
                >
                  <div style={parallelMergeTopStyle}>
                    <div style={parallelMergeBadgeStyle}>系统事件</div>
                    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <div style={parallelMergeTitleStyle}>
                        {parallelMergeSignal.status === "completed"
                          ? "系统已完成并行合流"
                          : "系统正在合流并行结果"}
                      </div>
                      <div style={parallelMergeTextStyle}>
                        {parallelMergeSignal.status === "completed"
                          ? "并行分支已经完成，系统已将多位员工的结果汇合成下一棒可执行输入。"
                          : "并行分支已经完成，系统正在把多个结果合流到下一棒。"}
                      </div>
                    </div>
                    <span
                      style={{
                        ...taskStateStyle,
                        ...getAutonomyRunTone(parallelMergeSignal.status)
                      }}
                    >
                      {parallelMergeSignal.status === "completed" ? "合流完成" : "合流中"}
                    </span>
                  </div>

                  <div style={parallelMergeGridStyle}>
                    <div style={parallelMergeColumnStyle}>
                      <span style={parallelMergeSectionLabelStyle}>并行完成步骤</span>
                      <div style={parallelMergeChipListStyle}>
                        {parallelMergeSignal.parallelSteps.map((step) => (
                          <span key={step.id} style={parallelMergeChipStyle}>
                            {step.title}
                            {" · "}
                            {step.ownerName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={parallelMergeColumnStyle}>
                      <span style={parallelMergeSectionLabelStyle}>合流步骤</span>
                      <div style={parallelMergeMergeCardStyle}>
                        <strong style={parallelMergeMergeTitleStyle}>
                          {parallelMergeSignal.mergeStep.title}
                        </strong>
                        <span style={parallelMergeMergeTextStyle}>
                          负责人：{parallelMergeSignal.mergeStep.ownerName}
                        </span>
                        {parallelMergeSignal.mergeStep.outputSummary ? (
                          <p style={parallelMergeSummaryStyle}>
                            {parallelMergeSignal.mergeStep.outputSummary}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {parallelMergeSignal.latestEventMessage ? (
                    <div style={parallelMergeEventStyle}>
                      最新事件：{parallelMergeSignal.latestEventMessage}
                    </div>
                  ) : null}
                </article>
              ) : null}

              {latestEmployeeMessages.length > 0 ? (
                latestEmployeeMessages.map((message, index) => (
                  <article
                    key={message.id}
                    style={{
                      ...messageCardStyle,
                      opacity: index === 0 ? 1 : 0.88
                    }}
                  >
                    <div style={messageMetaStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        {message.senderId ? (
                          <div style={messageAvatarStyle}>
                            <img
                              src={getEmployeeAvatar(
                                message.senderId,
                                employeeIndexById.get(message.senderId) ?? 0
                              )}
                              alt={employeeNameById.get(message.senderId) ?? "员工头像"}
                              style={messageAvatarImageStyle}
                            />
                          </div>
                        ) : null}
                        <span style={speakerStyle}>
                          {message.senderId
                            ? employeeNameById.get(message.senderId) ?? message.senderId
                            : "数字员工"}
                        </span>
                      </div>
                      <span style={roundStyle}>第 {message.roundNo} 轮</span>
                    </div>
                    <div style={messageTextStyle}>{message.content}</div>
                  </article>
                ))
              ) : (
                <div style={emptyHintStyle}>还没有团队最新反馈。你可以直接在下方输入任务，团队会在这里继续协作并返回结果。</div>
              )}

              {(showAutonomyResult || latestDiscussion?.summary || latestTask || latestArtifact) ? (
                <section style={resultPanelStyle}>
                  <div style={resultTopStyle}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={resultEyebrowStyle}>
                        {showAutonomyResult ? "自治接力结果" : latestDiscussion?.title ?? "最近讨论"}
                      </div>
                      <div style={resultHeadingStyle}>
                        {showAutonomyResult
                          ? latestAutonomyRun?.title ?? "自治接力面板"
                          : "执行结果面板"}
                      </div>
                    </div>
                    {showAutonomyResult ? (
                      <span
                        style={{
                          ...taskStateStyle,
                          ...getAutonomyRunTone(latestAutonomyRun?.status ?? "idle")
                        }}
                      >
                        {formatAutonomyRunStatus(latestAutonomyRun?.status ?? "idle")}
                      </span>
                    ) : latestTask ? (
                      <span style={taskStateStyle}>{latestTask.status}</span>
                    ) : null}
                  </div>

                  <p style={resultSummaryStyle}>
                    {showAutonomyResult
                      ? autonomyDisplayStep?.outputSummary ??
                        latestAutonomyRun?.summary ??
                        latestAutonomyRun?.goal ??
                        "自治接力已启动，这里会持续显示当前棒次和最新结果。"
                      : latestTask?.summary ??
                        latestDiscussion?.summary ??
                        "讨论完成后，这里会显示执行摘要、任务结论和可交付结果。"}
                  </p>

                  {showAutonomyResult && autonomyDisplayStep ? (
                    <div style={resultStatsRowStyle}>
                      <ResultMetaCard
                        label="当前棒次"
                        value={`${autonomyDisplayStep.stepIndex + 1}. ${autonomyDisplayStep.title}`}
                      />
                      <ResultMetaCard
                        label="执行员工"
                        value={
                          employeeNameById.get(autonomyDisplayStep.ownerEmployeeId) ??
                          autonomyDisplayStep.ownerEmployeeId
                        }
                      />
                      <ResultMetaCard
                        label="步骤状态"
                        value={formatAutonomyRunStatus(autonomyDisplayStep.status)}
                      />
                    </div>
                  ) : null}

                  {showAutonomyResult && autonomyResultArtifact ? (
                    <ArtifactResultCard
                      label="最新自治产物"
                      title={
                        autonomyArtifactRecord?.filename ??
                        autonomyResultArtifact.split("/").pop() ??
                        autonomyResultArtifact
                      }
                      path={autonomyResultArtifact}
                      tone="autonomy"
                      openHref={
                        latestTask && autonomyArtifactRecord
                          ? getTaskArtifactOpenUrl(latestTask.id, autonomyArtifactRecord.id)
                          : undefined
                      }
                      downloadHref={
                        latestTask && autonomyArtifactRecord
                          ? getTaskArtifactDownloadUrl(latestTask.id, autonomyArtifactRecord.id)
                          : undefined
                      }
                    />
                  ) : latestArtifact ? (
                    <ArtifactResultCard
                      label="最新产物"
                      title={latestArtifact.filename}
                      path={latestArtifact.virtualPath}
                      openHref={getTaskArtifactOpenUrl(latestTask!.id, latestArtifact.id)}
                      downloadHref={getTaskArtifactDownloadUrl(latestTask!.id, latestArtifact.id)}
                    />
                  ) : null}
                </section>
              ) : null}
            </AutoScrollPanel>

            <WorkspaceToolbar
              teamId={teamId}
              discussionId={latestDiscussion?.id}
              projectArtifacts={projectArtifacts}
            />

            <WorkspaceComposerForm
              teamId={teamId}
              discussionId={latestDiscussion?.id}
              participantEmployeeIds={selectedEmployees.map((employee) => employee.id)}
              textareaStyle={composerInputStyle}
              buttonStyle={sendButtonStyle}
            />
          </section>

          <WorkspaceSidePanel
            teamId={teamId}
            latestDiscussion={latestDiscussion}
            selectedEmployees={selectedEmployees}
            latestAutonomyRun={latestAutonomyRun}
            suggestedGoal={latestUserMessage?.content ?? latestDiscussion?.summary ?? "请根据当前团队协作目标启动一条自治接力链。"}
            initialTab={sidePanelTab}
          />
        </section>
      </section>
    </main>
  );
}

function ResultMetaCard(props: { label: string; value: string }) {
  return (
    <div style={resultMetaCardStyle}>
      <span style={resultMetaLabelStyle}>{props.label}</span>
      <strong style={resultMetaValueStyle}>{props.value}</strong>
    </div>
  );
}

function ArtifactResultCard(props: {
  label: string;
  title: string;
  path: string;
  openHref?: string;
  downloadHref?: string;
  tone?: "default" | "autonomy";
}) {
  const toneStyle = props.tone === "autonomy" ? artifactCardAutonomyStyle : artifactCardDefaultStyle;

  return (
    <div style={{ ...artifactCardStyle, ...toneStyle }}>
      <div style={artifactCardTopStyle}>
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={artifactCardLabelStyle}>{props.label}</span>
          <strong style={artifactCardTitleStyle}>{props.title}</strong>
        </div>
        <span style={artifactStatusPillStyle}>已交付</span>
      </div>
      <div style={artifactPathWrapStyle}>
        <span style={artifactPathLabelStyle}>文件路径</span>
        <code style={artifactPathStyle}>{props.path}</code>
      </div>
      <div style={artifactActionRowStyle}>
        {props.openHref ? (
          <a
            href={props.openHref}
            target="_blank"
            rel="noreferrer"
            style={artifactPrimaryActionStyle}
          >
            打开文件
          </a>
        ) : null}
        {props.downloadHref ? (
          <a
            href={props.downloadHref}
            style={artifactSecondaryActionStyle}
            download
          >
            下载文件
          </a>
        ) : null}
      </div>
    </div>
  );
}

function resolvePanelTab(value?: string): PanelTab {
  if (value === "team" || value === "autonomy" || value === "discussion") {
    return value;
  }

  return "discussion";
}

function formatAutonomyRunStatus(status: string) {
  switch (status) {
    case "running":
      return "执行中";
    case "completed":
      return "已完成";
    case "blocked":
      return "已阻塞";
    case "needs_yin":
      return "待主控";
    case "waiting_user":
      return "等用户";
    case "terminated":
      return "已终止";
    case "failed":
      return "失败";
    case "ready":
      return "待执行";
    case "done":
      return "已完成";
    default:
      return status;
  }
}

function getParallelMergeSignal(
  run: Awaited<ReturnType<typeof getAutonomyRun>>,
  employeeNameById: Map<string, string>
) {
  if (!run) {
    return null;
  }

  const parallelSteps = run.steps.filter(
    (step) => step.executionMode === "parallel" && step.dependsOn.length === 0
  );
  const finishedParallelSteps = parallelSteps.filter((step) =>
    ["done", "completed"].includes(step.status)
  );
  const mergeCandidates = run.steps
    .filter((step) => step.dependsOn.length > 1)
    .sort((left, right) => {
      const leftStamp = left.finishedAt ?? left.startedAt ?? "";
      const rightStamp = right.finishedAt ?? right.startedAt ?? "";
      return rightStamp.localeCompare(leftStamp) || right.stepIndex - left.stepIndex;
    });
  const mergeStep = mergeCandidates.find((step) =>
    ["running", "done", "completed"].includes(step.status)
  );

  if (finishedParallelSteps.length < 2 || !mergeStep) {
    return null;
  }

  const latestMergeEvent = [...run.events]
    .reverse()
    .find(
      (event) =>
        event.stepId === mergeStep.id &&
        (event.type === "step_started" || event.type === "step_completed")
    );

  return {
    status:
      mergeStep.status === "done" || mergeStep.status === "completed"
        ? "completed"
        : "running",
    parallelSteps: finishedParallelSteps.map((step) => ({
      id: step.id,
      title: step.title,
      ownerName: employeeNameById.get(step.ownerEmployeeId) ?? step.ownerEmployeeId
    })),
    mergeStep: {
      id: mergeStep.id,
      title: mergeStep.title,
      ownerName: employeeNameById.get(mergeStep.ownerEmployeeId) ?? mergeStep.ownerEmployeeId,
      outputSummary: mergeStep.outputSummary
    },
    latestEventMessage: latestMergeEvent?.message ?? null
  };
}

function getAutonomyRunTone(status: string): React.CSSProperties {
  switch (status) {
    case "completed":
      return {
        background: "rgba(24, 84, 52, 0.62)",
        color: "#8bf0b7"
      };
    case "needs_yin":
    case "waiting_user":
      return {
        background: "rgba(112, 86, 18, 0.58)",
        color: "#ffe082"
      };
    case "blocked":
    case "failed":
      return {
        background: "rgba(116, 32, 32, 0.56)",
        color: "#ffb4b4"
      };
    default:
      return {
        background: "rgba(24, 76, 117, 0.56)",
        color: "#8de8ff"
      };
  }
}

function getWorkspaceDispatchSignal(
  run: Awaited<ReturnType<typeof getAutonomyRun>>,
  latestEmployeeMessages: Awaited<ReturnType<typeof getDiscussionMessages>>,
  employeeNameById: Map<string, string>
) {
  if (run) {
    const activeStep =
      run.steps.find((step) => step.status === "running") ??
      run.steps.find((step) => step.status === "ready") ??
      run.steps.find((step) => step.status === "blocked") ??
      null;
    const ownerName = activeStep
      ? employeeNameById.get(activeStep.ownerEmployeeId) ?? activeStep.ownerEmployeeId
      : null;

    if (run.status === "needs_yin" || run.status === "waiting_user" || run.status === "blocked") {
      return {
        status: "待决策",
        title: "系统需要进一步明确下一步动作",
        description:
          run.lastError ??
          run.summary ??
          "当前自治链路出现分歧或缺少上下文，建议打开右侧自治面板继续仲裁。",
        meta: ownerName ? `当前停留员工：${ownerName}` : "请在右侧自治面板做继续、等待用户或终止决定。",
        tone: "warning" as const
      };
    }

    if (activeStep && (run.status === "running" || run.status === "completed")) {
      return {
        status: run.status === "completed" ? "已完成" : "进行中",
        title:
          run.status === "completed"
            ? "系统已完成本轮协作调度"
            : `系统已转交给 ${ownerName ?? "下一位员工"}`,
        description:
          activeStep.outputSummary ??
          run.summary ??
          `当前由 ${ownerName ?? "团队成员"} 负责推进「${activeStep.title}」，后续结果会继续同步到工作台。`,
        meta: ownerName ? `当前步骤：${activeStep.title} · 负责人：${ownerName}` : null,
        tone: run.status === "completed" ? ("success" as const) : ("info" as const)
      };
    }
  }

  const latestEmployeeMessage = latestEmployeeMessages[0];
  if (latestEmployeeMessage?.senderId) {
    const employeeName =
      employeeNameById.get(latestEmployeeMessage.senderId) ?? latestEmployeeMessage.senderId;
    return {
      status: "已响应",
      title: `系统已收到 ${employeeName} 的最新反馈`,
      description: "团队正在基于你的要求继续推进，最新回复已经同步到当前主面板。",
      meta: `最新响应员工：${employeeName}`,
      tone: "info" as const
    };
  }

  return null;
}

function getWorkspaceDispatchTone(
  tone: "info" | "success" | "warning"
): React.CSSProperties {
  switch (tone) {
    case "success":
      return {
        color: "#8bf0b7",
        background: "rgba(24, 84, 52, 0.38)"
      };
    case "warning":
      return {
        color: "#ffe082",
        background: "rgba(112, 86, 18, 0.34)"
      };
    default:
      return {
        color: "#8de8ff",
        background: "rgba(88, 217, 255, 0.14)"
      };
  }
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

const pageStyle = {
  height: "100dvh",
  padding: "8px 12px 10px",
  background:
    "radial-gradient(circle at top, rgba(51, 129, 191, 0.12), transparent 28%), #07111d",
  color: "#f4fbff",
  fontFamily: '"SF Mono", "IBM Plex Sans SC", "JetBrains Mono", ui-sans-serif, sans-serif',
  boxSizing: "border-box",
  overflow: "hidden"
} satisfies React.CSSProperties;

const shellStyle = {
  width: "100%",
  maxWidth: "1780px",
  margin: "0 auto",
  height: "100%",
  display: "grid",
  gridTemplateRows: "auto 1fr",
  gap: 8,
  overflow: "hidden",
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const topbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  padding: "4px 2px"
} satisfies React.CSSProperties;

const topbarRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "flex-end"
} satisfies React.CSSProperties;

const backLinkStyle = {
  color: "#59d9ff",
  textDecoration: "none",
  fontSize: 12
} satisfies React.CSSProperties;

const titleStyle = {
  margin: 0,
  fontSize: 20,
  lineHeight: 1.08
} satisfies React.CSSProperties;

const navStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end"
} satisfies React.CSSProperties;

const liveBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 28,
  padding: "0 12px",
  borderRadius: 999,
  background: "rgba(88, 217, 255, 0.14)",
  color: "#8de8ff",
  border: "1px solid rgba(127, 230, 255, 0.16)",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const navLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 34,
  padding: "0 12px",
  borderRadius: 12,
  textDecoration: "none",
  background: "rgba(255,255,255,0.03)",
  color: "#72e2ff",
  fontSize: 12,
  fontWeight: 700
} satisfies React.CSSProperties;

const workspaceStyle = {
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) clamp(278px, calc(20vw + 30px), 350px)",
  gap: 12,
  overflow: "hidden"
} satisfies React.CSSProperties;

const mainColumnStyle = {
  minHeight: 0,
  background: "linear-gradient(180deg, rgba(9,19,33,0.96), rgba(6,12,22,0.98))",
  borderRadius: 26,
  padding: 12,
  display: "grid",
  gridTemplateRows: "1fr auto auto",
  gap: 10,
  boxShadow: "inset 0 0 0 1px rgba(81, 130, 168, 0.14)",
  overflow: "hidden"
} satisfies React.CSSProperties;

const promptBarWrapStyle = {
  display: "flex",
  justifyContent: "flex-end"
} satisfies React.CSSProperties;

const workspaceEventCardStyle = {
  borderRadius: 18,
  background: "rgba(12, 34, 52, 0.92)",
  border: "1px solid rgba(97, 226, 255, 0.14)",
  padding: "14px 16px",
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const workspaceDispatchSignalCardStyle = {
  background: "rgba(13, 29, 43, 0.96)"
} satisfies React.CSSProperties;

const workspaceEventTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
} satisfies React.CSSProperties;

const workspaceEventBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 52,
  height: 24,
  borderRadius: 999,
  background: "rgba(88, 217, 255, 0.16)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 900
} satisfies React.CSSProperties;

const workspaceEventStatusStyle = {
  color: "#a8d9ec",
  fontSize: 12,
  fontWeight: 700
} satisfies React.CSSProperties;

const workspaceDispatchStatusStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 56,
  height: 24,
  padding: "0 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800
} satisfies React.CSSProperties;

const workspaceEventTitleStyle = {
  color: "#f4fbff",
  fontSize: 18,
  lineHeight: 1.2,
  fontWeight: 900
} satisfies React.CSSProperties;

const workspaceEventTextStyle = {
  color: "#b6d0df",
  fontSize: 13,
  lineHeight: 1.65
} satisfies React.CSSProperties;

const workspaceEventMetaStyle = {
  color: "#82bdd7",
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 700
} satisfies React.CSSProperties;

const promptBarStyle = {
  maxWidth: 560,
  minHeight: 56,
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(15,55,81,0.96), rgba(11,38,60,0.98))",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: 10,
  padding: "0 12px"
} satisfies React.CSSProperties;

const groupBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 24,
  height: 24,
  borderRadius: 8,
  background: "rgba(144, 214, 255, 0.18)",
  color: "#7be0ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const promptTextStyle = {
  color: "#dff7ff",
  fontSize: 15,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
} satisfies React.CSSProperties;

const youBadgeStyle = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "rgba(15, 36, 57, 0.98)",
  color: "#51d7ff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 16
} satisfies React.CSSProperties;

const contentStageStyle = {
  minHeight: 0,
  background: "rgba(255,255,255,0.01)",
  borderRadius: 22,
  padding: "10px 12px",
  display: "grid",
  alignContent: "start",
  gap: 10,
  overflow: "auto"
} satisfies React.CSSProperties;

const messageCardStyle = {
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(14,31,48,0.96), rgba(10,22,34,0.98))",
  padding: "12px 14px",
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const messageMetaStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
} satisfies React.CSSProperties;

const messageAvatarStyle = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "#dbe7f2",
  overflow: "hidden",
  flexShrink: 0
} satisfies React.CSSProperties;

const messageAvatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block"
} satisfies React.CSSProperties;

const speakerStyle = {
  color: "#4edbff",
  fontSize: 13,
  fontWeight: 800
} satisfies React.CSSProperties;

const roundStyle = {
  color: "#83a5bc",
  fontSize: 12
} satisfies React.CSSProperties;

const messageTextStyle = {
  color: "#e7f7ff",
  fontSize: 13,
  lineHeight: 1.7
} satisfies React.CSSProperties;

const resultPanelStyle = {
  marginTop: 4,
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(13,28,42,0.96), rgba(8,18,29,0.98))",
  padding: "14px 16px",
  display: "grid",
  gap: 12
} satisfies React.CSSProperties;

const systemPlanCardStyle = {
  borderRadius: 20,
  background: "rgba(12, 34, 52, 0.92)",
  border: "1px solid rgba(97, 226, 255, 0.14)",
  padding: "16px 18px",
  display: "grid",
  gap: 12
} satisfies React.CSSProperties;

const systemPlanTopStyle = {
  display: "flex",
  alignItems: "start",
  gap: 10
} satisfies React.CSSProperties;

const systemPlanBadgeStyle = {
  minWidth: 40,
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(88, 217, 255, 0.16)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 900
} satisfies React.CSSProperties;

const systemPlanTitleStyle = {
  fontSize: 18,
  fontWeight: 900,
  color: "#f4fbff"
} satisfies React.CSSProperties;

const systemPlanTextStyle = {
  fontSize: 12,
  lineHeight: 1.6,
  color: "#a8c6d8"
} satisfies React.CSSProperties;

const systemPlanStepListStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const systemPlanStepItemStyle = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  gap: 10,
  alignItems: "start",
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  padding: "10px 12px"
} satisfies React.CSSProperties;

const systemPlanStepIndexStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(88, 217, 255, 0.12)",
  color: "#8de8ff",
  fontSize: 12,
  fontWeight: 900
} satisfies React.CSSProperties;

const systemPlanStepTitleStyle = {
  fontSize: 14,
  color: "#f4fbff"
} satisfies React.CSSProperties;

const systemPlanStepTextStyle = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "#9ebccd"
} satisfies React.CSSProperties;

const parallelMergeCardStyle = {
  background: "linear-gradient(180deg, rgba(10, 41, 58, 0.96), rgba(7, 24, 37, 0.98))",
  border: "1px solid rgba(88, 217, 255, 0.18)",
  boxShadow: "inset 0 0 0 1px rgba(88, 217, 255, 0.08)"
} satisfies React.CSSProperties;

const parallelMergeTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 12
} satisfies React.CSSProperties;

const parallelMergeBadgeStyle = {
  minWidth: 64,
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(88, 217, 255, 0.16)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 900,
  flexShrink: 0
} satisfies React.CSSProperties;

const parallelMergeTitleStyle = {
  fontSize: 19,
  fontWeight: 900,
  color: "#f4fbff"
} satisfies React.CSSProperties;

const parallelMergeTextStyle = {
  fontSize: 12,
  lineHeight: 1.6,
  color: "#a8d5e4"
} satisfies React.CSSProperties;

const parallelMergeGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 12
} satisfies React.CSSProperties;

const parallelMergeColumnStyle = {
  display: "grid",
  gap: 8
} satisfies React.CSSProperties;

const parallelMergeSectionLabelStyle = {
  color: "#71dfff",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
} satisfies React.CSSProperties;

const parallelMergeChipListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
} satisfies React.CSSProperties;

const parallelMergeChipStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  color: "#ddf6ff",
  fontSize: 12,
  fontWeight: 700
} satisfies React.CSSProperties;

const parallelMergeMergeCardStyle = {
  display: "grid",
  gap: 6,
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)"
} satisfies React.CSSProperties;

const parallelMergeMergeTitleStyle = {
  color: "#f5fcff",
  fontSize: 15,
  lineHeight: 1.4
} satisfies React.CSSProperties;

const parallelMergeMergeTextStyle = {
  color: "#8ec6d8",
  fontSize: 12
} satisfies React.CSSProperties;

const parallelMergeSummaryStyle = {
  margin: 0,
  color: "#d8eef6",
  fontSize: 12,
  lineHeight: 1.65
} satisfies React.CSSProperties;

const parallelMergeEventStyle = {
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.04)",
  color: "#a8d5e4",
  fontSize: 12,
  lineHeight: 1.6
} satisfies React.CSSProperties;

const resultTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 14
} satisfies React.CSSProperties;

const resultEyebrowStyle = {
  color: "#66e1ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const resultHeadingStyle = {
  color: "#f2fbff",
  fontSize: 18,
  fontWeight: 900
} satisfies React.CSSProperties;

const taskStateStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 24,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(88, 220, 255, 0.14)",
  color: "#8de8ff",
  fontSize: 11,
  fontWeight: 800
} satisfies React.CSSProperties;

const resultSummaryStyle = {
  margin: 0,
  color: "#d9ebf6",
  fontSize: 13,
  lineHeight: 1.75,
  whiteSpace: "pre-wrap"
} satisfies React.CSSProperties;

const resultStatsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10
} satisfies React.CSSProperties;

const resultMetaCardStyle = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(87, 121, 152, 0.2)"
} satisfies React.CSSProperties;

const resultMetaLabelStyle = {
  color: "#66a5c7",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
} satisfies React.CSSProperties;

const resultMetaValueStyle = {
  color: "#f2fbff",
  fontSize: 13,
  lineHeight: 1.5
} satisfies React.CSSProperties;

const artifactCardStyle = {
  display: "grid",
  gap: 12,
  borderRadius: 16,
  padding: "14px 16px",
  border: "1px solid rgba(92, 137, 173, 0.24)"
} satisfies React.CSSProperties;

const artifactCardDefaultStyle = {
  background: "linear-gradient(180deg, rgba(14, 31, 48, 0.94), rgba(10, 22, 34, 0.98))"
} satisfies React.CSSProperties;

const artifactCardAutonomyStyle = {
  background: "linear-gradient(180deg, rgba(13, 43, 61, 0.98), rgba(9, 26, 40, 0.98))",
  boxShadow: "inset 0 0 0 1px rgba(88, 217, 255, 0.16)"
} satisfies React.CSSProperties;

const artifactCardTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 12
} satisfies React.CSSProperties;

const artifactCardLabelStyle = {
  color: "#57dbff",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase"
} satisfies React.CSSProperties;

const artifactCardTitleStyle = {
  color: "#f2fbff",
  fontSize: 15,
  lineHeight: 1.4
} satisfies React.CSSProperties;

const artifactStatusPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 24,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(24, 84, 52, 0.68)",
  color: "#92f0bc",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
} satisfies React.CSSProperties;

const artifactPathWrapStyle = {
  display: "grid",
  gap: 6
} satisfies React.CSSProperties;

const artifactPathLabelStyle = {
  color: "#82a9bf",
  fontSize: 11,
  fontWeight: 700
} satisfies React.CSSProperties;

const artifactPathStyle = {
  margin: 0,
  color: "#d6effa",
  fontSize: 12,
  lineHeight: 1.5,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
} satisfies React.CSSProperties;

const artifactActionRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
} satisfies React.CSSProperties;

const artifactPrimaryActionStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 34,
  padding: "0 14px",
  borderRadius: 10,
  textDecoration: "none",
  color: "#08131d",
  background: "#58d9ff",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const artifactSecondaryActionStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 34,
  padding: "0 14px",
  borderRadius: 10,
  textDecoration: "none",
  color: "#d8f7ff",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(88, 217, 255, 0.18)",
  fontSize: 12,
  fontWeight: 800
} satisfies React.CSSProperties;

const composerStyle = {
  position: "relative",
  display: "block",
  flexShrink: 0
} satisfies React.CSSProperties;

const composerInputStyle = {
  width: "100%",
  minHeight: 126,
  resize: "none",
  border: 0,
  outline: "none",
  background: "rgba(10, 21, 35, 0.94)",
  color: "#7991a6",
  padding: "15px 112px 15px 18px",
  borderRadius: 8,
  fontFamily: '"SF Mono", "IBM Plex Sans SC", "JetBrains Mono", ui-sans-serif, sans-serif',
  fontSize: 14,
  boxSizing: "border-box"
} satisfies React.CSSProperties;

const sendButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 88,
  height: 32,
  position: "absolute",
  right: 12,
  bottom: 12,
  borderRadius: 8,
  textDecoration: "none",
  color: "#08131d",
  background: "#59d9ff",
  fontSize: 14,
  fontWeight: 800
} satisfies React.CSSProperties;

const emptyHintStyle = {
  color: "#8ea4b6",
  fontSize: 13,
  lineHeight: 1.6
} satisfies React.CSSProperties;
