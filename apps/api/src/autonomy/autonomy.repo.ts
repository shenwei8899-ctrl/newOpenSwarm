import { Injectable } from "@nestjs/common";
import { prisma } from "@openswarm/db";
import type {
  AutonomyEventItem,
  AutonomyPlan,
  AutonomyRunDetail,
  AutonomyRunSummary,
  AutonomyStepSummary,
  CreateAutonomyRunInput,
  EmployeeCatalogItem
} from "@openswarm/shared";

@Injectable()
export class AutonomyRepo {
  async listProjectEmployees(projectId: string): Promise<(EmployeeCatalogItem & { selected: boolean })[]> {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        projectLinks: {
          where: { projectId }
        }
      }
    });

    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      description: employee.description,
      defaultModel: employee.modelName ?? "gpt-5.4",
      selected: employee.projectLinks.length > 0
    }));
  }

  async listProjectRuns(projectId: string): Promise<AutonomyRunSummary[]> {
    const runs = await prisma.autonomyRun.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });

    return runs.map(mapRunSummary);
  }

  async createRun(input: CreateAutonomyRunInput & { plannerOutput: AutonomyPlan }) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { tenantId: true }
    });

    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const task = input.sourceTaskId
        ? null
        : await tx.task.create({
            data: {
              tenantId: project.tenantId,
              projectId: input.projectId,
              title: input.title ?? input.plannerOutput.title,
              description: input.goal,
              sourceDiscussionId: input.sourceDiscussionId ?? null,
              status: "running",
              summary: "自治接力已启动，等待第一棒执行。",
              createdBy: "autonomy"
            }
          });

      const run = await tx.autonomyRun.create({
        data: {
          tenantId: project.tenantId,
          projectId: input.projectId,
          sourceDiscussionId: input.sourceDiscussionId ?? null,
          sourceTaskId: input.sourceTaskId ?? task?.id ?? null,
          title: input.title ?? input.plannerOutput.title,
          goal: input.goal,
          status: "running",
          initialEmployeeId: input.initialEmployeeId,
          currentEmployeeId: input.initialEmployeeId,
          participantEmployeeIds: input.participantEmployeeIds,
          plannerOutput: input.plannerOutput
        }
      });

      for (const [index, step] of input.plannerOutput.steps.entries()) {
        await tx.autonomyStep.create({
          data: {
            runId: run.id,
            stepKey: step.stepKey,
            title: step.title,
            status: step.dependsOn.length === 0 ? "ready" : "queued",
            ownerEmployeeId: step.ownerEmployeeId,
            dependsOn: step.dependsOn,
            goal: step.goal,
            stepIndex: index,
            inputContext: {
              notes: step.notes ?? null
            }
          }
        });
      }

      await tx.autonomyEvent.create({
        data: {
          runId: run.id,
          type: "run_started",
          agentId: input.initialEmployeeId,
          message: "自治接力已启动。",
          metadata: {
            participantEmployeeIds: input.participantEmployeeIds
          }
        }
      });

      await tx.autonomyEvent.create({
        data: {
          runId: run.id,
          type: "plan_generated",
          message: "系统已生成自治接力计划。",
          metadata: input.plannerOutput
        }
      });

      return run.id;
    });

    return this.getRun(created);
  }

  async getRun(runId: string): Promise<AutonomyRunDetail | null> {
    const run = await prisma.autonomyRun.findUnique({
      where: { id: runId },
      include: {
        steps: {
          orderBy: { stepIndex: "asc" }
        },
        events: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!run) {
      return null;
    }

    return {
      ...mapRunSummary(run),
      plannerOutput: (run.plannerOutput ?? null) as AutonomyPlan | null,
      steps: run.steps.map((step) =>
        mapStepSummary(
          step,
          ((run.plannerOutput ?? null) as AutonomyPlan | null)?.steps.find(
            (candidate) => candidate.stepKey === step.stepKey
          ) ?? null
        )
      ),
      events: run.events.map(mapEventItem)
    };
  }

  async retryStep(runId: string, stepId: string) {
    await prisma.$transaction(async (tx) => {
      const step = await tx.autonomyStep.findUnique({
        where: { id: stepId }
      });

      if (!step || step.runId !== runId) {
        throw new Error("Autonomy step not found.");
      }

      await tx.autonomyStep.update({
        where: { id: stepId },
        data: {
          status: "ready",
          startedAt: null,
          finishedAt: null
        }
      });

      await tx.autonomyRun.update({
        where: { id: runId },
        data: {
          status: "running",
          currentEmployeeId: step.ownerEmployeeId,
          lastError: null
        }
      });

      await tx.autonomyEvent.create({
        data: {
          runId,
          stepId,
          type: "retry",
          agentId: step.ownerEmployeeId,
          message: "步骤已重试。",
          metadata: {}
        }
      });
    });

    return this.getRun(runId);
  }

  async reassignStep(runId: string, stepId: string, employeeId: string) {
    await prisma.$transaction(async (tx) => {
      const step = await tx.autonomyStep.findUnique({
        where: { id: stepId }
      });

      if (!step || step.runId !== runId) {
        throw new Error("Autonomy step not found.");
      }

      await tx.autonomyStep.update({
        where: { id: stepId },
        data: {
          ownerEmployeeId: employeeId,
          handoffTo: employeeId,
          status: "ready"
        }
      });

      await tx.autonomyRun.update({
        where: { id: runId },
        data: {
          status: "running",
          currentEmployeeId: employeeId,
          lastError: null
        }
      });

      await tx.autonomyEvent.create({
        data: {
          runId,
          stepId,
          type: "reassign",
          agentId: employeeId,
          message: "步骤已改派给新的员工。",
          metadata: {
            employeeId
          }
        }
      });
    });

    return this.getRun(runId);
  }

  async applyYinReview(
    runId: string,
    input: { decision: "continue" | "waiting_user" | "terminate"; nextEmployeeId?: string | null; note?: string | null; }
  ) {
    await prisma.$transaction(async (tx) => {
      const run = await tx.autonomyRun.findUnique({
        where: { id: runId }
      });

      if (!run) {
        throw new Error("Autonomy run not found.");
      }

      const status =
        input.decision === "continue"
          ? "running"
          : input.decision === "waiting_user"
            ? "waiting_user"
            : "terminated";

      await tx.autonomyRun.update({
        where: { id: runId },
        data: {
          status,
          currentEmployeeId:
            input.decision === "continue"
              ? input.nextEmployeeId ?? run.currentEmployeeId
              : run.currentEmployeeId,
          summary: input.note ?? run.summary
        }
      });

      await tx.autonomyEvent.create({
        data: {
          runId,
          type: "needs_yin",
          agentId: input.nextEmployeeId ?? null,
          message: input.note ?? "主控已给出自治仲裁结果。",
          metadata: {
            decision: input.decision
          }
        }
      });
    });

    return this.getRun(runId);
  }
}

function mapRunSummary(run: {
  id: string;
  projectId: string;
  sourceDiscussionId: string | null;
  sourceTaskId: string | null;
  title: string;
  goal: string;
  status: string;
  initialEmployeeId: string;
  currentEmployeeId: string | null;
  summary: string | null;
  lastError: string | null;
  participantEmployeeIds: unknown;
  createdAt: Date;
  updatedAt: Date;
}): AutonomyRunSummary {
  return {
    id: run.id,
    projectId: run.projectId,
    sourceDiscussionId: run.sourceDiscussionId,
    sourceTaskId: run.sourceTaskId,
    title: run.title,
    goal: run.goal,
    status: run.status,
    initialEmployeeId: run.initialEmployeeId,
    currentEmployeeId: run.currentEmployeeId,
    summary: run.summary,
    lastError: run.lastError,
    participantEmployeeIds: Array.isArray(run.participantEmployeeIds)
      ? (run.participantEmployeeIds as string[])
      : [],
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

function mapStepSummary(step: {
  id: string;
  runId: string;
  stepKey: string;
  title: string;
  status: string;
  ownerEmployeeId: string;
  dependsOn: unknown;
  goal: string;
  outputSummary: string | null;
  artifacts: unknown;
  handoffTo: string | null;
  handoffMessage: string | null;
  runtimeJobId: string | null;
  stepIndex: number;
  startedAt: Date | null;
  finishedAt: Date | null;
},
planStep: AutonomyPlan["steps"][number] | null): AutonomyStepSummary {
  return {
    id: step.id,
    runId: step.runId,
    stepKey: step.stepKey,
    title: step.title,
    status: step.status,
    ownerEmployeeId: step.ownerEmployeeId,
    dependsOn: Array.isArray(step.dependsOn) ? (step.dependsOn as string[]) : [],
    executionMode: planStep?.executionMode ?? "serial",
    goal: step.goal,
    outputSummary: step.outputSummary,
    artifacts: Array.isArray(step.artifacts) ? (step.artifacts as string[]) : [],
    handoffTo: step.handoffTo,
    handoffMessage: step.handoffMessage,
    runtimeJobId: step.runtimeJobId,
    stepIndex: step.stepIndex,
    startedAt: step.startedAt?.toISOString() ?? null,
    finishedAt: step.finishedAt?.toISOString() ?? null
  };
}

function mapEventItem(event: {
  id: string;
  runId: string;
  stepId: string | null;
  type: string;
  agentId: string | null;
  message: string | null;
  metadata: unknown;
  createdAt: Date;
}): AutonomyEventItem {
  return {
    id: event.id,
    runId: event.runId,
    stepId: event.stepId,
    type: event.type,
    agentId: event.agentId,
    message: event.message,
    metadata:
      event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, unknown>)
        : {},
    createdAt: event.createdAt.toISOString()
  };
}
