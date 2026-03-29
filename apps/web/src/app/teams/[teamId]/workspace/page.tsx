import Link from "next/link";
import { getProject, getProjectDiscussions, getProjectTasks } from "@/lib/api";

type TeamWorkspacePageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamWorkspacePage({ params }: TeamWorkspacePageProps) {
  const { teamId } = await params;
  const [team, discussions, tasks] = await Promise.all([
    getProject(teamId),
    getProjectDiscussions(teamId),
    getProjectTasks(teamId)
  ]);

  const latestDiscussion = discussions[0] ?? null;
  const latestTask = tasks[0] ?? null;

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <Link href="/" style={backLinkStyle}>
          返回员工库首页
        </Link>

        <header style={heroStyle}>
          <div style={eyebrowStyle}>WORKSPACE / 团队工作台</div>
          <h1 style={titleStyle}>{team?.name ?? "未命名团队"}</h1>
          <p style={descriptionStyle}>
            团队已经完成成员和技能配置。接下来就进入协作阶段：先群聊讨论，再把结论转成任务执行。
          </p>
        </header>

        <section style={overviewGridStyle}>
          <OverviewCard title="团队成员" value={`${team?.employeeCount ?? 0}`} note="已配置成员" />
          <OverviewCard title="活跃任务" value={`${team?.activeTaskCount ?? 0}`} note="进行中的执行链" />
          <OverviewCard title="最近讨论" value={latestDiscussion?.title ?? "暂无讨论"} note="最新协作主题" />
        </section>

        <section style={panelGridStyle}>
          <article style={moduleCardStyle}>
            <div style={{ color: "#4dd0ff", fontWeight: 800, marginBottom: 8 }}>群聊讨论</div>
            <h2 style={{ margin: 0, fontSize: 28 }}>先对齐思路，再产出决策</h2>
            <p style={moduleTextStyle}>
              多个数字员工围绕需求做一轮讨论，沉淀摘要后再转成执行任务。
            </p>
            <div style={metaStyle}>
              当前摘要：{latestDiscussion?.summary ?? "还没有讨论，建议先发起一轮群聊。"}
            </div>
            <Link href={`/teams/${teamId}/discussion`} style={primaryLinkStyle}>
              进入讨论工作台
            </Link>
          </article>

          <article style={moduleCardStyle}>
            <div style={{ color: "#4dd0ff", fontWeight: 800, marginBottom: 8 }}>任务执行</div>
            <h2 style={{ margin: 0, fontSize: 28 }}>把讨论结果交给员工执行</h2>
            <p style={moduleTextStyle}>
              把讨论结论沉淀为任务，指派给具体员工，并回收产物与执行摘要。
            </p>
            <div style={metaStyle}>
              最新任务：{latestTask?.title ?? "还没有任务，建议先从讨论创建任务。"}
            </div>
            <Link href={`/teams/${teamId}/tasks`} style={primaryLinkStyle}>
              进入任务工作台
            </Link>
          </article>
        </section>
      </section>
    </main>
  );
}

function OverviewCard(props: { title: string; value: string; note: string }) {
  return (
    <div style={overviewCardStyle}>
      <div style={{ color: "#73dcff", fontSize: 12, letterSpacing: 1.2 }}>{props.title}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#effbff" }}>{props.value}</div>
      <div style={{ color: "#95b4c7", fontSize: 13 }}>{props.note}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "28px 24px 56px",
  background:
    "radial-gradient(circle at top, rgba(39,123,167,0.18), transparent 30%), #07131f",
  color: "#f6fbff",
  fontFamily:
    '"SF Mono", "Roboto Mono", "IBM Plex Sans SC", ui-sans-serif, sans-serif'
} satisfies React.CSSProperties;

const shellStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gap: 22
} satisfies React.CSSProperties;

const heroStyle = {
  borderRadius: 28,
  padding: 28,
  border: "1px solid rgba(77, 208, 255, 0.18)",
  background: "rgba(7, 21, 38, 0.9)"
} satisfies React.CSSProperties;

const overviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16
} satisfies React.CSSProperties;

const overviewCardStyle = {
  minHeight: 120,
  borderRadius: 18,
  padding: 18,
  border: "1px solid rgba(77, 208, 255, 0.14)",
  background: "rgba(255,255,255,0.02)",
  display: "grid",
  alignContent: "space-between"
} satisfies React.CSSProperties;

const panelGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 20
} satisfies React.CSSProperties;

const moduleCardStyle = {
  borderRadius: 22,
  padding: 22,
  border: "1px solid rgba(77, 208, 255, 0.14)",
  background: "rgba(7, 21, 38, 0.92)",
  display: "grid",
  gap: 14
} satisfies React.CSSProperties;

const moduleTextStyle = {
  color: "#95b4c7",
  lineHeight: 1.7,
  margin: 0
} satisfies React.CSSProperties;

const metaStyle = {
  color: "#d7eef7",
  lineHeight: 1.7,
  fontSize: 14,
  minHeight: 72
} satisfies React.CSSProperties;

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 44,
  padding: "0 18px",
  borderRadius: 14,
  textDecoration: "none",
  color: "#03131f",
  background: "#4dd0ff",
  fontWeight: 700
} satisfies React.CSSProperties;

const backLinkStyle = {
  color: "#4dd0ff",
  textDecoration: "none"
} satisfies React.CSSProperties;

const eyebrowStyle = {
  color: "#4dd0ff",
  marginBottom: 10,
  fontWeight: 700
} satisfies React.CSSProperties;

const titleStyle = {
  margin: 0,
  fontSize: 42
} satisfies React.CSSProperties;

const descriptionStyle = {
  color: "#95b4c7",
  maxWidth: 820
} satisfies React.CSSProperties;
