import Link from "next/link";
import { getDiscussionMessages, getProjectDiscussions, getProjectEmployees } from "@/lib/api";
import {
} from "./actions";
import {
  CreateDiscussionForm,
  RunDiscussionForm,
  SendDiscussionMessageForm
} from "./forms";

type TeamDiscussionPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

function senderLabel(senderType: string, senderId: string | null) {
  if (senderType === "user") return "你";
  if (senderType === "employee" && senderId === "employee_xhs_ops") return "小红书运营";
  if (senderType === "employee" && senderId === "employee_crawler") return "爬虫专家";
  return senderId ?? senderType;
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

export default async function TeamDiscussionPage({ params }: TeamDiscussionPageProps) {
  const { teamId } = await params;
  const employees = await getProjectEmployees(teamId);
  const selectedEmployees = employees.filter((employee) => employee.selected);
  const employeeNameById = new Map(selectedEmployees.map((employee) => [employee.id, employee.name]));
  const employeeIndexById = new Map(selectedEmployees.map((employee, index) => [employee.id, index]));
  const discussions = await getProjectDiscussions(teamId);
  const activeDiscussion = discussions[0] ?? null;
  const messages = activeDiscussion ? await getDiscussionMessages(activeDiscussion.id) : [];

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
            STEP 4 / 历史讨论
          </div>
          <h1 style={{ margin: 0, fontSize: 42 }}>历史讨论工作台</h1>
          <p style={{ color: "#95b4c7", maxWidth: 720 }}>
            这里保留团队历史讨论和完整消息详情。日常协作优先在工作台内直接和团队沟通，这里更适合回看、追踪和管理讨论过程。
          </p>
        </div>

        <section
          style={{
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(77, 208, 255, 0.14)",
            background: "rgba(7, 21, 38, 0.9)",
            display: "grid",
            gap: 16
          }}
        >
          <h2 style={{ margin: 0 }}>创建讨论</h2>
          <CreateDiscussionForm
            teamId={teamId}
            selectedEmployees={selectedEmployees.map((employee) => ({
              id: employee.id,
              name: employee.name
            }))}
            inputStyle={inputStyle}
            buttonStyle={primaryButtonStyle}
          />
        </section>

        {activeDiscussion ? (
          <>
            <section
              style={{
                borderRadius: 24,
                padding: 24,
                border: "1px solid rgba(77, 208, 255, 0.14)",
                background: "rgba(7, 21, 38, 0.9)",
                display: "grid",
                gap: 10
              }}
            >
              <div style={{ color: "#4dd0ff", fontWeight: 700 }}>当前讨论</div>
              <h2 style={{ margin: 0 }}>{activeDiscussion.title}</h2>
              <div style={{ color: "#95b4c7" }}>
                参与员工：{activeDiscussion.participantEmployeeIds.join(" / ")}
              </div>
              <div style={{ color: "#7fa8be" }}>
                总结：{activeDiscussion.summary ?? "暂无摘要"}
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 20
              }}
            >
              <SendDiscussionMessageForm
                teamId={teamId}
                discussionId={activeDiscussion.id}
                inputStyle={inputStyle}
                buttonStyle={primaryButtonStyle}
              />

              <RunDiscussionForm
                teamId={teamId}
                discussionId={activeDiscussion.id}
                inputStyle={inputStyle}
                buttonStyle={secondaryButtonStyle}
              />
            </section>

            <section style={{ display: "grid", gap: 16 }}>
              {messages.map((message) => (
                <article
                  key={message.id}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    border: "1px solid rgba(77, 208, 255, 0.12)",
                    background:
                      message.senderType === "user"
                        ? "rgba(13, 46, 70, 0.92)"
                        : "rgba(7, 21, 38, 0.88)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                      color: "#4dd0ff"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {message.senderType === "employee" ? (
                        <div style={employeeAvatarStyle}>
                          <img
                            src={getEmployeeAvatar(
                              message.senderId ?? "employee",
                              message.senderId ? employeeIndexById.get(message.senderId) ?? 0 : 0
                            )}
                            alt={message.senderId ? employeeNameById.get(message.senderId) ?? "员工头像" : "员工头像"}
                            style={employeeAvatarImageStyle}
                          />
                        </div>
                      ) : null}
                      <strong>{senderLabel(message.senderType, message.senderId)}</strong>
                    </div>
                    <span>Round {message.roundNo}</span>
                  </div>
                  <p style={{ margin: 0, color: "#eff9ff", lineHeight: 1.7 }}>{message.content}</p>
                </article>
              ))}
            </section>
          </>
        ) : (
          <section
            style={{
              borderRadius: 24,
              padding: 24,
              border: "1px solid rgba(77, 208, 255, 0.14)",
              background: "rgba(7, 21, 38, 0.9)",
              color: "#95b4c7"
            }}
          >
            当前团队还没有 discussion session。
          </section>
        )}
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

const employeeAvatarStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#dbe7f2",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0
};

const employeeAvatarImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block"
};
