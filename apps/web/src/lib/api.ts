import type {
  ArtifactSummary,
  CreateProjectInput,
  DiscussionMessageItem,
  DiscussionSessionSummary,
  EmployeeCatalogItem,
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
