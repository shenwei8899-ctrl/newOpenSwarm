import type {
  AutonomyRunDetail,
  AutonomyRunSummary,
  ArtifactSummary,
  CreateProjectInput,
  DiscussionMessageItem,
  DiscussionSessionSummary,
  EmployeeCatalogItem,
  ModelSettingsState,
  ProjectDetail,
  ProjectEmployeeItem,
  ProjectSkillAssignmentsResponse,
  ProjectSummary,
  SkillCatalogItem
  ,
  TaskSummary
} from "@openswarm/shared";
import { standardEmployeeTemplates } from "@openswarm/shared";
import {
  demoArtifacts,
  demoDiscussionMessages,
  demoDiscussions,
  demoAssignments,
  demoEmployees,
  demoProjects,
  demoSkills,
  demoTasks
} from "./demo-data";

const apiBaseUrl =
  process.env.OPENSWARM_API_BASE_URL ?? "http://127.0.0.1:3001/api";

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getProjects(): Promise<ProjectSummary[]> {
  return (await apiFetch<ProjectSummary[]>("/projects")) ?? demoProjects;
}

export async function getProject(projectId: string): Promise<ProjectDetail | null> {
  return (await apiFetch<ProjectDetail>(`/projects/${projectId}`)) ?? null;
}

export async function getEmployeeCatalog(): Promise<EmployeeCatalogItem[]> {
  const liveEmployees = await apiFetch<EmployeeCatalogItem[]>("/employees/catalog");

  if (liveEmployees && liveEmployees.length > 0) {
    const liveByName = new Map(liveEmployees.map((employee) => [employee.name, employee]));

    return standardEmployeeTemplates.map((template) => {
      const live = liveByName.get(template.name);

      return live ?? {
        id: template.id,
        name: template.name,
        role: template.role,
        description: template.description,
        defaultModel: template.defaultModel
      };
    });
  }

  return demoEmployees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.role,
    description: employee.description,
    defaultModel: employee.defaultModel
  }));
}

export async function getProjectEmployees(
  projectId: string
): Promise<ProjectEmployeeItem[]> {
  return (
    (await apiFetch<ProjectEmployeeItem[]>(`/projects/${projectId}/employees`)) ??
    demoEmployees
  );
}

export async function getSkills(): Promise<SkillCatalogItem[]> {
  return (await apiFetch<SkillCatalogItem[]>("/skills")) ?? demoSkills;
}

export async function getProjectSkillAssignments(
  projectId: string
): Promise<ProjectSkillAssignmentsResponse> {
  return (
    (await apiFetch<ProjectSkillAssignmentsResponse>(
      `/projects/${projectId}/skill-assignments`
    )) ?? demoAssignments
  );
}

export async function getProjectDiscussions(
  projectId: string
): Promise<DiscussionSessionSummary[]> {
  return (
    (await apiFetch<DiscussionSessionSummary[]>(`/projects/${projectId}/discussions`)) ??
    demoDiscussions
  );
}

export async function getDiscussionMessages(
  discussionId: string
): Promise<DiscussionMessageItem[]> {
  return (
    (await apiFetch<DiscussionMessageItem[]>(`/discussions/${discussionId}/messages`)) ??
    demoDiscussionMessages
  );
}

export async function getProjectTasks(projectId: string): Promise<TaskSummary[]> {
  return (
    (await apiFetch<TaskSummary[]>(`/projects/${projectId}/tasks`)) ?? demoTasks
  );
}

export async function getTaskArtifacts(taskId: string): Promise<ArtifactSummary[]> {
  return (
    (await apiFetch<ArtifactSummary[]>(`/tasks/${taskId}/artifacts`)) ?? demoArtifacts
  );
}

export async function getProjectAutonomyRuns(
  projectId: string
): Promise<AutonomyRunSummary[]> {
  return (
    (await apiFetch<AutonomyRunSummary[]>(
      `/autonomy/task-runs?projectId=${encodeURIComponent(projectId)}`
    )) ?? []
  );
}

export async function getAutonomyRun(
  runId: string
): Promise<AutonomyRunDetail | null> {
  return (await apiFetch<AutonomyRunDetail>(`/autonomy/task-runs/${runId}`)) ?? null;
}

export function getTaskArtifactOpenUrl(taskId: string, artifactId: string): string {
  return `${apiBaseUrl}/tasks/${taskId}/artifacts/${artifactId}/open`;
}

export function getTaskArtifactDownloadUrl(taskId: string, artifactId: string): string {
  return `${apiBaseUrl}/tasks/${taskId}/artifacts/${artifactId}/download`;
}

export async function getModelSettings(): Promise<ModelSettingsState> {
  const options: ModelSettingsState["options"] = [
    {
      id: "codex",
      label: "Codex CLI",
      models: ["gpt-5.4"],
      keyLabel: null,
      keyHint: "使用本机 Codex 登录态，不需要额外填写 API Key。"
    },
    {
      id: "openai",
      label: "OpenAI",
      models: ["gpt-4.1", "gpt-4o", "gpt-5"],
      keyLabel: "OpenAI API Key（必填）",
      keyHint: "从 OpenAI 平台控制台获取，留空则不修改当前已保存的 Key。"
    },
    {
      id: "moonshot",
      label: "Moonshot Kimi",
      models: ["kimi-k2.5", "moonshot-v1-8k"],
      keyLabel: "Moonshot Kimi API Key（必填）",
      keyHint: "从 Moonshot Kimi 控制台获取，留空则不修改当前已保存的 Key。"
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      models: ["deepseek-chat", "deepseek-reasoner"],
      keyLabel: "DeepSeek API Key（必填）",
      keyHint: "从 DeepSeek 控制台获取，留空则不修改当前已保存的 Key。"
    }
  ];

  return (
    (await apiFetch<ModelSettingsState>("/settings/model")) ?? {
      provider: "codex",
      model: "gpt-5.4",
      hasApiKey: false,
      keyLabel: null,
      keyHint: "使用本机 Codex 登录态，不需要额外填写 API Key。",
      options
    }
  );
}
