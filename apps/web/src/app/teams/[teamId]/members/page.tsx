import Link from "next/link";
import { getProject, getProjectEmployees } from "@/lib/api";
import { saveTeamMembersAction } from "./actions";

type TeamMembersPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamMembersPage({ params }: TeamMembersPageProps) {
  const { teamId } = await params;
  const [team, employees] = await Promise.all([getProject(teamId), getProjectEmployees(teamId)]);

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <Link href="/" style={backLinkStyle}>
          返回员工库首页
        </Link>

        <header style={heroStyle}>
          <div style={eyebrowStyle}>STEP 2 / 团队成员确认</div>
          <h1 style={titleStyle}>{team?.name ?? "未命名团队"}</h1>
          <p style={descriptionStyle}>
            先把参与这支团队的数字员工确认下来。下一步会基于已选成员配置默认技能和项目附加技能。
          </p>
        </header>

        <form action={saveTeamMembersAction} style={panelStyle}>
          <input type="hidden" name="teamId" value={teamId} />
          <div style={memberGridStyle}>
            {employees.map((employee) => (
              <label key={employee.id} style={memberCardStyle(employee.selected)}>
                <input
                  type="checkbox"
                  name="employeeId"
                  value={employee.id}
                  defaultChecked={employee.selected}
                  style={{ marginTop: 4 }}
                />
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ color: "#effbff" }}>{employee.name}</strong>
                  <div style={{ color: "#4dd0ff", fontSize: 13 }}>{employee.role}</div>
                  <div style={{ color: "#94b8c9", fontSize: 13, lineHeight: 1.6 }}>
                    {employee.description}
                  </div>
                  <div style={{ color: "#7da9c1", fontSize: 12 }}>
                    默认模型：{employee.defaultModel}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <Link href={`/teams/${teamId}/workspace`} style={secondaryLinkStyle}>
              直接进入工作台
            </Link>
            <button type="submit" style={primaryButtonStyle}>
              保存成员并继续配置技能
            </button>
          </div>
        </form>
      </section>
    </main>
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

const panelStyle = {
  display: "grid",
  gap: 22,
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(77, 208, 255, 0.14)",
  background: "rgba(7, 21, 38, 0.92)"
} satisfies React.CSSProperties;

const memberGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20
} satisfies React.CSSProperties;

const primaryButtonStyle = {
  height: 44,
  border: 0,
  borderRadius: 14,
  background: "#4dd0ff",
  color: "#03131f",
  fontWeight: 700,
  padding: "0 18px",
  cursor: "pointer"
} satisfies React.CSSProperties;

const backLinkStyle = {
  color: "#4dd0ff",
  textDecoration: "none"
} satisfies React.CSSProperties;

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
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

function memberCardStyle(checked: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 12,
    padding: 22,
    borderRadius: 22,
    border: checked
      ? "1px solid rgba(77, 208, 255, 0.42)"
      : "1px solid rgba(77, 208, 255, 0.15)",
    background: checked
      ? "linear-gradient(180deg, rgba(8,26,48,0.95), rgba(6,22,40,0.95))"
      : "rgba(7, 21, 38, 0.82)"
  };
}
