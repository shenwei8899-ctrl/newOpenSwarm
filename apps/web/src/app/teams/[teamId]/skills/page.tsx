import Link from "next/link";
import { getProjectSkillAssignments, getSkills } from "@/lib/api";
import { saveTeamSkillsAction } from "./actions";

type TeamSkillsPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamSkillsPage({ params }: TeamSkillsPageProps) {
  const { teamId } = await params;
  const [skills, assignments] = await Promise.all([
    getSkills(),
    getProjectSkillAssignments(teamId)
  ]);

  return (
    <main className="skills-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .skills-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: #e9f3ff;
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
              padding: 18px 18px 28px;
              box-sizing: border-box;
            }
            .skills-page {
              width: min(1680px, calc(100vw - 32px));
              margin: 0 auto;
            }
            .skills-panel {
              border-radius: 22px;
              border: 1px solid rgba(57, 208, 255, 0.2);
              background: rgba(9, 18, 35, 0.94);
              box-shadow: 0 26px 60px rgba(0, 0, 0, 0.28);
              padding: 18px 20px 20px;
            }
            .skills-heading {
              margin: 0;
              font-size: 1.12rem;
              font-weight: 800;
              color: #eef8ff;
            }
            .skills-copy {
              margin: 6px 0 0;
              color: #8ea5c4;
              font-size: 0.82rem;
              line-height: 1.5;
            }
            .skills-form {
              margin-top: 16px;
              display: grid;
              gap: 14px;
            }
            .skills-agent-list {
              display: grid;
              gap: 14px;
            }
            .skills-agent-row {
              border-radius: 18px;
              border: 1px solid rgba(57, 208, 255, 0.16);
              background: linear-gradient(180deg, rgba(8, 18, 34, 0.88), rgba(5, 12, 22, 0.92));
              padding: 16px;
            }
            .skills-agent-name {
              color: #eef8ff;
              font-size: 0.98rem;
              font-weight: 800;
              margin-bottom: 8px;
            }
            .skills-agent-note {
              color: #8ea5c4;
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
              min-height: 34px;
              padding: 0 14px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.22);
              background: rgba(9, 22, 40, 0.72);
              color: #a8bdd6;
              font-size: 0.78rem;
              cursor: pointer;
              user-select: none;
            }
            .skills-chip input {
              margin: 0;
              accent-color: #2f9cff;
            }
            .skills-chip.is-checked {
              color: #eef8ff;
              border-color: rgba(57, 208, 255, 0.38);
              background: rgba(57, 208, 255, 0.12);
            }
            .save-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              margin-top: 4px;
            }
            .btn-primary,
            .btn-secondary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 164px;
              height: 42px;
              padding: 0 18px;
              border-radius: 999px;
              border: 1px solid transparent;
              text-decoration: none;
              font-size: 0.84rem;
              font-weight: 700;
              font-family: inherit;
              cursor: pointer;
            }
            .btn-primary {
              color: #04121d;
              background: linear-gradient(180deg, #4ad8ff, #2fc7f5);
            }
            .btn-secondary {
              color: #39d0ff;
              background: rgba(9, 22, 40, 0.72);
              border-color: rgba(57, 208, 255, 0.28);
            }
            @media (max-width: 780px) {
              .skills-shell {
                padding: 12px 10px 20px;
              }
              .skills-page {
                width: calc(100vw - 20px);
              }
              .skills-panel {
                padding: 14px;
              }
              .save-row {
                display: grid;
                grid-template-columns: 1fr;
              }
              .btn-primary,
              .btn-secondary {
                width: 100%;
              }
            }
          `
        }}
      />

      <div className="skills-page">
        <section className="skills-panel">
          <h1 className="skills-heading">本团队数字员工 · 勾选技能</h1>
          <p className="skills-copy">
            保持 yinova 的技能勾选感，但底层走 OpenSwarm 当前的团队级技能分配接口。
          </p>

          <form id="team-skills-form" action={saveTeamSkillsAction} className="skills-form">
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
