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

export default async function TeamDiscussionPage({ params }: TeamDiscussionPageProps) {
  const { teamId } = await params;
  const employees = await getProjectEmployees(teamId);
  const selectedEmployees = employees.filter((employee) => employee.selected);
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
            STEP 4 / 群聊讨论
          </div>
          <h1 style={{ margin: 0, fontSize: 42 }}>讨论工作台</h1>
          <p style={{ color: "#95b4c7", maxWidth: 720 }}>
            团队已经完成成员和技能配置，现在可以直接创建讨论、发消息并触发一轮多员工讨论。
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
                      gap: 12,
                      marginBottom: 10,
                      color: "#4dd0ff"
                    }}
                  >
                    <strong>{senderLabel(message.senderType, message.senderId)}</strong>
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
