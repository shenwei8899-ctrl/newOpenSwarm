import { Injectable } from "@nestjs/common";
import type {
  ModelProviderId,
  ModelProviderOption,
  ModelSettingsState,
  UpdateModelSettingsInput
} from "@openswarm/shared";
import * as fs from "node:fs";
import * as path from "node:path";

type ProviderConfig = {
  id: ModelProviderId;
  label: string;
  models: string[];
  keyEnv: string | null;
  keyLabel: string | null;
  keyHint: string | null;
  block: (model: string) => string;
};

const providers: ProviderConfig[] = [
  {
    id: "codex",
    label: "Codex CLI",
    models: ["gpt-5.4"],
    keyEnv: null,
    keyLabel: null,
    keyHint: "使用本机 Codex 登录态，不需要额外填写 API Key。",
    block: (model) => `
  - name: ${model}
    display_name: GPT-5.4 (Codex CLI)
    use: deerflow.models.openai_codex_provider:CodexChatModel
    model: ${model}
    supports_thinking: true
    supports_reasoning_effort: true
    supports_vision: true`.trimEnd()
  },
  {
    id: "openai",
    label: "OpenAI",
    models: ["gpt-4.1", "gpt-4o", "gpt-5"],
    keyEnv: "OPENAI_API_KEY",
    keyLabel: "OpenAI API Key（必填）",
    keyHint: "从 OpenAI 平台控制台获取，留空则不修改当前已保存的 Key。",
    block: (model) => `
  - name: ${model}
    display_name: ${model.toUpperCase()}
    use: langchain_openai:ChatOpenAI
    model: ${model}
    api_key: $OPENAI_API_KEY
    supports_vision: true`.trimEnd()
  },
  {
    id: "moonshot",
    label: "Moonshot Kimi",
    models: ["kimi-k2.5", "moonshot-v1-8k"],
    keyEnv: "MOONSHOT_API_KEY",
    keyLabel: "Moonshot Kimi API Key（必填）",
    keyHint: "从 Moonshot Kimi 控制台获取，留空则不修改当前已保存的 Key。",
    block: (model) => `
  - name: ${model}
    display_name: ${model === "kimi-k2.5" ? "Kimi K2.5" : model}
    use: deerflow.models.patched_deepseek:PatchedChatDeepSeek
    model: ${model}
    api_base: https://api.moonshot.cn/v1
    api_key: $MOONSHOT_API_KEY
    supports_thinking: true
    supports_vision: true
    when_thinking_enabled:
      extra_body:
        thinking:
          type: enabled`.trimEnd()
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyEnv: "DEEPSEEK_API_KEY",
    keyLabel: "DeepSeek API Key（必填）",
    keyHint: "从 DeepSeek 控制台获取，留空则不修改当前已保存的 Key。",
    block: (model) => `
  - name: ${model}
    display_name: ${model}
    use: deerflow.models.patched_deepseek:PatchedChatDeepSeek
    model: ${model}
    api_key: $DEEPSEEK_API_KEY
    supports_thinking: ${model === "deepseek-reasoner" ? "true" : "false"}
    supports_vision: false`.trimEnd()
  }
];

function resolveDeerflowRoot(start: string): string {
  const candidates = [start, path.resolve(start, ".."), path.resolve(start, "..", ".."), path.resolve(start, "..", "..", "..")];

  for (const candidate of candidates) {
    const configPath = path.join(candidate, "config.yaml");
    const backendPath = path.join(candidate, "backend");
    if (fs.existsSync(configPath) && fs.existsSync(backendPath)) {
      return candidate;
    }
  }

  throw new Error("未找到 DeerFlow 根目录，无法保存模型配置。");
}

function hasRealKey(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  return Boolean(trimmed && !trimmed.startsWith("your-"));
}

@Injectable()
export class SettingsService {
  private readonly deerflowRoot = resolveDeerflowRoot(process.cwd());
  private readonly configPath = path.join(this.deerflowRoot, "config.yaml");
  private readonly envPath = path.join(this.deerflowRoot, ".env");

