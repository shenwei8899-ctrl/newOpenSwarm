import { Injectable } from "@nestjs/common";
import type {
  AutonomyPlan,
  AutonomyPlanStep,
  EmployeeCatalogItem,
  GenerateAutonomyPlanInput
} from "@openswarm/shared";
import { AutonomyRepo } from "./autonomy.repo";

type PlannerEmployee = EmployeeCatalogItem & {
  selected: boolean;
};

type PlanningInput = GenerateAutonomyPlanInput & {
  preferredFirstEmployeeId?: string | null;
};

@Injectable()
export class AutonomyPlannerService {
  constructor(private readonly autonomyRepo: AutonomyRepo) {}

  async generatePlan(input: PlanningInput): Promise<AutonomyPlan> {
    const employees = await this.autonomyRepo.listProjectEmployees(input.projectId);
    const selectedEmployees = filterSelectedEmployees(employees, input.participantEmployeeIds);

    const steps = buildPlanSteps(selectedEmployees, input);

    return {
      title: inferPlanTitle(input.goal),
      goal: input.goal,
      participantEmployeeIds: selectedEmployees.map((employee) => employee.id),
      steps,
      warnings:
        steps.length === 0
          ? ["当前团队缺少足够角色，暂时无法生成接力计划。"]
          : []
    };
  }
}

function filterSelectedEmployees(
  employees: PlannerEmployee[],
  participantEmployeeIds?: string[]
) {
  if (participantEmployeeIds?.length) {
    return employees.filter((employee) => participantEmployeeIds.includes(employee.id));
  }

  const selected = employees.filter((employee) => employee.selected);
  return selected.length ? selected : employees;
}

function buildPlanSteps(
  employees: PlannerEmployee[],
  input: PlanningInput
): AutonomyPlanStep[] {
  const ordered = rankEmployeesForPlan(employees, input);

  if (isDocumentGoal(input.goal)) {
    const parallelPlan = buildDocumentPlan(ordered, input);
    if (parallelPlan.length > 0) {
      return parallelPlan;
    }
  }

  return ordered.map((employee, index) => ({
    stepKey: `step_${index + 1}`,
    title: inferStepTitle(employee.role, index),
    ownerEmployeeId: employee.id,
    dependsOn: index === 0 ? [] : [`step_${index}`],
    executionMode: index === 0 ? "parallel" : "serial",
    goal: inferStepGoal(employee.role, input.goal, index, {
      hasSourceDiscussion: Boolean(input.sourceDiscussionId),
      isDocumentGoal: isDocumentGoal(input.goal)
    })
  }));
}

function buildDocumentPlan(
  employees: PlannerEmployee[],
  input: PlanningInput
): AutonomyPlanStep[] {
  if (employees.length === 0) {
    return [];
  }

  const writer = employees.find((employee) => isWriterRole(employee.role)) ?? employees[0];
  const research = employees.find((employee) => isResearchRole(employee.role));
  const analyst = employees.find(
    (employee) => isAnalystRole(employee.role) && employee.id !== writer?.id && employee.id !== research?.id
  );
  const lawyer = employees.find(
    (employee) =>
      isLawyerRole(employee.role) &&
      employee.id !== writer?.id &&
      employee.id !== research?.id &&
      employee.id !== analyst?.id
  );

  const steps: AutonomyPlanStep[] = [];
  let stepCounter = 1;

  const nextKey = () => `step_${stepCounter++}`;

  const framingStepKey = nextKey();
  steps.push({
    stepKey: framingStepKey,
    title: input.sourceDiscussionId ? "梳理目标与交付结构" : "明确任务目标与交付结构",
    ownerEmployeeId: writer.id,
    dependsOn: [],
    executionMode: "parallel",
    goal: input.sourceDiscussionId
      ? `基于现有讨论先梳理“${input.goal}”的交付结构、目标边界和所需输入，避免后续接力跑偏。`
      : `先明确“${input.goal}”的目标、交付格式、重点章节和需要的输入边界。`
  });

  let evidenceSourceStepKey = framingStepKey;

  if (research && research.id !== writer.id) {
    const researchStepKey = nextKey();
    steps.push({
      stepKey: researchStepKey,
      title: "采集与补齐资料",
      ownerEmployeeId: research.id,
      dependsOn: [],
      executionMode: "parallel",
      goal: inferStepGoal(research.role, input.goal, 1, {
        hasSourceDiscussion: Boolean(input.sourceDiscussionId),
        isDocumentGoal: true
      })
    });
    evidenceSourceStepKey = researchStepKey;
  }

  let analysisSourceStepKey = evidenceSourceStepKey;

  if (analyst) {
    const analysisStepKey = nextKey();
    steps.push({
      stepKey: analysisStepKey,
      title: "分析资料并形成结论",
      ownerEmployeeId: analyst.id,
      dependsOn:
        evidenceSourceStepKey === framingStepKey
          ? [framingStepKey]
          : [evidenceSourceStepKey],
      executionMode: "serial",
      goal: inferStepGoal(analyst.role, input.goal, 2, {
        hasSourceDiscussion: Boolean(input.sourceDiscussionId),
        isDocumentGoal: true
      })
    });
    analysisSourceStepKey = analysisStepKey;
  }

  const draftStepKey = nextKey();
  const draftDependsOn = Array.from(
    new Set(
      [framingStepKey, analysisSourceStepKey].filter(Boolean)
    )
  );
  steps.push({
    stepKey: draftStepKey,
    title: "撰写主文稿",
    ownerEmployeeId: writer.id,
    dependsOn: draftDependsOn,
    executionMode: "serial",
    goal: inferStepGoal(writer.role, input.goal, 3, {
      hasSourceDiscussion: Boolean(input.sourceDiscussionId),
      isDocumentGoal: true
    })
  });

  if (lawyer) {
    const reviewStepKey = nextKey();
    steps.push({
      stepKey: reviewStepKey,
      title: "审核风险与表述",
      ownerEmployeeId: lawyer.id,
      dependsOn: [draftStepKey],
      executionMode: "serial",
      goal: inferStepGoal(lawyer.role, input.goal, 4, {
        hasSourceDiscussion: Boolean(input.sourceDiscussionId),
        isDocumentGoal: true
      })
    });
  }

  return steps;
}

