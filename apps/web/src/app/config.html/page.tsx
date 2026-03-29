import Link from "next/link";
import { getModelSettings } from "@/lib/api";
import { ConfigForm } from "./config-form";

export default async function ConfigPage() {
  const settings = await getModelSettings();

  return (
    <main className="config-page-shell">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .config-page-shell {
              min-height: 100vh;
              background:
                radial-gradient(circle at 18% 0%, rgba(17, 33, 61, 0.96), transparent 34%),
                radial-gradient(circle at 84% 12%, rgba(22, 89, 126, 0.32), transparent 26%),
                radial-gradient(circle, rgba(74, 144, 226, 0.36) 1.3px, transparent 1.4px) 0 0 / 22px 22px,
                linear-gradient(180deg, #07101f 0%, #040912 44%, #02050b 100%);
              color: #e9f3ff;
              font-family: "Space Grotesk", "Noto Sans SC", "PingFang SC", sans-serif;
              padding: 22px 18px 28px;
              box-sizing: border-box;
            }
            .config-page {
              width: min(1220px, calc(100vw - 36px));
              margin: 0 auto;
              display: grid;
              gap: 16px;
            }
            .config-topbar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              color: #8ea5c4;
              font-size: 0.82rem;
              flex-wrap: wrap;
            }
            .config-topbar a {
              color: #39d0ff;
              text-decoration: none;
            }
            .config-panel {
              border-radius: 22px;
              border: 1px solid rgba(57, 208, 255, 0.2);
              background: rgba(9, 18, 35, 0.94);
              box-shadow: 0 26px 60px rgba(0, 0, 0, 0.28);
              padding: 20px;
            }
            .config-page-title {
              margin: 0;
              color: #39d0ff;
              font-size: 1.4rem;
              letter-spacing: 0.08em;
            }
            .config-page-copy {
              margin: 8px 0 0;
              color: #8ea5c4;
              font-size: 0.84rem;
              line-height: 1.6;
            }
            .config-form {
              margin-top: 16px;
              display: grid;
              gap: 16px;
            }
            .config-card {
              border: 1px solid rgba(57, 208, 255, 0.18);
              border-radius: 18px;
              background: rgba(8, 18, 34, 0.76);
              padding: 18px;
              display: grid;
              gap: 14px;
            }
            .config-card-head {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            }
            .config-title {
              margin: 0;
              color: #eef8ff;
              font-size: 1.02rem;
              font-weight: 800;
            }
            .config-kicker {
              display: inline-flex;
              align-items: center;
              min-height: 28px;
              padding: 0 10px;
              border-radius: 999px;
              border: 1px solid rgba(57, 208, 255, 0.2);
              background: rgba(57, 208, 255, 0.08);
              color: #39d0ff;
              font-size: 0.72rem;
              letter-spacing: 0.14em;
            }
            .config-field {
              display: grid;
              gap: 6px;
            }
            .config-label {
              color: #39d0ff;
              font-size: 0.82rem;
              letter-spacing: 0.04em;
            }
            .config-select,
            .config-input {
              width: 100%;
              min-height: 42px;
              padding: 0 12px;
              border-radius: 6px;
              border: 1px solid rgba(57, 208, 255, 0.28);
              background: rgba(0, 0, 0, 0.28);
              color: #eef8ff;
              font-size: 0.9rem;
              font-family: inherit;
              box-sizing: border-box;
            }
            .config-select:focus,
            .config-input:focus {
              outline: none;
              border-color: rgba(57, 208, 255, 0.5);
              box-shadow: 0 0 0 3px rgba(57, 208, 255, 0.08);
            }
            .config-hint,
            .config-status {
              color: #8ea5c4;
              font-size: 0.74rem;
              line-height: 1.55;
            }
            .config-actions {
              display: flex;
              justify-content: flex-end;
            }
            @media (max-width: 780px) {
              .config-page-shell {
                padding: 14px 10px 20px;
              }
              .config-page {
                width: calc(100vw - 20px);
              }
              .config-panel {
                padding: 14px;
              }
              .config-actions {
                justify-content: stretch;
              }
              .config-actions button {
                width: 100%;
              }
            }
          `
        }}
      />

      <div className="config-page">
        <header className="config-topbar">
          <Link href="/">返回首页</Link>
          <span>MODEL CONFIG / 模型配置</span>
        </header>

        <section className="config-panel">
          <h1 className="config-page-title">模型配置</h1>
          <p className="config-page-copy">
            这里配置 OpenSwarm 当前调用 DeerFlow 时使用的主模型。保存后会同步写入 DeerFlow 的
            config.yaml 和 .env，空白 key 不会覆盖原有值。
          </p>
          <ConfigForm settings={settings} />
        </section>
      </div>
    </main>
  );
}
