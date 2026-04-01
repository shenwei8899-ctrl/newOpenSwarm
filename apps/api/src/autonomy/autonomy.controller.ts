import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type {
  AutonomyRunDetail,
  AutonomyRunSummary,
  CreateAutonomyRunInput,
  GenerateAutonomyPlanInput,
  RetryAutonomyStepInput,
  ReassignAutonomyStepInput,
  YinReviewDecisionInput,
  AutonomyPlan
} from "@openswarm/shared";
import { AutonomyService } from "./autonomy.service";

@Controller("autonomy")
export class AutonomyController {
  constructor(private readonly autonomyService: AutonomyService) {}

  @Get("task-runs")
  async listProjectRuns(
    @Query("projectId") projectId: string
  ): Promise<AutonomyRunSummary[]> {
    return this.autonomyService.listProjectRuns(projectId);
  }

  @Post("plans")
  async generatePlan(
    @Body() input: GenerateAutonomyPlanInput
  ): Promise<AutonomyPlan> {
    return this.autonomyService.generatePlan(input);
  }

  @Post("task-runs")
  async createRun(
    @Body() input: CreateAutonomyRunInput
  ): Promise<AutonomyRunDetail> {
    return this.autonomyService.createRun(input);
  }

  @Get("task-runs/:runId")
  async getRun(@Param("runId") runId: string): Promise<AutonomyRunDetail | null> {
    return this.autonomyService.getRun(runId);
  }

  @Post("task-runs/:runId/retry-step")
  async retryStep(
    @Param("runId") runId: string,
    @Body() input: RetryAutonomyStepInput
  ): Promise<AutonomyRunDetail | null> {
    return this.autonomyService.retryStep(runId, input.stepId);
  }

  @Post("task-runs/:runId/reassign-step")
  async reassignStep(
    @Param("runId") runId: string,
    @Body() input: ReassignAutonomyStepInput
  ): Promise<AutonomyRunDetail | null> {
    return this.autonomyService.reassignStep(runId, input.stepId, input.employeeId);
  }

  @Post("task-runs/:runId/yin-review")
  async yinReview(
    @Param("runId") runId: string,
    @Body() input: YinReviewDecisionInput
  ): Promise<AutonomyRunDetail | null> {
    return this.autonomyService.applyYinReview(runId, input);
  }
}
