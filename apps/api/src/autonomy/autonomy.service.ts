import { Injectable } from "@nestjs/common";
import type {
  AutonomyPlan,
  AutonomyRunDetail,
  AutonomyRunSummary,
  CreateAutonomyRunInput,
  GenerateAutonomyPlanInput,
  YinReviewDecisionInput
} from "@openswarm/shared";
import { QueueService } from "../queue/queue.service";
import { AutonomyPlannerService } from "./autonomy-planner.service";
import { AutonomyRepo } from "./autonomy.repo";

@Injectable()
export class AutonomyService {
  constructor(
    private readonly autonomyRepo: AutonomyRepo,
    private readonly plannerService: AutonomyPlannerService,
    private readonly queueService: QueueService
  ) {}

  async listProjectRuns(projectId: string): Promise<AutonomyRunSummary[]> {
    return this.autonomyRepo.listProjectRuns(projectId);
  }

  async generatePlan(input: GenerateAutonomyPlanInput): Promise<AutonomyPlan> {
    return this.plannerService.generatePlan(input);
  }

  async createRun(input: CreateAutonomyRunInput): Promise<AutonomyRunDetail> {
    const plannerOutput =
      input.plannerOutput ??
      (await this.plannerService.generatePlan({
        projectId: input.projectId,
        goal: input.goal,
        sourceDiscussionId: input.sourceDiscussionId ?? null,
        participantEmployeeIds: input.participantEmployeeIds,
        preferredFirstEmployeeId: input.initialEmployeeId
      }));

    const created = await this.autonomyRepo.createRun({
      ...input,
      plannerOutput
    });

    const initialReadySteps = created?.steps.filter((step) => step.status === "ready") ?? [];
    if (created && initialReadySteps.length > 0) {
      for (const step of initialReadySteps) {
        await this.queueService.enqueueAutonomyStepRun({
          runId: created.id,
          stepId: step.id
        });
      }
    }

    return created as AutonomyRunDetail;
  }

  async getRun(runId: string): Promise<AutonomyRunDetail | null> {
    return this.autonomyRepo.getRun(runId);
  }

  async retryStep(runId: string, stepId: string): Promise<AutonomyRunDetail | null> {
    const run = await this.autonomyRepo.retryStep(runId, stepId);
    if (run) {
      await this.queueService.enqueueAutonomyStepRun({
        runId,
        stepId
      });
    }
    return run;
  }

  async reassignStep(
    runId: string,
    stepId: string,
    employeeId: string
  ): Promise<AutonomyRunDetail | null> {
    const run = await this.autonomyRepo.reassignStep(runId, stepId, employeeId);
    if (run) {
      await this.queueService.enqueueAutonomyStepRun({
        runId,
        stepId
      });
    }
    return run;
  }

  async applyYinReview(
    runId: string,
    input: YinReviewDecisionInput
  ): Promise<AutonomyRunDetail | null> {
    const run = await this.autonomyRepo.applyYinReview(runId, input);

    if (run && input.decision === "continue") {
      const nextReadySteps = run.steps.filter((step) => step.status === "ready");
      for (const nextReadyStep of nextReadySteps) {
        await this.queueService.enqueueAutonomyStepRun({
          runId,
          stepId: nextReadyStep.id
        });
      }
    }

    return run;
  }
}
