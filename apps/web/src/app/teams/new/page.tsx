import Link from "next/link";
import { getEmployeeCatalog } from "@/lib/api";
import { createTeamAction } from "./actions";

type TeamNewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeSelectedIds(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export default async function TeamNewPage({ searchParams }: TeamNewPageProps) {
  const employees = await getEmployeeCatalog();
  const params = await searchParams;
  const preselectedIds = new Set(normalizeSelectedIds(params.employeeIds));

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <Link href="/" style={backLinkStyle}>
          返回员工库首页
        </Link>

        <header style={heroStyle}>
          <div style={eyebrowStyle}>STEP 1 / 创建团队</div>
          <h1 style={titleStyle}>先给团队起名，再确认第一批成员</h1>
          <p style={descriptionStyle}>
            团队是工作台的组织单元。你可以从首页预选员工带进来，也可以先建团队，下一步再调整成员。
          </p>
        </header>

        <form action={createTeamAction} style={panelStyle}>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle} htmlFor="team-name">
              团队名称
            </label>
            <input
              id="team-name"
              name="name"
              defaultValue={preselectedIds.size > 0 ? "我的数字员工团队" : ""}
              placeholder="例如：法律顾问团队 / 小红书增长团队"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div style={labelStyle}>预选员工</div>
            <div style={memberGridStyle}>
              {employees.map((employee) => {
                const checked = preselectedIds.has(employee.id);

                return (
                  <label key={employee.id} style={memberCardStyle(checked)}>
                    <input
                      type="checkbox"
                      name="employeeId"
                      value={employee.id}
                      defaultChecked={checked}
                      style={{ marginTop: 3 }}
                    />
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#effbff" }}>{employee.name}</strong>
                      <div style={{ color: "#4dd0ff", fontSize: 13 }}>{employee.role}</div>
                      <div style={{ color: "#94b8c9", fontSize: 13, lineHeight: 1.6 }}>
                        {employee.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div style={{ color: "#8cb4c8", fontSize: 14 }}>
              创建后会进入成员确认页，你还可以继续添加或移除员工。
            </div>
            <button type="submit" style={primaryButtonStyle}>
              创建团队并继续
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "28px 24px 56px",
  background:
    "radial-gradient(circle at top, rgba(39,123,167,0.18), transparent 30%), #07131f",
  color: "#f6fbff",
  fontFamily:
    '"SF Mono", "Roboto Mono", "IBM Plex Sans SC", ui-sans-serif, sans-serif'
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gap: 22
};

const heroStyle: React.CSSProperties = {
  borderRadius: 28,
  padding: 28,
  border: "1px solid rgba(77, 208, 255, 0.18)",
  background: "rgba(7, 21, 38, 0.9)"
};

const panelStyle: React.CSSProperties = {
  display: "grid",
  gap: 24,
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(77, 208, 255, 0.14)",
  background: "rgba(7, 21, 38, 0.92)"
};

const memberGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16
};

const labelStyle: React.CSSProperties = {
  color: "#4dd0ff",
  fontWeight: 800,
  fontSize: 14
};

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

const backLinkStyle: React.CSSProperties = {
  color: "#4dd0ff",
  textDecoration: "none"
};

const eyebrowStyle: React.CSSProperties = {
  color: "#4dd0ff",
  marginBottom: 10,
  fontWeight: 700
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 42
};

const descriptionStyle: React.CSSProperties = {
  color: "#95b4c7",
  maxWidth: 820
};

function memberCardStyle(checked: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "18px 1fr",
    gap: 12,
    padding: 18,
    borderRadius: 18,
    border: checked
      ? "1px solid rgba(77, 208, 255, 0.42)"
      : "1px solid rgba(77, 208, 255, 0.14)",
    background: checked
      ? "linear-gradient(180deg, rgba(8,26,48,0.95), rgba(6,22,40,0.95))"
      : "rgba(255,255,255,0.02)"
  };
}
