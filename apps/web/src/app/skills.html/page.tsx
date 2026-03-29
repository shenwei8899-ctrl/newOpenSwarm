import Link from "next/link";
import { getSkills } from "@/lib/api";

export default async function SkillsLibraryPage() {
  const skills = await getSkills();

  return (
    <main className="skills-library-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .skills-library-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                radial-gradient(circle, rgba(74, 144, 226, 0.36) 1.3px, transparent 1.4px) 0 0 / 22px 22px,
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: #e9f3ff;
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
              padding: 16px 18px 26px;
              box-sizing: border-box;
            }
            .skills-library-page {
              width: min(1680px, calc(100vw - 36px));
              margin: 0 auto;
              display: grid;
              gap: 18px;
            }
            .skills-library-topbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              font-size: 0.82rem;
              color: #8ea5c4;
            }
            .skills-library-topbar a {
              color: #39d0ff;
              text-decoration: none;
            }
            .skills-library-panel {
              border-radius: 22px;
              border: 1px solid rgba(57, 208, 255, 0.2);
              background: rgba(9, 18, 35, 0.94);
              box-shadow: 0 26px 60px rgba(0, 0, 0, 0.28);
              padding: 18px 20px 20px;
            }
            .skills-library-title {
              margin: 0;
              color: #39d0ff;
              font-size: 1.5rem;
              letter-spacing: 0.06em;
            }
            .skills-library-copy {
              margin: 8px 0 0;
              color: #8ea5c4;
              font-size: 0.84rem;
              line-height: 1.55;
            }
            .skills-library-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
              gap: 14px;
              margin-top: 18px;
            }
            .skill-card {
              border-radius: 18px;
              border: 1px solid rgba(57, 208, 255, 0.16);
              background: linear-gradient(180deg, rgba(8, 18, 34, 0.88), rgba(5, 12, 22, 0.92));
              padding: 16px;
              display: grid;
              gap: 10px;
            }
            .skill-card-head {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 10px;
            }
            .skill-card-title {
              color: #eef8ff;
              font-size: 1rem;
              font-weight: 800;
            }
            .skill-card-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-height: 28px;
              padding: 0 10px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.22);
              background: rgba(9, 22, 40, 0.72);
              color: #8fdcff;
              font-size: 0.72rem;
              white-space: nowrap;
            }
            .skill-card-desc {
              color: #8ea5c4;
              font-size: 0.82rem;
              line-height: 1.6;
              min-height: 52px;
            }
            .skill-card-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .skill-card-pill {
              display: inline-flex;
              align-items: center;
              min-height: 30px;
              padding: 0 10px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.16);
              background: rgba(9, 22, 40, 0.72);
              color: #b4cade;
              font-size: 0.74rem;
            }
            @media (max-width: 780px) {
              .skills-library-shell {
                padding: 12px 10px 20px;
              }
              .skills-library-page {
                width: calc(100vw - 20px);
              }
              .skills-library-grid {
                grid-template-columns: 1fr;
              }
            }
          `
        }}
      />

      <div className="skills-library-page">
        <header className="skills-library-topbar">
          <Link href="/">返回首页</Link>
          <span>SKILL LIBRARY / 技能库</span>
        </header>

        <section className="skills-library-panel">
          <h1 className="skills-library-title">技能库</h1>
          <p className="skills-library-copy">
            这里展示 OpenSwarm 当前可用的标准技能目录。团队创建完成后，可以把这些技能分配给不同数字员工。
          </p>

          <div className="skills-library-grid">
            {skills.map((skill) => (
              <article key={skill.id} className="skill-card">
                <div className="skill-card-head">
                  <div className="skill-card-title">{skill.name}</div>
                  <span className="skill-card-badge">
                    {skill.enabled ? "已启用" : "未启用"}
                  </span>
                </div>
                <div className="skill-card-desc">{skill.description}</div>
                <div className="skill-card-meta">
                  <span className="skill-card-pill">分类 · {skill.category}</span>
                  <span className="skill-card-pill">来源 · {skill.source}</span>
                  <span className="skill-card-pill">ID · {skill.id}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
