export type AppHealth = {
  ok: boolean;
  service: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  employeeCount: number;
  activeTaskCount: number;
  lastDiscussionAt: string | null;
};

export type CreateProjectInput = {
  name: string;
  templateId?: string | null;
};

export type EmployeeCatalogItem = {
  id: string;
  name: string;
  role: string;
  description: string;
  defaultModel: string;
};

export type SkillCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  source: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  status: string;
  employeeCount: number;
  activeTaskCount: number;
  lastDiscussionAt: string | null;
};

export type ProjectEmployeeItem = EmployeeCatalogItem & {
  selected: boolean;
  sortOrder: number | null;
};

export type UpdateProjectEmployeesInput = {
  employeeIds: string[];
};

export type ProjectSkillAssignment = {
  employeeId: string;
  employeeName: string;
  skillIds: string[];
};

export type ProjectSkillAssignmentsResponse = {
  projectId: string;
  assignments: ProjectSkillAssignment[];
};

export type UpdateProjectSkillAssignmentsInput = {
  assignments: Array<{
    employeeId: string;
    skillIds: string[];
  }>;
};

export type DiscussionSessionSummary = {
  id: string;
  projectId: string;
  title: string;
  mode: string;
  status: string;
  summary: string | null;
  participantEmployeeIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type DiscussionMessageItem = {
  id: string;
  discussionId: string;
  senderType: "user" | "employee" | "system" | "coordinator";
  senderId: string | null;
  roundNo: number;
  content: string;
  createdAt: string;
};

export type CreateDiscussionInput = {
  mode: string;
  title: string;
  participantEmployeeIds: string[];
};

export type CreateDiscussionMessageInput = {
  content: string;
};

export type RunDiscussionInput = {
  rounds: number;
};

export type TaskSummary = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  sourceDiscussionId: string | null;
  sourceDiscussionTitle: string | null;
  summary: string | null;
  runtimeJobs: RuntimeJobSummary[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description: string;
  sourceDiscussionId?: string | null;
};

export type AssignTaskInput = {
  employeeIds: string[];
};

export type RunTaskInput = {
  employeeId: string;
};

export type RuntimeJobSummary = {
  id: string;
  taskId: string;
  employeeId: string;
  threadId: string;
  agentName: string;
  status: string;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type ArtifactSummary = {
  id: string;
  taskId: string;
  runtimeJobId: string;
  threadId: string;
  virtualPath: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: string | null;
  createdAt: string;
};

export const queueNames = {
  discussions: "discussions",
  tasks: "tasks"
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export type DiscussionRunJob = {
  discussionId: string;
  rounds: number;
};

export type TaskRunJob = {
  taskId: string;
  employeeId: string;
};
