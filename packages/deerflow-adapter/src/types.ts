export type DeerFlowRuntimeConfig = {
  gatewayBaseUrl: string;
  langgraphBaseUrl: string;
  assistantId?: string;
};

export type DeerFlowAgentRunInput = {
  agentName: string;
  threadId?: string;
  message: string;
  metadata?: Record<string, string>;
  modelName?: string | null;
};

export type DeerFlowAgentRunResult = {
  threadId: string;
  status: "queued" | "running" | "completed" | "failed";
  outputText: string;
  artifacts: DeerFlowArtifact[];
};

export type DeerFlowArtifact = {
  threadId: string;
  virtualPath: string;
  filename: string;
};
