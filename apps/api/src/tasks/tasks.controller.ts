import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type {
  ArtifactSummary,
  AssignTaskInput,
  CreateTaskInput,
  RunTaskInput,
  RuntimeJobSummary,
  TaskSummary
} from "@openswarm/shared";
import { TasksService } from "./tasks.service";

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("projects/:projectId/tasks")
  async listProjectTasks(
    @Param("projectId") projectId: string
  ): Promise<TaskSummary[]> {
    return this.tasksService.listProjectTasks(projectId);
  }

  @Post("projects/:projectId/tasks")
  async createTask(
    @Param("projectId") projectId: string,
    @Body() body: CreateTaskInput
  ): Promise<TaskSummary> {
    return this.tasksService.createTask(projectId, body);
  }

  @Get("tasks/:taskId")
  async getTask(@Param("taskId") taskId: string): Promise<TaskSummary | null> {
    return this.tasksService.getTask(taskId);
  }

  @Post("tasks/:taskId/assign")
  async assignTask(
    @Param("taskId") taskId: string,
    @Body() body: AssignTaskInput
  ): Promise<TaskSummary | null> {
    return this.tasksService.assignTask(taskId, body.employeeIds ?? []);
  }

  @Post("tasks/:taskId/run")
  async runTask(
    @Param("taskId") taskId: string,
    @Body() body: RunTaskInput
  ): Promise<RuntimeJobSummary | null> {
    return this.tasksService.runTask(taskId, body.employeeId);
  }

  @Get("tasks/:taskId/artifacts")
  async listArtifacts(
    @Param("taskId") taskId: string
  ): Promise<ArtifactSummary[]> {
    return this.tasksService.listArtifacts(taskId);
  }
}
