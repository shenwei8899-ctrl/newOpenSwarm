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

export type ModelProviderId = "codex" | "openai" | "moonshot" | "deepseek";

export type ModelProviderOption = {
  id: ModelProviderId;
  label: string;
  models: string[];
  keyLabel: string | null;
  keyHint: string | null;
};

export type ModelSettingsState = {
  provider: ModelProviderId;
  model: string;
  hasApiKey: boolean;
  keyLabel: string | null;
  keyHint: string | null;
  options: ModelProviderOption[];
};

export type UpdateModelSettingsInput = {
  provider: ModelProviderId;
  model: string;
  apiKey?: string | null;
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

export type StandardEmployeeTemplate = {
  id: string;
  hexId: string;
  workerId: number;
  category: string;
  name: string;
  role: string;
  description: string;
  defaultModel: string;
  agentName: string;
};

const ROLE_PRESETS: Record<
  string,
  {
    role: string;
    description: string;
  }
> = {
  数据与研发: {
    role: "工程",
    description: "先澄清目标，再把执行路径与结果状态做清晰。"
  },
  产品与设计: {
    role: "产品",
    description: "先定义问题与用户价值，再推进方案落地。"
  },
  市场与新媒体: {
    role: "运营",
    description: "先判断传播目标，再组织内容与节奏推进。"
  },
  销售与客服: {
    role: "销售",
    description: "先识别客户意图，再推动转化与问题闭环。"
  },
  供应链与运营: {
    role: "运营",
    description: "先梳理流程卡点，再稳住协同效率与交付节奏。"
  },
  财务与法务: {
    role: "顾问",
    description: "先识别风险边界，再给出稳健、清晰的处理建议。"
  },
  教育与培训: {
    role: "教育",
    description: "先明确学习目标，再拆分路径与关键反馈。"
  },
  医疗与健康: {
    role: "健康",
    description: "先确认需求场景，再给出审慎、易理解的建议。"
  },
  战略与研究: {
    role: "研究",
    description: "先补齐信息和证据，再输出判断与下一步建议。"
  }
};

const STANDARD_EMPLOYEE_SOURCE = [
  { workerId: 1, hexId: "qian", category: "数据与研发", name: "数据挖掘工程师" },
  { workerId: 2, hexId: "kun", category: "数据与研发", name: "数据分析工程师" },
  { workerId: 3, hexId: "tai", category: "数据与研发", name: "算法工程师" },
  { workerId: 4, hexId: "pi", category: "数据与研发", name: "机器学习工程师" },
  { workerId: 5, hexId: "xun", category: "数据与研发", name: "后端研发工程师" },
  { workerId: 6, hexId: "yu", category: "数据与研发", name: "前端研发工程师" },
  { workerId: 7, hexId: "sui", category: "数据与研发", name: "全栈开发工程师" },
  { workerId: 8, hexId: "gu", category: "数据与研发", name: "DevOps工程师" },
  { workerId: 9, hexId: "lin", category: "数据与研发", name: "测试开发工程师" },
  { workerId: 10, hexId: "guan", category: "数据与研发", name: "技术架构师" },
  { workerId: 11, hexId: "h11", category: "产品与设计", name: "产品经理" },
  { workerId: 12, hexId: "h12", category: "产品与设计", name: "增长产品经理" },
  { workerId: 13, hexId: "h13", category: "产品与设计", name: "用户研究员" },
  { workerId: 14, hexId: "h14", category: "产品与设计", name: "交互设计师" },
  { workerId: 15, hexId: "h15", category: "产品与设计", name: "视觉设计师" },
  { workerId: 16, hexId: "h16", category: "产品与设计", name: "品牌设计师" },
  { workerId: 17, hexId: "h17", category: "市场与新媒体", name: "新媒体运营" },
  { workerId: 18, hexId: "h18", category: "市场与新媒体", name: "小红书运营" },
  { workerId: 19, hexId: "h19", category: "市场与新媒体", name: "公众号写作" },
  { workerId: 20, hexId: "h20", category: "市场与新媒体", name: "短视频编导" },
  { workerId: 21, hexId: "h21", category: "市场与新媒体", name: "内容策划经理" },
  { workerId: 22, hexId: "h22", category: "市场与新媒体", name: "SEO内容编辑" },
  { workerId: 23, hexId: "h23", category: "市场与新媒体", name: "品牌策划经理" },
  { workerId: 24, hexId: "h24", category: "市场与新媒体", name: "广告投放优化师" },
  { workerId: 25, hexId: "h25", category: "市场与新媒体", name: "直播运营专员" },
  { workerId: 26, hexId: "h26", category: "市场与新媒体", name: "社区增长运营" },
  { workerId: 27, hexId: "h27", category: "销售与客服", name: "销售经理" },
  { workerId: 28, hexId: "h28", category: "销售与客服", name: "售前咨询顾问" },
  { workerId: 29, hexId: "h29", category: "销售与客服", name: "客户成功经理" },
  { workerId: 30, hexId: "h30", category: "销售与客服", name: "电商客服专员" },
  { workerId: 31, hexId: "h31", category: "销售与客服", name: "客服质检主管" },
  { workerId: 32, hexId: "h32", category: "销售与客服", name: "售后处理专员" },
  { workerId: 33, hexId: "h33", category: "销售与客服", name: "投诉升级经理" },
  { workerId: 34, hexId: "h34", category: "销售与客服", name: "渠道拓展经理" },
  { workerId: 35, hexId: "h35", category: "供应链与运营", name: "供应链计划专员" },
  { workerId: 36, hexId: "h36", category: "供应链与运营", name: "采购经理" },
  { workerId: 37, hexId: "h37", category: "供应链与运营", name: "物流协调专员" },
  { workerId: 38, hexId: "h38", category: "供应链与运营", name: "仓储运营经理" },
  { workerId: 39, hexId: "h39", category: "供应链与运营", name: "质量管理工程师" },
  { workerId: 40, hexId: "h40", category: "供应链与运营", name: "流程运营专员" },
  { workerId: 41, hexId: "h41", category: "财务与法务", name: "财务分析师" },
  { workerId: 42, hexId: "h42", category: "财务与法务", name: "预算管理专员" },
  { workerId: 43, hexId: "h43", category: "财务与法务", name: "审计经理" },
  { workerId: 44, hexId: "h44", category: "财务与法务", name: "税务顾问" },
  { workerId: 45, hexId: "h45", category: "财务与法务", name: "法务顾问" },
  { workerId: 46, hexId: "h46", category: "财务与法务", name: "合规经理" },
  { workerId: 47, hexId: "h47", category: "财务与法务", name: "知识产权专员" },
  { workerId: 48, hexId: "h48", category: "财务与法务", name: "风控策略经理" },
  { workerId: 49, hexId: "h49", category: "教育与培训", name: "语文教师" },
  { workerId: 50, hexId: "h50", category: "教育与培训", name: "数学教师" },
  { workerId: 51, hexId: "h51", category: "教育与培训", name: "英语教师" },
  { workerId: 52, hexId: "h52", category: "教育与培训", name: "物理教师" },
  { workerId: 53, hexId: "h53", category: "教育与培训", name: "化学教师" },
  { workerId: 54, hexId: "h54", category: "教育与培训", name: "历史教师" },
  { workerId: 55, hexId: "h55", category: "教育与培训", name: "课程研发专员" },
  { workerId: 56, hexId: "h56", category: "教育与培训", name: "职业规划顾问" },
  { workerId: 57, hexId: "h57", category: "医疗与健康", name: "全科医生助理" },
  { workerId: 58, hexId: "h58", category: "医疗与健康", name: "临床研究助理" },
  { workerId: 59, hexId: "h59", category: "医疗与健康", name: "药学信息专员" },
  { workerId: 60, hexId: "h60", category: "医疗与健康", name: "营养健康顾问" },
  { workerId: 61, hexId: "h61", category: "医疗与健康", name: "心理咨询助理" },
  { workerId: 62, hexId: "h62", category: "医疗与健康", name: "康复计划顾问" },
  { workerId: 63, hexId: "h63", category: "战略与研究", name: "行业研究员" },
  { workerId: 64, hexId: "h64", category: "战略与研究", name: "战略咨询顾问" }
] as const;

export const standardEmployeeTemplates: StandardEmployeeTemplate[] = STANDARD_EMPLOYEE_SOURCE.map((item) => {
  const preset = ROLE_PRESETS[item.category] ?? {
    role: item.category,
    description: "先理解目标，再输出清晰、稳健、可执行的建议。"
  };

  return {
    id: `employee_${String(item.workerId).padStart(2, "0")}`,
    hexId: item.hexId,
    workerId: item.workerId,
    category: item.category,
    name: item.name,
    role: preset.role,
    description: preset.description,
    defaultModel: "gpt-5.4",
    agentName: `agent_${String(item.workerId).padStart(2, "0")}_${item.hexId}`
  };
});
