"use client";

import * as React from "react";
import type { ModelSettingsState } from "@openswarm/shared";
import { FormFeedback, FormSubmitButton } from "@/components/form-status";
import { idleFormActionState } from "@/lib/action-state";
import { saveModelSettingsAction } from "./actions";

export function ConfigForm({ settings }: { settings: ModelSettingsState }) {
  const [provider, setProvider] = React.useState(settings.provider);
  const providerOption =
    settings.options.find((option) => option.id === provider) ?? settings.options[0];
  const [selectedModel, setSelectedModel] = React.useState(settings.model);
  const [state, action] = React.useActionState(saveModelSettingsAction, idleFormActionState);

  React.useEffect(() => {
    const nextDefault =
      provider === settings.provider && providerOption.models.includes(settings.model)
        ? settings.model
        : providerOption.models[0];
    setSelectedModel(nextDefault);
  }, [provider, providerOption.models, settings.model, settings.provider]);

  return (
    <form action={action} className="config-form">
      <div className="config-card">
        <div className="config-card-head">
          <h2 className="config-title">模型配置</h2>
          <span className="config-kicker">MODEL</span>
        </div>

        <label className="config-field">
          <span className="config-label">模型提供商</span>
          <select
            name="provider"
            className="config-select"
            value={provider}
            onChange={(event) => setProvider(event.target.value as ModelSettingsState["provider"])}
          >
            {settings.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="config-field">
          <span className="config-label">主模型</span>
          <select
            name="model"
            className="config-select"
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
          >
            {providerOption.models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>

        {providerOption.keyLabel ? (
          <label className="config-field">
            <span className="config-label">{providerOption.keyLabel}</span>
            <input
              type="password"
              name="apiKey"
              className="config-input"
              placeholder={settings.hasApiKey ? "已配置（留空则不修改）" : "请输入 API Key"}
              autoComplete="off"
            />
            <span className="config-hint">{providerOption.keyHint}</span>
          </label>
        ) : (
          <div className="config-field">
            <span className="config-label">认证方式</span>
            <div className="config-status">
              {providerOption.keyHint ?? "当前模式不需要 API Key。"}
            </div>
          </div>
        )}

        <FormFeedback state={state} />
      </div>

      <div className="config-actions">
        <FormSubmitButton
          idleLabel="保存模型配置"
          pendingLabel="保存中..."
          style={{
            minWidth: 178,
            height: 42,
            padding: "0 18px",
            borderRadius: 8,
            border: "1px solid #16a5d4",
            background: "#39d0ff",
            color: "#05070c",
            fontWeight: 800,
            letterSpacing: "0.08em"
          }}
        />
      </div>
    </form>
  );
}
