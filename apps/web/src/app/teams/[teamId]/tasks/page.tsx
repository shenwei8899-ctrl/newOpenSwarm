import Link from "next/link";
import {
  getProjectDiscussions,
  getProjectEmployees,
  getProjectTasks,
  getTaskArtifacts
} from "@/lib/api";
import { AssignTaskForm, CreateTaskForm, RunTaskForm } from "./forms";

type TeamTasksPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamTasksPage({ params }: TeamTasksPageProps) {
  const { teamId } = await params;
  const employees = (await getProjectEmployees(teamId)).filter((employee) => employee.selected);
  const discussions = await getProjectDiscussions(teamId);
  const latestDiscussion = discussions[0] ?? null;
  const discussionTitleById = new Map(
    discussions.map((discussion) => [discussion.id, discussion.title || "未命名讨论"])
  );
  const tasks = await getProjectTasks(teamId);
  const artifactsByTaskId = new Map(
    (
      await Promise.all(
        tasks.map(async (task) => [task.id, await getTaskArtifacts(task.id)] as const)
      )
    ).map(([taskId, artifacts]) => [taskId, artifacts])
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#04101d",
        color: "#f5fbff",
        fontFamily:
          '"SF Mono", "JetBrains Mono", "Noto Sans SC", ui-sans-serif, sans-serif'
      }}
    >
      <section style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
        <Link href={`/teams/${teamId}/workspace`} style={{ color: "#4dd0ff", textDecoration: "none" }}>
          返回团队工作台
        </Link>
        <div
          style={{
            borderRadius: 28,
            padding: 28,
            border: "1px solid rgba(77, 208, 255, 0.18)",
            background: "rgba(7, 21, 38, 0.9)"
          }}
        >
          <div style={{ color: "#4dd0ff", marginBottom: 10, fontWeight: 700 }}>
            STEP 5 / 任务执行
          </div>
          <h1 style={{ margin: 0, fontSize: 42 }}>任务与产物</h1>
          <p style={{ color: "#95b4c7", maxWidth: 720 }}>
            这里已经接通真实任务状态和 DeerFlow 执行结果。现在可以直接创建任务、分配员工并运行。
          </p>
        </div>

        <section
          style={{
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(77, 208, 255, 0.14)",
            background: "rgba(7, 21, 38, 0.9)",
            display: "grid",
            gap: 14
          }}
        >
          <h2 style={{ margin: 0 }}>创建任务</h2>
          <CreateTaskForm
            teamId={teamId}
            discussions={discussions.map((discussion) => ({
              id: discussion.id,
              title: discussion.title || "未命名讨论"
            }))}
            defaultDiscussionId={latestDiscussion?.id ?? ""}
            inputStyle={inputStyle}
            buttonStyle={primaryButtonStyle}
          />
        </section>

        <section
          style={{
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(77, 208, 255, 0.14)",
            background: "rgba(7, 21, 38, 0.9)"
          }}
        >
          <h2 style={{ marginTop: 0 }}>任务列表</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {tasks.map((task) => {
              const artifacts = artifactsByTaskId.get(task.id) ?? [];

              return (
                <div
                  key={task.id}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    border: "1px solid rgba(77, 208, 255, 0.12)",
                    background: "rgba(255,255,255,0.02)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{task.title}</strong>
                    <span style={{ color: "#4dd0ff" }}>{task.status}</span>
                  </div>
                  <p style={{ color: "#95b4c7", marginBottom: 0 }}>{task.description}</p>
                  {task.sourceDiscussionId ? (
                    <div style={{ marginTop: 8, color: "#4dd0ff", fontSize: 14 }}>
                      来源讨论：
                      {" "}
                      {task.sourceDiscussionTitle ??
                        discussionTitleById.get(task.sourceDiscussionId) ??
                        task.sourceDiscussionId}
                    </div>
                  ) : null}
                  {task.summary ? (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(77, 208, 255, 0.08)",
                        color: "#dff6ff",
                        lineHeight: 1.7
                      }}
                    >
                      {task.summary}
                    </div>
                  ) : null}
                  {task.runtimeJobs.length > 0 ? (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid rgba(77, 208, 255, 0.08)",
                        display: "grid",
                        gap: 10
                      }}
                    >
                      <div style={{ color: "#95b4c7", fontSize: 14 }}>运行记录</div>
                      {task.runtimeJobs.map((job, index) => (
                        <div
                          key={job.id}
                          style={{
                            borderRadius: 14,
                            padding: 12,
                            border: "1px solid rgba(77, 208, 255, 0.08)",
                            background: "rgba(255,255,255,0.02)",
                            display: "grid",
                            gap: 6
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              color: index === 0 ? "#4dd0ff" : "#9bb8c8",
                              fontSize: 13
                            }}
                          >
                            <span>#{index + 1} / {job.agentName}</span>
                            <span>{job.status}</span>
                          </div>
                          <div style={{ color: "#7fa8be", fontSize: 13 }}>
                            Thread: {job.threadId}
                          </div>
                          <div style={{ color: "#7fa8be", fontSize: 13 }}>
                            创建时间：{new Date(job.createdAt).toLocaleString("zh-CN")}
                          </div>
                          {job.startedAt ? (
                            <div style={{ color: "#7fa8be", fontSize: 13 }}>
                              开始时间：{new Date(job.startedAt).toLocaleString("zh-CN")}
                            </div>
                          ) : null}
                          {job.finishedAt ? (
                            <div style={{ color: "#7fa8be", fontSize: 13 }}>
                              完成时间：{new Date(job.finishedAt).toLocaleString("zh-CN")}
                            </div>
                          ) : null}
                          {job.error ? (
                            <div
                              style={{
                                color: "#ffc2c2",
                                fontSize: 13,
                                lineHeight: 1.5
                              }}
                            >
                              错误：{job.error}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(77, 208, 255, 0.08)",
                      display: "grid",
                      gap: 10
                    }}
                  >
                    <div style={{ color: "#95b4c7", fontSize: 14 }}>产物</div>
                    {artifacts.length > 0 ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {artifacts.map((artifact) => (
                          <div
                            key={artifact.id}
                            style={{
                              borderRadius: 14,
                              padding: 12,
                              border: "1px solid rgba(77, 208, 255, 0.08)",
                              background: "rgba(255,255,255,0.02)",
                              display: "grid",
                              gap: 4
                            }}
                          >
                            <strong style={{ color: "#dff6ff" }}>{artifact.filename}</strong>
                            <div style={{ color: "#7fa8be", fontSize: 13 }}>
                              路径：{artifact.virtualPath}
                            </div>
                            <div style={{ color: "#7fa8be", fontSize: 13 }}>
                              类型：{artifact.mimeType ?? "unknown"}
                            </div>
                            <div style={{ color: "#7fa8be", fontSize: 13 }}>
                              生成时间：{new Date(artifact.createdAt).toLocaleString("zh-CN")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#95b4c7", fontSize: 14 }}>当前任务还没有产物。</div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 14
                    }}
                  >
                    <AssignTaskForm
                      teamId={teamId}
                      taskId={task.id}
                      employees={employees.map((employee) => ({
                        id: employee.id,
                        name: employee.name
                      }))}
                      inputStyle={inputStyle}
                      buttonStyle={secondaryButtonStyle}
                    />

                    <RunTaskForm
                      teamId={teamId}
                      taskId={task.id}
                      employees={employees.map((employee) => ({
                        id: employee.id,
                        name: employee.name
                      }))}
                      inputStyle={inputStyle}
                      buttonStyle={primaryButtonStyle}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid rgba(77, 208, 255, 0.16)",
  background: "rgba(255,255,255,0.03)",
  color: "#f5fbff",
  padding: "14px 16px",
  outline: "none"
};

const primaryButtonStyle: React.CSSProperties = {
  height: 44,
  border: 0,
  borderRadius: 14,
  background: "#4dd0ff",
  color: "#03131f",
  fontWeight: 700,
  padding: "0 18px",
  cursor: "pointer"
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "transparent",
  color: "#4dd0ff",
  border: "1px solid rgba(77, 208, 255, 0.22)"
};
