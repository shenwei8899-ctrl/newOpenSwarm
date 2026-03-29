import Link from "next/link";
import { getEmployeeCatalog, getProjects } from "@/lib/api";

function employeeSerial(index: number) {
  return `OS-${String(index + 1).padStart(3, "0")}`;
}

function getEmployeeCapabilities(employee: { role: string; defaultModel: string }) {
  const presets: Record<string, string[]> = {
    运营: ["内容策划", "投放执行", "节奏推进"],
    研究: ["信息补齐", "案例检索", "证据归纳"],
    工程: ["方案拆解", "执行稳定", "状态清晰"]
  };

  return presets[employee.role] ?? [employee.role, "标准技能包", employee.defaultModel];
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

export default async function HomePage() {
  const [employees, projects] = await Promise.all([getEmployeeCatalog(), getProjects()]);
  const activeProject = projects[0] ?? null;

  return (
    <main className="home-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --bg: #05070c;
              --bg-2: #0b1322;
              --panel: rgba(8, 18, 34, 0.92);
              --panel-soft: rgba(7, 17, 31, 0.76);
              --line: rgba(57, 208, 255, 0.18);
              --line-strong: rgba(57, 208, 255, 0.34);
              --text: #e9f3ff;
              --text-dim: #8ea5c4;
              --gold: #39d0ff;
              --gold-dim: #16a5d4;
              --warn: #efe622;
            }
            .home-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                radial-gradient(circle, rgba(74, 144, 226, 0.36) 1.3px, transparent 1.4px) 0 0 / 22px 22px,
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: var(--text);
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
            }
            .home-page {
              width: min(1760px, calc(100vw - 56px));
              margin: 0 auto;
              padding: 14px clamp(12px, 1.4vw, 24px) 30px;
            }
            .home-topbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              margin-bottom: 16px;
              padding-inline: 6px;
              color: var(--text-dim);
              font-size: 0.82rem;
            }
            .home-brand {
              color: var(--gold);
              font-weight: 700;
              letter-spacing: 0.12em;
            }
            .home-links {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              align-items: center;
            }
            .home-links a {
              color: var(--gold-dim);
              text-decoration: none;
            }
            .home-links a:hover {
              color: var(--gold);
            }
            .hero-panel {
              border: 1px solid var(--line-strong);
              border-radius: 18px;
              background: linear-gradient(180deg, rgba(8, 18, 34, 0.92), rgba(4, 10, 19, 0.96));
              box-shadow: 0 24px 64px rgba(0, 7, 18, 0.42);
              margin-inline: 6px;
              padding: 20px;
              margin-bottom: 18px;
            }
            .hero-grid {
              display: grid;
              grid-template-columns: minmax(320px, 1.35fr) repeat(2, minmax(180px, 0.65fr));
              gap: 12px;
            }
            .hero-stat {
              border-radius: 14px;
              border: 1px solid var(--line);
              background: rgba(8, 19, 34, 0.82);
              padding: 14px;
              min-height: 110px;
              display: grid;
              align-content: space-between;
            }
            .hero-stat-label {
              color: var(--text-dim);
              font-size: 0.72rem;
              letter-spacing: 0.05em;
            }
            .hero-stat-value {
              color: var(--text);
              font-size: 1.28rem;
              font-weight: 700;
              line-height: 1.2;
            }
            .hero-actions {
              margin-top: 12px;
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              align-items: center;
            }
            .hero-button-primary,
            .hero-button-secondary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 120px;
              height: 38px;
              padding: 0 16px;
              border-radius: 999px;
              text-decoration: none;
              font-size: 0.8rem;
              transition: 0.18s ease;
            }
            .hero-button-primary {
              color: #05111d;
              background: linear-gradient(180deg, #4ad8ff, #2fc7f5);
              font-weight: 700;
            }
            .hero-button-secondary {
              color: var(--gold);
              border: 1px solid var(--line-strong);
              background: rgba(11, 26, 45, 0.9);
            }
            .hero-button-secondary:hover,
            .hero-button-primary:hover {
              filter: brightness(1.05);
            }
            .employee-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              padding-inline: 6px;
              margin-bottom: 8px;
              flex-wrap: wrap;
            }
            .employee-header h1 {
              margin: 0;
              font-size: 1.5rem;
              color: var(--gold);
              letter-spacing: 0.08em;
            }
            .employee-header p {
              margin: 4px 0 0;
              color: var(--text-dim);
              font-size: 0.84rem;
            }
            .grid-64 {
              position: relative;
              z-index: 1;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
              gap: 18px 12px;
              align-items: start;
              padding-inline: 6px;
              width: 100%;
              box-sizing: border-box;
            }
            .card-hex {
              position: relative;
              width: 100%;
              padding-top: 10px;
              overflow: visible;
              transition: transform 0.2s ease, filter 0.2s ease;
            }
            .card-hex:hover {
              transform: translateY(-2px);
              filter: brightness(1.02);
            }
            .card-shell {
              position: relative;
              width: 100%;
              aspect-ratio: 5900 / 3928;
              background: url('/assets/id-card/holder.png') center / contain no-repeat;
              filter: drop-shadow(0 14px 20px rgba(0, 0, 0, 0.34));
              --card-inset-x: 5.8%;
              --card-inset-top: 17.4%;
              --card-inset-bottom: 4.6%;
            }
            .card-shell::before {
              content: "";
              position: absolute;
              left: var(--card-inset-x);
              right: var(--card-inset-x);
              top: var(--card-inset-top);
              bottom: var(--card-inset-bottom);
              background: #ffffff;
              border-radius: 0;
              opacity: 1;
              pointer-events: none;
              z-index: 0;
            }
            .card-panel {
              position: absolute;
              left: var(--card-inset-x);
              right: var(--card-inset-x);
              top: var(--card-inset-top);
              bottom: var(--card-inset-bottom);
              z-index: 1;
              min-height: 0;
              display: grid;
              grid-template-columns: 34px 1fr;
              overflow: hidden;
              border: none;
              background: transparent;
              border-radius: 0;
            }
            .card-side {
              position: relative;
              z-index: 1;
              background: #efe622;
              color: rgba(97, 97, 24, 0.52);
              font-weight: 700;
              letter-spacing: 0.12em;
              font-size: 0.54rem;
              writing-mode: vertical-rl;
              text-orientation: mixed;
              display: flex;
              align-items: center;
              justify-content: center;
              user-select: none;
            }
            .card-main {
              position: relative;
              z-index: 1;
              padding: 12px 14px 10px;
              display: flex;
              flex-direction: column;
              gap: 0;
              color: #252b33;
              padding-bottom: 52px;
              min-height: 0;
            }
            .card-top {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
              align-items: stretch;
              padding-left: 0;
              margin-bottom: 2px;
            }
            .card-left {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              gap: 6px;
              min-width: 0;
              padding-top: 2px;
            }
            .card-avatar-wrap {
              width: 66px;
              height: 66px;
              border-radius: 50%;
              border: 2px solid #e8dc27;
              padding: 6px;
              background: #f7f7f7;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .card-avatar {
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: none;
              background: #c2c7cf;
              object-fit: cover;
              display: block;
            }
            .card-name-chip {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 18px;
              color: #2f3238;
              font-size: 0.56rem;
              font-weight: 800;
              line-height: 1.1;
              text-align: center;
            }
            .card-right {
              display: flex;
              flex-direction: column;
              gap: 2px;
              padding-top: 0;
            }
            .card-status-panel {
              display: flex;
              flex-direction: column;
              gap: 4px;
              padding: 2px 0 0;
              min-height: 78px;
            }
            .card-status-k {
              font-size: 0.5rem;
              font-weight: 700;
              letter-spacing: 0.02em;
              color: #1f2227;
              line-height: 1.2;
            }
            .card-status-skills {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 4px 6px;
              margin-top: 1px;
            }
            .card-status-skill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 18px;
              padding: 0 6px;
              border-radius: 999px;
              background: #f3f8fc;
              border: 1px solid rgba(57, 208, 255, 0.12);
              color: #4e6275;
              font-size: 0.5rem;
              line-height: 1.1;
              font-family: "Noto Sans SC", "PingFang SC", sans-serif;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .card-status-no {
              margin-top: 4px;
              font-size: 0.48rem;
              font-weight: 700;
              color: #1f2227;
              line-height: 1.2;
            }
            .card-status-no-value {
              font-family: "JetBrains Mono", "Noto Sans SC", "PingFang SC", sans-serif;
              font-size: 0.5rem;
              color: #5a616a;
              line-height: 1.2;
            }
            .card-bottom {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              position: absolute;
              left: 14px;
              right: 14px;
              bottom: 10px;
              align-items: flex-end;
            }
            .card-motto {
              flex: 1;
              min-width: 0;
              margin-right: 8px;
              border-top: 1px dashed rgba(120, 124, 131, 0.35);
              padding-top: 7px;
              color: #6f747b;
              font-size: 0.49rem;
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .card-action-wrap {
              flex-shrink: 0;
              display: flex;
              align-items: flex-end;
            }
            .card-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 68px;
              height: 26px;
              border-radius: 7px;
              background: #efe622;
              color: #141a1d;
              text-decoration: none;
              font-size: 0.62rem;
              font-weight: 800;
              box-shadow: inset 0 -1px 0 rgba(0,0,0,0.18);
              flex-shrink: 0;
            }
            @media (min-width: 1660px) {
              .grid-64 {
                grid-template-columns: repeat(6, minmax(0, 1fr));
              }
            }
            @media (max-width: 1500px) {
              .hero-grid {
                grid-template-columns: minmax(280px, 1.2fr) repeat(2, minmax(160px, 0.6fr));
              }
            }
            @media (max-width: 1360px) {
              .hero-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 1180px) {
              .grid-64 {
                grid-template-columns: repeat(3, minmax(0, 1fr));
                justify-content: stretch;
                gap: 16px 12px;
              }
            }
            @media (max-width: 980px) {
              .home-page { width: calc(100vw - 24px); padding: 12px 8px 24px; }
              .grid-64 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                justify-content: stretch;
                gap: 16px 12px;
              }
            }
            @media (max-width: 780px) {
              .hero-panel {
                padding: 16px;
              }
              .grid-64 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @media (max-width: 640px) {
              .home-topbar,
              .employee-header {
                flex-direction: column;
                align-items: flex-start;
              }
              .hero-grid,
              .grid-64 {
                grid-template-columns: 1fr;
              }
              .home-page {
                width: calc(100vw - 16px);
                padding: 10px 4px 20px;
              }
              .hero-panel,
              .employee-header,
              .home-topbar,
              .grid-64 {
                margin-inline: 0;
                padding-inline: 0;
              }
              .card-main {
                padding: 12px 12px 50px;
              }
            }
          `
        }}
      />
      <div className="home-page">
        <header className="home-topbar">
          <div className="home-brand">OpenSwarm</div>
          <div className="home-links">
            <Link href="/">数字员工</Link>
            <Link href="/skills.html">技能库</Link>
            <Link href="/teams">
              我的团队
            </Link>
            <Link href="/teams/new">创建团队</Link>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-stat">
              <div className="hero-stat-label">COMMAND CORE</div>
              <div className="hero-stat-value">{activeProject?.name ?? "未创建团队"}</div>
              <div className="hero-actions">
                <Link className="hero-button-primary" href="/teams/new">
                  创建团队
                </Link>
                <Link className="hero-button-secondary" href="/teams">
                  团队列表
                </Link>
              </div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">AGENT STUDIO</div>
              <div className="hero-stat-value">{employees.length}</div>
              <div className="hero-stat-label">标准数字员工</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">TEAM</div>
              <div className="hero-stat-value">{projects.length}</div>
              <div className="hero-stat-label">已创建团队</div>
            </div>
          </div>
        </section>

        <section className="employee-header">
          <div>
            <h1>ACTIVE BODY</h1>
            <p>标准化数字员工模板。先选人，再建队，再进入技能编排与工作台。</p>
          </div>
          {activeProject ? (
            <div className="home-links">
              <span>最近团队：</span>
              <Link href="/teams">{activeProject.name}</Link>
            </div>
          ) : null}
        </section>

        <section className="grid-64">
          {employees.map((employee, index) => (
            <article key={employee.id} className="card-hex">
              <div className="card-shell">
                <div className="card-panel">
                  <div className="card-side">DIGITAL EMPLOYEE CARD</div>
                  <div className="card-main">
                    <div className="card-top">
                      <div className="card-left">
                        <div className="card-avatar-wrap">
                          <img
                            className="card-avatar"
                            src={getEmployeeAvatar(employee.id, index)}
                            alt={employee.name}
                          />
                        </div>
                        <div className="card-name-chip">{employee.name}</div>
                      </div>
                      <div className="card-right">
                        <div className="card-status-panel">
                          <div className="card-status-k">员工能力介绍</div>
                          <div className="card-status-skills">
                            {getEmployeeCapabilities(employee).map((capability) => (
                              <div key={capability} className="card-status-skill">
                                {capability}
                              </div>
                            ))}
                          </div>
                          <div className="card-status-no">NO.</div>
                          <div className="card-status-no-value">{employeeSerial(index)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="card-bottom">
                      <div className="card-motto">{employee.description}</div>
                      <div className="card-action-wrap">
                        <Link className="card-btn" href={`/teams/new?employeeIds=${employee.id}`}>
                          加入团队
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
