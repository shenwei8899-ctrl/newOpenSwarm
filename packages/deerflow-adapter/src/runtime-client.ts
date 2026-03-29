import { Client as LangGraphClient } from "@langchain/langgraph-sdk";
import { createHash, randomUUID } from "node:crypto";

import type {
  DeerFlowAgentRunInput,
  DeerFlowAgentRunResult,
  DeerFlowArtifact,
  DeerFlowRuntimeConfig
} from "./types";

type GatewaySkillResponse = {
  name: string;
  description: string;
  enabled: boolean;
};

type GatewaySkillsListResponse = {
  skills: GatewaySkillResponse[];
};

type GatewayAgentResponse = {
  name: string;
  description?: string;
  model?: string | null;
  tool_groups?: string[] | null;
  allowed_skills?: string[] | null;
  soul?: string | null;
};

export class DeerFlowRuntimeClient {
  constructor(private readonly config: DeerFlowRuntimeConfig) {}

  getConfig(): DeerFlowRuntimeConfig {
    return this.config;
  }

  async listSkills(): Promise<Array<{ id: string; name: string }>> {
    const response = await fetch(`${this.config.gatewayBaseUrl}/api/skills`);
    if (!response.ok) {
      throw new Error(`Failed to list DeerFlow skills: ${response.status}`);
    }

    const data = (await response.json()) as GatewaySkillsListResponse;
    return data.skills.map((skill) => ({
      id: skill.name,
      name: skill.name
    }));
  }

  async createOrUpdateAgent(input: {
    agentName: string;
    description?: string;
    allowedSkills?: string[];
    modelName?: string | null;
  }): Promise<typeof input> {
    const normalizedAgentName = normalizeAgentName(input.agentName);
    const body = {
      description: input.description ?? "",
      model: input.modelName ?? undefined,
      allowed_skills: input.allowedSkills ?? undefined,
      soul: buildSoul({
        agentName: normalizedAgentName,
        description: input.description,
        allowedSkills: input.allowedSkills
      })
    };

    const existing = await fetch(
      `${this.config.gatewayBaseUrl}/api/agents/${encodeURIComponent(normalizedAgentName)}`
    );

    if (existing.status === 404) {
      const createResponse = await fetch(`${this.config.gatewayBaseUrl}/api/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: normalizedAgentName,
          ...body
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create DeerFlow agent ${normalizedAgentName}: ${createResponse.status}`);
      }

      return input;
    }

    if (!existing.ok) {
      throw new Error(`Failed to read DeerFlow agent ${normalizedAgentName}: ${existing.status}`);
    }

    const updateResponse = await fetch(
      `${this.config.gatewayBaseUrl}/api/agents/${encodeURIComponent(normalizedAgentName)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update DeerFlow agent ${normalizedAgentName}: ${updateResponse.status}`);
    }

    return input;
  }

  async runAgent(input: DeerFlowAgentRunInput): Promise<DeerFlowAgentRunResult> {
    const client = new LangGraphClient({
      apiUrl: this.config.langgraphBaseUrl,
      apiKey: null
    });
    const normalizedAgentName = normalizeAgentName(input.agentName);
    const threadId = ensureUuidThreadId(
      input.threadId ?? `thread-${normalizedAgentName}-${Date.now()}`
    );

    await client.threads.create({
      threadId,
      ifExists: "do_nothing",
      metadata: input.metadata
    });

    const result = (await client.runs.wait(
      threadId,
      this.config.assistantId ?? "lead_agent",
      {
        input: {
          messages: [
            {
              role: "human",
              content: input.message
            }
          ]
        },
        context: {
          ...(input.metadata ?? {}),
          agent_name: normalizedAgentName
        }
      }
    )) as Record<string, unknown>;

    return {
      threadId,
      status: "completed",
      outputText: extractResponseText(result),
      artifacts: extractArtifacts(result, threadId)
    };
  }

  async listArtifacts(threadId: string): Promise<DeerFlowArtifact[]> {
    const client = new LangGraphClient({
      apiUrl: this.config.langgraphBaseUrl,
      apiKey: null
    });
    const state = (await client.threads.getState(threadId)) as {
      values?: Record<string, unknown>;
    };
    return extractArtifacts(state.values ?? {}, threadId);
  }
}

function ensureUuidThreadId(seed: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(seed)) {
    return seed;
  }

  if (!seed) {
    return randomUUID();
  }

  const hex = createHash("sha1").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16] ?? "8", 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`;
}

function normalizeAgentName(name: string): string {
  return name.trim().toLowerCase().replace(/_/g, "-");
}

function buildSoul(input: {
  agentName: string;
  description?: string;
  allowedSkills?: string[];
}): string {
  const lines = [
    `# ${input.agentName}`,
    "",
    "你是 OpenSwarm 项目中的数字员工。",
    input.description ? `你的职责：${input.description}` : "你的职责：围绕项目目标给出专业、稳健、可执行的回应。",
    "请保持角色一致，先理解需求，再给出清晰建议。"
  ];

  if (input.allowedSkills && input.allowedSkills.length > 0) {
    lines.push("", `优先使用这些技能相关的能力：${input.allowedSkills.join("、")}。`);
  }

  return lines.join("\n");
}

function extractResponseText(result: Record<string, unknown>): string {
  const messages = Array.isArray(result.messages) ? result.messages : [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!isRecord(message)) {
      continue;
    }

    if (message.type === "human") {
      break;
    }

    if (message.type === "tool" && message.name === "ask_clarification" && typeof message.content === "string") {
      return message.content;
    }

    if (message.type === "ai") {
      const content = extractTextContent(message.content);
      if (content) {
        return content;
      }
    }
  }

  return "";
}

function extractArtifacts(result: Record<string, unknown>, threadId: string): DeerFlowArtifact[] {
  const messages = Array.isArray(result.messages) ? result.messages : [];
  const virtualPaths: string[] = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!isRecord(message)) {
      continue;
    }

    if (message.type === "human") {
      break;
    }

    if (message.type === "ai" && Array.isArray(message.tool_calls)) {
      for (const toolCall of message.tool_calls) {
        if (!isRecord(toolCall) || toolCall.name !== "present_files" || !isRecord(toolCall.args)) {
          continue;
        }

        const filepaths = toolCall.args.filepaths;
        if (Array.isArray(filepaths)) {
          for (const filepath of filepaths) {
            if (typeof filepath === "string") {
              virtualPaths.push(filepath);
            }
          }
        }
      }
    }
  }

  return virtualPaths.map((virtualPath) => ({
    threadId,
    virtualPath,
    filename: virtualPath.split("/").filter(Boolean).at(-1) ?? virtualPath
  }));
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const parts: string[] = [];
  for (const block of content) {
    if (typeof block === "string") {
      parts.push(block);
      continue;
    }

    if (isRecord(block) && typeof block.text === "string") {
      parts.push(block.text);
    }
  }

  return parts.join("");
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}
