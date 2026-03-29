import Link from "next/link";
import { getProject, getProjectSkillAssignments, getSkills } from "@/lib/api";
import { saveTeamSkillsAction } from "./actions";

type TeamSkillsPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamSkillsPage({ params }: TeamSkillsPageProps) {
  const { teamId } = await params;
  const [team, skills, assignments] = await Promise.all([
    getProject(teamId),
    getSkills(),
    getProjectSkillAssignments(teamId)
  ]);

  const assignedCount = assignments.assignments.reduce(
    (sum, assignment) => sum + assignment.skillIds.length,
    0
  );

  return (
    <main className="skills-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --bg: #050913;
              --panel: rgba(8, 18, 34, 0.88);
              --panel-strong: rgba(6, 14, 28, 0.96);
              --line: rgba(57, 208, 255, 0.18);
              --line-strong: rgba(57, 208, 255, 0.3);
              --text: #e9f3ff;
              --text-dim: #8ea5c4;
              --gold: #39d0ff;
              --gold-dim: #16a5d4;
            }
            .skills-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: var(--text);
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
            }
            .skills-page {
              position: relative;
              width: min(1480px, calc(100vw - 32px));
              margin: 0 auto;
              padding: 26px 0 40px;
            }
            .skills-topbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              margin-bottom: 18px;
              color: var(--text-dim);
              font-size: 0.82rem;
            }
            .skills-topbar-links {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            .skills-topbar a {
              color: var(--gold-dim);
              text-decoration: none;
            }
            .skills-topbar a:hover { color: var(--gold); }
            .hero {
              display: grid;
              grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
              gap: 16px;
              margin-bottom: 20px;
            }
            .hero-main,
            .hero-side,
            .section-card {
              background: linear-gradient(180deg, rgba(9, 18, 34, 0.92), rgba(4, 10, 19, 0.96));
              border: 1px solid var(--line);
              border-radius: 28px;
              box-shadow: 0 24px 64px rgba(0, 7, 18, 0.42);
            }
            .hero-main {
              padding: 26px 28px;
              position: relative;
              overflow: hidden;
            }
            .hero-main::before {
              content: "";
              position: absolute;
              inset: 0;
              background:
                radial-gradient(circle at 0% 0%, rgba(57, 208, 255, 0.14), transparent 28%),
                radial-gradient(circle at 100% 0%, rgba(57, 208, 255, 0.08), transparent 24%);
              pointer-events: none;
            }
            .eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.24);
              background: rgba(9, 28, 48, 0.76);
              color: var(--gold);
              font-size: 0.78rem;
              letter-spacing: 0.04em;
              margin-bottom: 14px;
            }
            .hero h1 {
              margin: 0;
              font-size: clamp(1.9rem, 2.8vw, 3rem);
              line-height: 1.04;
            }
            .hero p {
              margin: 14px 0 0;
              max-width: 820px;
              color: var(--text-dim);
              line-height: 1.72;
              font-size: 0.98rem;
            }
            .hero-actions {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              margin-top: 18px;
            }
            .btn-primary,
            .btn-secondary {
              border: 1px solid transparent;
              border-radius: 999px;
              cursor: pointer;
              font-family: inherit;
              font-size: 0.86rem;
              transition: 0.18s ease;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .btn-primary {
              padding: 11px 18px;
              color: #05111d;
              background: linear-gradient(180deg, #4ad8ff, #2fc7f5);
              font-weight: 700;
            }
            .btn-secondary {
              padding: 11px 18px;
              color: var(--gold);
              background: rgba(11, 26, 45, 0.9);
              border-color: rgba(57, 208, 255, 0.28);
            }
            .hero-side {
              padding: 22px 22px 18px;
              display: flex;
              flex-direction: column;
              gap: 14px;
            }
            .stat-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            .stat-card,
            .side-note {
              padding: 14px 14px 12px;
              border-radius: 14px;
              background: rgba(8, 19, 34, 0.82);
              border: 1px solid rgba(57, 208, 255, 0.16);
            }
            .stat-label {
              color: var(--text-dim);
              font-size: 0.72rem;
              letter-spacing: 0.04em;
              margin-bottom: 6px;
            }
            .stat-value {
              color: var(--text);
              font-size: 1.3rem;
              font-weight: 700;
            }
            .side-note h3 {
              margin: 0 0 8px;
              font-size: 0.92rem;
              color: var(--gold);
            }
            .side-note p {
              margin: 0;
              color: var(--text-dim);
              font-size: 0.8rem;
              line-height: 1.65;
            }
            .section-card {
              padding: 20px;
              margin-bottom: 18px;
            }
            .section-head {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 14px;
            }
            .section-head h2 {
              margin: 0;
              font-size: 1.08rem;
            }
            .section-head p {
              margin: 4px 0 0;
              color: var(--text-dim);
              font-size: 0.82rem;
            }
            .template-strip {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }
            .template-card {
              padding: 14px;
              border-radius: 14px;
              border: 1px solid rgba(57, 208, 255, 0.14);
              background: linear-gradient(180deg, rgba(7, 17, 32, 0.9), rgba(7, 14, 25, 0.72));
            }
            .template-card-title {
              color: var(--text);
              font-weight: 600;
              margin-bottom: 8px;
            }
            .template-card-meta {
              color: var(--text-dim);
              font-size: 0.76rem;
              line-height: 1.6;
            }
            .template-card-skills {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-top: 10px;
            }
            .mini-chip,
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 7px 12px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.16);
              background: rgba(9, 22, 40, 0.72);
              color: var(--text-dim);
              font-size: 0.76rem;
            }
            .skills-agent-list {
              display: grid;
              gap: 14px;
            }
            .skills-agent-row {
              border-radius: 18px;
              border: 1px solid rgba(57, 208, 255, 0.14);
              background: linear-gradient(180deg, rgba(8, 18, 34, 0.88), rgba(5, 12, 22, 0.92));
              padding: 16px;
            }
            .skills-agent-name {
              color: var(--text);
              font-weight: 700;
              margin-bottom: 8px;
            }
            .skills-agent-note {
              color: var(--text-dim);
              font-size: 0.78rem;
              margin-bottom: 12px;
            }
            .skills-agent-options {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .skills-chip {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.16);
              background: rgba(9, 22, 40, 0.72);
              color: var(--text-dim);
              font-size: 0.76rem;
              cursor: pointer;
            }
            .skills-chip.is-checked {
              color: var(--text);
              border-color: rgba(57, 208, 255, 0.36);
              background: rgba(57, 208, 255, 0.12);
            }
            .save-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              flex-wrap: wrap;
              margin-top: 18px;
            }
            @media (max-width: 1180px) {
              .hero,
              .template-strip {
                grid-template-columns: 1fr;
              }
            }
          `
        }}
      />
      <div className="skills-page">
        <div className="skills-topbar">
          <div className="skills-topbar-links">
            <Link href="/">面板首页</Link>
            <Link href={`/teams/${teamId}/members`}>返回成员确认</Link>
          </div>
          <div>{team?.name ?? "未命名团队"}</div>
        </div>

        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow">Skill Assembly</div>
            <h1>让技能成为标准员工模板的一部分，再在团队里按需微调。</h1>
            <p>
              首页展示的是标准员工默认能力，这里展示的是当前团队内真正启用的技能集合。我们先保留
              yinova 的视觉层和配置感，但底层继续使用 OpenSwarm 当前的真实接口。
            </p>
            <div className="hero-actions">
              <button type="submit" form="team-skills-form" className="btn-primary">
                保存技能并进入工作台
              </button>
              <Link href={`/teams/${teamId}/workspace`} className="btn-secondary">
                暂时跳过
              </Link>
            </div>
          </div>

          <aside className="hero-side">
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">团队员工数</div>
                <div className="stat-value">{assignments.assignments.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">技能总数</div>
                <div className="stat-value">{skills.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">已分配技能</div>
                <div className="stat-value">{assignedCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">当前状态</div>
                <div className="stat-value">Ready</div>
              </div>
            </div>
            <div className="side-note">
              <h3>SkillHub 风格启发</h3>
              <p>
                这里先做团队技能编排页，把“技能库 + 员工分配 + 模板入口”聚在一页。后续再补默认模板、自动配置和真正的
                DeerFlow `allowed_skills`。
              </p>
            </div>
          </aside>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <h2>技能编排模板</h2>
              <p>先给一个视觉上的模板区，后面再把自动配置和默认方案接进来。</p>
            </div>
          </div>
          <div className="template-strip">
            <div className="template-card">
              <div className="template-card-title">基础分析模板</div>
              <div className="template-card-meta">适合研究、摘要、文件处理类员工的标准组合。</div>
              <div className="template-card-skills">
                <span className="mini-chip">Summarize</span>
                <span className="mini-chip">Filesystem</span>
              </div>
            </div>
            <div className="template-card">
              <div className="template-card-title">调研抓取模板</div>
              <div className="template-card-meta">适合爬虫、情报和外部案例研究场景。</div>
              <div className="template-card-skills">
                <span className="mini-chip">Agent Browser</span>
                <span className="mini-chip">Summarize</span>
              </div>
            </div>
            <div className="template-card">
              <div className="template-card-title">执行输出模板</div>
              <div className="template-card-meta">适合需要文件产出和项目落地的员工。</div>
              <div className="template-card-skills">
                <span className="mini-chip">Filesystem</span>
                <span className="mini-chip">Output</span>
              </div>
            </div>
            <div className="template-card">
              <div className="template-card-title">后续自动配置</div>
              <div className="template-card-meta">后面这里会接“标准员工模板 → 默认技能包”的自动装配。</div>
              <div className="template-card-skills">
                <span className="badge">coming soon</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-head">
            <div>
              <h2>本团队数字员工 · 勾选技能</h2>
              <p>保持 yinova 的技能勾选感，但底层走 OpenSwarm 当前的团队级技能分配接口。</p>
            </div>
          </div>

          <form id="team-skills-form" action={saveTeamSkillsAction}>
            <input type="hidden" name="teamId" value={teamId} />
            <div className="skills-agent-list">
              {assignments.assignments.map((assignment) => (
                <div key={assignment.employeeId} className="skills-agent-row">
                  <input type="hidden" name="employeeId" value={assignment.employeeId} />
                  <div className="skills-agent-name">{assignment.employeeName}</div>
                  <div className="skills-agent-note">为当前团队勾选该员工可用的 skills。</div>
                  <div className="skills-agent-options">
                    {skills.map((skill) => {
                      const checked = assignment.skillIds.includes(skill.id);

                      return (
                        <label
                          key={`${assignment.employeeId}-${skill.id}`}
                          className={`skills-chip${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            name={`skill:${assignment.employeeId}`}
                            value={skill.id}
                            defaultChecked={checked}
                          />
                          <span>{skill.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="save-row">
              <Link href={`/teams/${teamId}/workspace`} className="btn-secondary">
                跳过并进入工作台
              </Link>
              <button type="submit" className="btn-primary">
                保存技能并进入工作台
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
