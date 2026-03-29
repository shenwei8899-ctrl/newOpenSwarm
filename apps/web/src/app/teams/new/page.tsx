import Link from "next/link";
import { getEmployeeCatalog, getProjects } from "@/lib/api";
import { TeamSetupForm } from "./team-setup-form";

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
  const [employees, projects] = await Promise.all([getEmployeeCatalog(), getProjects()]);
  const params = await searchParams;
  const preselectedIds = new Set(normalizeSelectedIds(params.employeeIds));

  return (
    <main className="team-setup-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .team-setup-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 20% 0%, #121d35 0%, #060a14 50%, #02040a 100%);
              color: #e9f3ff;
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
              padding: 10px 14px 12px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .team-setup-page {
              width: min(1920px, calc(100vw - 32px));
              margin: 0 auto;
              height: calc(100vh - 22px);
              display: grid;
              grid-template-rows: auto 1fr;
              gap: 8px;
            }
            .team-setup-back {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #4dd0ff;
              text-decoration: none;
              font-size: 0.82rem;
              margin: 0 0 0 6px;
            }
            .team-panel {
              border-radius: 18px;
              border: 1px solid rgba(77, 208, 255, 0.26);
              background:
                radial-gradient(circle at 50% 0%, rgba(35, 71, 112, 0.18), transparent 40%),
                rgba(9, 18, 35, 0.95);
              box-shadow: 0 26px 60px rgba(0, 0, 0, 0.34);
              padding: 18px 24px 18px;
              min-height: 0;
              overflow: hidden;
              display: grid;
              align-content: start;
            }
            .team-panel h1 {
              margin: 0;
              font-size: clamp(1.14rem, 1.6vw, 1.52rem);
              letter-spacing: 0.04em;
              color: #39d0ff;
            }
            .team-panel p {
              margin: 8px 0 0;
              max-width: 1100px;
              color: #93a8c7;
              font-size: 0.68rem;
              line-height: 1.45;
            }
            .team-form {
              display: grid;
              gap: 10px;
              margin-top: 12px;
              min-height: 0;
              height: 100%;
              grid-template-rows: auto auto auto minmax(0, 1fr) auto;
            }
            .team-form-select {
              height: auto;
              grid-template-rows: auto auto auto;
              align-content: start;
            }
            .team-form > div {
              min-height: 0;
            }
            .team-name-block {
              min-height: auto !important;
            }
            .team-employee-section {
              min-height: 0;
              display: grid;
              grid-template-rows: auto minmax(0, 1fr);
              gap: 8px;
            }
            .mode-row {
              display: inline-flex;
              gap: 18px;
              flex-wrap: wrap;
              align-items: center;
              justify-content: flex-start;
            }
            .mode-option {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #cddcf3;
              font-size: 0.8rem;
              font-weight: 700;
              width: fit-content;
              white-space: nowrap;
            }
            .mode-option input {
              width: 16px;
              height: 16px;
              accent-color: #3ad0ff;
            }
            .section-divider {
              height: 1px;
              background: rgba(77, 208, 255, 0.24);
            }
            .section-title {
              color: #39d0ff;
              font-size: 0.88rem;
              font-weight: 800;
              margin-bottom: 8px;
            }
            .field-label {
              display: block;
              margin-bottom: 6px;
              color: #39d0ff;
              font-size: 0.76rem;
              font-weight: 800;
            }
            .field-input,
            .field-select {
              width: 100%;
              min-height: 52px;
              padding: 0 14px;
              border-radius: 12px;
              border: 1px solid rgba(77, 208, 255, 0.28);
              background: rgba(12, 22, 40, 0.92);
              color: #eff7ff;
              font-size: 0.96rem;
              outline: none;
              box-shadow: inset 0 0 0 1px rgba(77, 208, 255, 0.04);
            }
            .field-select {
              min-height: 50px;
              font-size: 0.92rem;
            }
            .choose-copy {
              color: #39d0ff;
              font-size: 0.8rem;
              font-weight: 800;
            }
            .employee-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
              gap: 10px;
              height: 100%;
              min-height: 0;
              overflow-y: auto;
              overflow-x: hidden;
              padding: 4px 4px 0 0;
              scrollbar-width: thin;
              scrollbar-color: rgba(77, 208, 255, 0.55) rgba(5, 12, 24, 0.72);
              align-content: start;
            }
            .employee-grid::-webkit-scrollbar {
              width: 10px;
            }
            .employee-grid::-webkit-scrollbar-track {
              background: rgba(5, 12, 24, 0.72);
              border-radius: 999px;
            }
            .employee-grid::-webkit-scrollbar-thumb {
              background: rgba(77, 208, 255, 0.45);
              border-radius: 999px;
            }
            .employee-card {
              display: block;
              position: relative;
              cursor: pointer;
            }
            .employee-card input {
              position: absolute;
              opacity: 0;
              inset: 0;
              pointer-events: none;
            }
            .employee-card-box {
              min-height: 74px;
              border-radius: 14px;
              border: 1px solid rgba(77, 208, 255, 0.28);
              background: linear-gradient(180deg, rgba(8, 20, 37, 0.92), rgba(7, 18, 32, 0.96));
              box-shadow: inset 0 0 0 1px rgba(77, 208, 255, 0.05);
              padding: 10px 8px;
              display: grid;
              justify-items: center;
              align-content: center;
              gap: 4px;
              text-align: center;
              transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
            }
            .employee-card:hover .employee-card-box {
              transform: translateY(-2px);
              border-color: rgba(77, 208, 255, 0.55);
            }
            .employee-card:has(input:checked) .employee-card-box {
              border-color: rgba(77, 208, 255, 0.82);
              box-shadow: 0 0 0 1px rgba(77, 208, 255, 0.14), 0 10px 22px rgba(17, 75, 111, 0.28);
              background: linear-gradient(180deg, rgba(9, 26, 46, 0.96), rgba(8, 20, 36, 0.98));
            }
            .employee-avatar {
              width: 32px;
              height: 32px;
              border-radius: 10px;
              border: 1px solid rgba(77, 208, 255, 0.32);
              background: rgba(255,255,255,0.03);
              padding: 2px;
              object-fit: cover;
            }
            .employee-name {
              color: #dff5ff;
              font-size: 0.68rem;
              font-weight: 700;
              line-height: 1.2;
            }
            .employee-role {
              color: #86b7cc;
              font-size: 0.58rem;
            }
            .submit-row {
              display: flex;
              justify-content: flex-end;
              margin-top: 0;
              padding-top: 2px;
              min-height: auto !important;
            }
            .submit-button {
              min-width: 92px;
              height: 48px;
              padding: 0 18px;
              border: 0;
              border-radius: 10px;
              background: linear-gradient(180deg, #4dd0ff, #35c5fb);
              color: #03131f;
              font-size: 1rem;
              font-weight: 800;
              cursor: pointer;
              box-shadow: 0 12px 24px rgba(38, 164, 213, 0.22);
            }
            .select-team-block {
              display: grid;
              gap: 14px;
            }
            @media (max-width: 1100px) {
              .team-panel {
                padding: 16px 18px 16px;
              }
              .employee-grid {
                grid-template-columns: repeat(auto-fit, minmax(108px, 1fr));
                gap: 10px;
              }
            }
            @media (max-width: 780px) {
              .team-setup-shell {
                padding: 8px 8px 10px;
                overflow: auto;
              }
              .team-setup-page {
                width: calc(100vw - 20px);
                height: auto;
                display: block;
              }
              .team-panel {
                padding: 18px 14px 20px;
                overflow: visible;
                display: block;
              }
              .team-form {
                height: auto;
                display: grid;
                grid-template-rows: none;
              }
              .team-employee-section {
                display: block;
              }
              .mode-row {
                gap: 12px;
              }
              .field-input,
              .field-select {
                min-height: 48px;
                font-size: 0.92rem;
              }
              .employee-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
                height: auto;
              }
              .submit-button {
                width: 100%;
                min-width: 0;
                height: 44px;
                font-size: 0.96rem;
              }
            }
            @media (max-width: 520px) {
              .employee-grid {
                grid-template-columns: 1fr 1fr;
              }
              .team-panel h1 {
                line-height: 1.1;
              }
            }
          `
        }}
      />
      <div className="team-setup-page">
        <Link href="/" className="team-setup-back">
          ← 返回员工库首页
        </Link>

        <section className="team-panel">
          <h1>创建 or 选择团队</h1>
          <p>
            创建新团队并选择成员，或选择已有团队，然后进行技能编排。技能来源：ClawHub。
          </p>
          <TeamSetupForm
            employees={employees}
            projects={projects}
            preselectedEmployeeIds={[...preselectedIds]}
          />
        </section>
      </div>
    </main>
  );
}