  getModelSettings(): ModelSettingsState {
    const configContent = fs.readFileSync(this.configPath, "utf8");
    const envContent = fs.readFileSync(this.envPath, "utf8");
    const current = this.parseCurrentModel(configContent);
    const provider = providers.find((item) => item.id === current.provider) ?? providers[0];

    return {
      provider: provider.id,
      model: current.model,
      hasApiKey: provider.keyEnv ? hasRealKey(this.readEnvValue(envContent, provider.keyEnv)) : false,
      keyLabel: provider.keyLabel,
      keyHint: provider.keyHint,
      options: providers.map<ModelProviderOption>((item) => ({
        id: item.id,
        label: item.label,
        models: item.models,
        keyLabel: item.keyLabel,
        keyHint: item.keyHint
      }))
    };
  }

  updateModelSettings(input: UpdateModelSettingsInput): ModelSettingsState {
    const provider = providers.find((item) => item.id === input.provider);

    if (!provider) {
      throw new Error("不支持的模型提供商。");
    }

    if (!provider.models.includes(input.model)) {
      throw new Error("当前模型不在该提供商的可选列表中。");
    }

    const configContent = fs.readFileSync(this.configPath, "utf8");
    fs.writeFileSync(this.configPath, this.replaceModelsBlock(configContent, provider.block(input.model)), "utf8");

    if (provider.keyEnv && input.apiKey && input.apiKey.trim()) {
      const envContent = fs.readFileSync(this.envPath, "utf8");
      fs.writeFileSync(this.envPath, this.upsertEnvValue(envContent, provider.keyEnv, input.apiKey.trim()), "utf8");
    }

    return this.getModelSettings();
  }

  private parseCurrentModel(configContent: string): { provider: ModelProviderId; model: string } {
    const modelsMatch = configContent.match(
      /models:\n([\s\S]*?)\n# ============================================================================\n# Tool Groups Configuration/
    );
    const firstBlock = modelsMatch?.[1] ?? "";
    const useValue = firstBlock.match(/use:\s+([^\n]+)/)?.[1]?.trim() ?? "";
    const modelValue = firstBlock.match(/model:\s+([^\n]+)/)?.[1]?.trim() ?? "gpt-5.4";

    if (useValue.includes("openai_codex_provider:CodexChatModel")) {
      return { provider: "codex", model: modelValue };
    }

    if (useValue.includes("patched_deepseek:PatchedChatDeepSeek")) {
      if (firstBlock.includes("api_base: https://api.moonshot.cn/v1")) {
        return { provider: "moonshot", model: modelValue };
      }
      return { provider: "deepseek", model: modelValue };
    }

    return { provider: "openai", model: modelValue };
  }

  private replaceModelsBlock(configContent: string, modelBlock: string): string {
    const nextSection = "\n# ============================================================================\n# Tool Groups Configuration";
    const modelsStart = configContent.indexOf("models:\n");
    const nextSectionStart = configContent.indexOf(nextSection);

    if (modelsStart === -1 || nextSectionStart === -1 || nextSectionStart <= modelsStart) {
      throw new Error("无法定位 DeerFlow 配置中的 models 段。");
    }

    return `${configContent.slice(0, modelsStart)}models:\n${modelBlock}\n${configContent.slice(nextSectionStart)}`;
  }

  private readEnvValue(envContent: string, key: string): string | undefined {
    return envContent.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1];
  }

  private upsertEnvValue(envContent: string, key: string, value: string): string {
    const pattern = new RegExp(`^#?\\s*${key}=.*$`, "m");

    if (pattern.test(envContent)) {
      return envContent.replace(pattern, `${key}=${value}`);
    }

    const normalized = envContent.endsWith("\n") ? envContent : `${envContent}\n`;
    return `${normalized}${key}=${value}\n`;
  }
}