function rankEmployeesForPlan(employees: PlannerEmployee[], input: PlanningInput) {
  const priority = buildPriority(input);
  const preferredFirstEmployeeId = input.preferredFirstEmployeeId ?? null;

  const sorted = [...employees].sort((a, b) => scoreEmployee(a.role, priority) - scoreEmployee(b.role, priority));
  if (!preferredFirstEmployeeId) {
    return sorted;
  }

  const preferredIndex = sorted.findIndex((employee) => employee.id === preferredFirstEmployeeId);
  if (preferredIndex <= 0) {
    return sorted;
  }

  const [preferred] = sorted.splice(preferredIndex, 1);
  return preferred ? [preferred, ...sorted] : sorted;
}

function scoreEmployee(role: string, priority: RegExp[]) {
  const index = priority.findIndex((pattern) => pattern.test(role));
  return index === -1 ? priority.length + role.length : index;
}

function buildPriority(input: PlanningInput) {
  if (input.sourceDiscussionId && isDocumentGoal(input.goal)) {
    return [
      /文员|写手|写作|内容|策划|运营/i,
      /律师|法务|合规/i,
      /分析|数据分析|策略/i,
      /爬虫|搜索|研究|调研|数据挖掘/i
    ];
  }

  return [
    /爬虫|搜索|研究|调研|数据挖掘/i,
    /分析|数据分析|策略/i,
    /文员|写手|写作|内容|策划|运营/i,
    /律师|法务|合规/i
  ];
}

function isDocumentGoal(goal: string) {
  return /markdown|\.md|文档|报告|成稿|文件|交付/i.test(goal);
}

function isResearchRole(role: string) {
  return /爬虫|搜索|研究|调研|数据挖掘/i.test(role);
}

function isAnalystRole(role: string) {
  return /分析|数据分析|策略/i.test(role);
}

function isWriterRole(role: string) {
  return /文员|写手|写作|内容|策划|运营/i.test(role);
}

function isLawyerRole(role: string) {
  return /律师|法务|合规/i.test(role);
}

function inferPlanTitle(goal: string) {
  return goal.length > 28 ? `${goal.slice(0, 28)}...` : goal;
}

function inferStepTitle(role: string, index: number) {
  if (/爬虫|搜索|研究|调研|数据挖掘/i.test(role)) {
    return "采集与补齐资料";
  }

  if (/分析|数据分析|策略/i.test(role)) {
    return "分析资料并形成结论";
  }

  if (/文员|写手|写作|内容|策划/i.test(role)) {
    return "撰写主文稿";
  }

  if (/律师|法务|合规/i.test(role)) {
    return "审核风险与表述";
  }

  return `执行步骤 ${index + 1}`;
}

function inferStepGoal(
  role: string,
  goal: string,
  index: number,
  options?: {
    hasSourceDiscussion?: boolean;
    isDocumentGoal?: boolean;
  }
) {
  if (options?.hasSourceDiscussion && options?.isDocumentGoal && /文员|写手|写作|内容|策划|运营/i.test(role)) {
    return `基于现有讨论和已有上下文，直接整理“${goal}”的主文稿，并明确需要补充或交接给下一棒的事项。`;
  }

  if (/爬虫|搜索|研究|调研|数据挖掘/i.test(role)) {
    return options?.hasSourceDiscussion
      ? `仅在现有讨论信息不足时，围绕“${goal}”补齐必要资料、来源、案例和证据；如果现有上下文已足够，请避免阻塞并给出最小补充结论。`
      : `围绕“${goal}”补齐资料、来源、案例和证据。`;
  }

  if (/分析|数据分析|策略/i.test(role)) {
    return `基于上游资料，提炼关键趋势、结构化结论和数据洞察。`;
  }

  if (/文员|写手|写作|内容|策划/i.test(role)) {
    return `基于前面步骤的输出，将“${goal}”整理成可交付文稿。`;
  }

  if (/律师|法务|合规/i.test(role)) {
    return "对文稿做风险、合规和表述审核，指出需修订项。";
  }

  return `围绕“${goal}”完成第 ${index + 1} 棒协作输出。`;
}
