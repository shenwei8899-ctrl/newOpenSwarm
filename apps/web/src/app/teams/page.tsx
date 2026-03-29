import Link from "next/link";
import { getProjects } from "@/lib/api";

function teamCode(projectId: string) {
  return projectId.replace(/^proj_/, "").slice(0, 12) || projectId.slice(0, 12);
}

export default async function TeamsPage() {
  const projects = await getProjects();

  return (
    <main className="teams-page-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .teams-page-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                radial-gradient(circle, rgba(74, 144, 226, 0.36) 1.3px, transparent 1.4px) 0 0 / 22px 22px,
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: #e9f3ff;
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
              padding: 16px 18px 28px;
            }
            .teams-page {
              width: min(1760px, calc(100vw - 40px));
              margin: 0 auto;
              display: grid;
              gap: 18px;
            }
            .teams-topbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              color: #9cb4d3;
              font-size: 0.82rem;
            }
            .teams-topbar a {
              color: #39d0ff;
              text-decoration: none;
            }
            .teams-hero {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 18px;
              flex-wrap: wrap;
            }
            .teams-title {
              margin: 0;
              color: #39d0ff;
              font-size: 1.6rem;
              letter-spacing: 0.06em;
            }
            .teams-copy {
              margin: 6px 0 0;
              color: #8ea5c4;
              font-size: 0.84rem;
            }
            .teams-hero-action {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 112px;
              height: 38px;
              padding: 0 16px;
              border-radius: 999px;
              text-decoration: none;
              color: #04121d;
              background: linear-gradient(180deg, #4ad8ff, #2fc7f5);
              font-size: 0.84rem;
              font-weight: 700;
            }
            .teams-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
              gap: 18px;
            }
            .team-card {
              border-radius: 22px;
              border: 1px solid rgba(57, 208, 255, 0.24);
              background:
                linear-gradient(rgba(12, 21, 37, 0.92), rgba(7, 16, 29, 0.96)),
                linear-gradient(90deg, rgba(57, 208, 255, 0.06), rgba(57, 208, 255, 0.02));
              box-shadow:
                inset 0 0 0 1px rgba(57, 208, 255, 0.06),
                0 16px 36px rgba(0, 7, 18, 0.28);
              padding: 18px 18px 16px;
              position: relative;
              overflow: hidden;
            }
            .team-card::before {
              content: "";
              position: absolute;
              inset: 0;
              background:
                linear-gradient(rgba(57, 208, 255, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(57, 208, 255, 0.04) 1px, transparent 1px);
              background-size: 28px 28px;
              pointer-events: none;
              opacity: 0.45;
            }
            .team-card-inner {
              position: relative;
              z-index: 1;
              display: grid;
              gap: 14px;
            }
            .team-card-head {
              display: grid;
              grid-template-columns: 68px 1fr;
              gap: 16px;
              align-items: start;
            }
            .team-badge {
              width: 56px;
              height: 56px;
              border-radius: 16px;
              border: 1px solid rgba(57, 208, 255, 0.34);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #39d0ff;
              font-weight: 800;
              font-size: 0.9rem;
              background: rgba(9, 22, 39, 0.88);
              box-shadow: inset 0 0 0 1px rgba(57, 208, 255, 0.04);
            }
            .team-name {
              margin: 2px 0 10px;
              color: #39d0ff;
              font-size: 1.05rem;
              font-weight: 800;
              line-height: 1.2;
              word-break: break-word;
            }
            .team-meta-row {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            .team-pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 34px;
              padding: 0 14px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.26);
              color: #d9f5ff;
              background: rgba(7, 18, 32, 0.84);
              font-size: 0.78rem;
            }
            .team-entry {
              display: grid;
              grid-template-columns: 92px 1fr;
              align-items: center;
              gap: 14px;
              min-height: 58px;
              border-radius: 18px;
              border: 1px solid rgba(57, 208, 255, 0.2);
              color: #e8f9ff;
              text-decoration: none;
              background: rgba(7, 18, 32, 0.84);
              padding: 0 18px;
            }
            .team-entry-code {
              color: #39d0ff;
              font-weight: 800;
              letter-spacing: 0.14em;
            }
            .team-entry-text {
              color: #d4e9f5;
              font-size: 0.84rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .team-actions {
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }
            .team-button,
            .team-button-muted {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 108px;
              height: 46px;
              padding: 0 16px;
              border-radius: 16px;
              text-decoration: none;
              font-size: 0.92rem;
              font-weight: 700;
              border: 1px solid rgba(57, 208, 255, 0.24);
              background: rgba(7, 18, 32, 0.88);
            }
            .team-button {
              color: #39d0ff;
            }
            .team-button-muted {
              color: #6f8093;
            }
            @media (max-width: 900px) {
              .teams-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @media (max-width: 680px) {
              .teams-page {
                width: calc(100vw - 20px);
              }
              .teams-grid {
                grid-template-columns: 1fr;
              }
              .team-entry {
                grid-template-columns: 78px 1fr;
              }
              .team-actions {
                grid-template-columns: 1fr 1fr;
                display: grid;
              }
            }
          `
        }}
      />

      <div className="teams-page">
        <header className="teams-topbar">
          <Link href="/">返回员工库首页</Link>
          <span>TEAM INDEX / 团队列表</span>
        </header>

        <section className="teams-hero">
          <div>
            <h1 className="teams-title">团队列表</h1>
            <p className="teams-copy">进入团队空间，开始协作、编排与执行。</p>
          </div>
          <Link href="/teams/new" className="teams-hero-action">
            创建团队
          </Link>
        </section>

        <section className="teams-grid">
          {projects.map((project) => (
            <article key={project.id} className="team-card">
              <div className="team-card-inner">
                <div className="team-card-head">
                  <div className="team-badge">T{Math.max(project.employeeCount, 1)}</div>
                  <div>
                    <div className="team-name">{project.name}</div>
                    <div className="team-meta-row">
                      <span className="team-pill">数字员工 {project.employeeCount} 个</span>
                      <span className="team-pill">ID · {teamCode(project.id)}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/teams/${project.id}/workspace`} className="team-entry">
                  <span className="team-entry-code">ENTER</span>
                  <span className="team-entry-text">进入团队空间，开始协作与编排</span>
                </Link>

                <div className="team-actions">
                  <Link href={`/teams/${project.id}/workspace`} className="team-button">
                    进入
                  </Link>
                  <span className="team-button-muted">删除</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
