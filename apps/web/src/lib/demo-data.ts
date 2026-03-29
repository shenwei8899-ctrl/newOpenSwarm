import type {
  ArtifactSummary,
  DiscussionMessageItem,
  DiscussionSessionSummary,
  ProjectEmployeeItem,
  ProjectSkillAssignmentsResponse,
  ProjectSummary,
  SkillCatalogItem,
  TaskSummary
} from "@openswarm/shared";

export const demoProjects: ProjectSummary[] = [
  {
    id: "proj_demo_xhs_ops",
    name: "小红书运营 team",
    employeeCount: 2,
    activeTaskCount: 0,
    status: "active",
    lastDiscussionAt: null
  },
  {
    id: "proj_demo_growth_lab",
    name: "增长策略实验室",
    employeeCount: 3,
    activeTaskCount: 1,
    status: "draft",
    lastDiscussionAt: null
  }
];

export const demoEmployees: ProjectEmployeeItem[] = [
  {
    id: "employee_xhs_ops",
    name: "小红书运营",
    role: "运营",
    description: "先澄清目标，再执行动作。",
    defaultModel: "gpt-5.4",
    selected: true,
    sortOrder: 0
  },
  {
    id: "employee_crawler",
    name: "爬虫专家",
    role: "研究",
    description: "优先补齐外部信息和案例证据。",
    defaultModel: "gpt-5.4",
    selected: true,
    sortOrder: 1
  },
  {
    id: "employee_backend",
    name: "后端工程师",
    role: "工程",
    description: "把执行路径做稳定，把状态做清晰。",
    defaultModel: "gpt-5.4",
    selected: false,
    sortOrder: null
  }
] ;

export const demoSkills: SkillCatalogItem[] = [
  {
    id: "summarize",
    name: "Summarize",
    category: "general",
    description: "Summarize long-form content into concise insights.",
    enabled: true,
    source: "deerflow"
  },
  {
    id: "filesystem",
    name: "Filesystem",
    category: "system",
    description: "Read and write project files in controlled execution space.",
    enabled: true,
    source: "deerflow"
  },
  {
    id: "agent-browser",
    name: "Agent Browser",
    category: "web",
    description: "Use browser automation for external research workflows.",
    enabled: true,
    source: "deerflow"
  }
];

export const demoAssignments: ProjectSkillAssignmentsResponse = {
  projectId: "proj_demo_xhs_ops",
  assignments: [
    {
      employeeId: "employee_xhs_ops",
      employeeName: "小红书运营",
      skillIds: ["summarize"]
    },
    {
      employeeId: "employee_crawler",
      employeeName: "爬虫专家",
      skillIds: ["summarize", "agent-browser", "filesystem"]
    }
  ]
};

export const demoDiscussions: DiscussionSessionSummary[] = [
  {
    id: "discussion_demo_1",
    projectId: "proj_demo_xhs_ops",
    title: "早餐店小红书方案",
    mode: "group",
    status: "active",
    summary: "已完成占位讨论，等待接入真实运行时总结。",
    participantEmployeeIds: ["employee_xhs_ops", "employee_crawler"],
    createdAt: "2026-03-26T00:44:33.906Z",
    updatedAt: "2026-03-26T00:44:49.057Z"
  }
];

export const demoDiscussionMessages: DiscussionMessageItem[] = [
  {
    id: "message_demo_user",
    discussionId: "discussion_demo_1",
    senderType: "user",
    senderId: null,
    roundNo: 0,
    content: "我有一家早餐店，想通过小红书提升到店订单。请先讨论再给方案。",
    createdAt: "2026-03-26T00:44:49.019Z"
  },
  {
    id: "message_demo_employee_1",
    discussionId: "discussion_demo_1",
    senderType: "employee",
    senderId: "employee_xhs_ops",
    roundNo: 1,
    content: "小红书运营 已基于当前需求给出第一轮响应：先明确目标用户和门店卖点。",
    createdAt: "2026-03-26T00:44:49.056Z"
  },
  {
    id: "message_demo_employee_2",
    discussionId: "discussion_demo_1",
    senderType: "employee",
    senderId: "employee_crawler",
    roundNo: 2,
    content: "爬虫专家 已基于当前需求给出第一轮响应：建议先补充本地案例和热门笔记结构。",
    createdAt: "2026-03-26T00:44:49.057Z"
  }
];

export const demoTasks: TaskSummary[] = [
  {
    id: "task_demo_1",
    projectId: "proj_demo_xhs_ops",
    title: "输出早餐店小红书方案",
    description: "根据讨论产出一份 markdown 方案",
    status: "done",
    sourceDiscussionId: "discussion_demo_1",
    sourceDiscussionTitle: "早餐店小红书方案",
    summary: "先聚焦爆款单品、门店真实感和到店福利，持续两周测试高转化内容模板。",
    runtimeJobs: [
      {
        id: "runtime_job_demo_1",
        taskId: "task_demo_1",
        employeeId: "employee_xhs_ops",
        threadId: "thread_task_demo_1_employee_xhs_ops",
        agentName: "employee_xhs_ops",
        status: "completed",
        error: null,
        startedAt: "2026-03-26T00:44:35.000Z",
        finishedAt: "2026-03-26T00:44:49.000Z",
        createdAt: "2026-03-26T00:44:34.000Z"
      }
    ],
    createdAt: "2026-03-26T00:44:33.905Z",
    updatedAt: "2026-03-26T00:44:49.056Z"
  }
];

export const demoArtifacts: ArtifactSummary[] = [
  {
    id: "artifact_demo_1",
    taskId: "task_demo_1",
    runtimeJobId: "runtime_job_demo_1",
    threadId: "thread_task_demo_1_employee_xhs_ops",
    virtualPath: "/artifacts/task_demo_1/result.md",
    filename: "result.md",
    mimeType: "text/markdown",
    sizeBytes: null,
    createdAt: "2026-03-26T00:44:49.057Z"
  }
];
