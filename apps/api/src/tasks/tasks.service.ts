import { Injectable } from "@nestjs/common";
import type {
  ArtifactSummary,
  CreateTaskInput,
  RuntimeJobSummary,
  TaskSummary
} from "@openswarm/shared";
import { TasksRepo } from "./tasks.repo";
import { QueueService } from "../queue/queue.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepo: TasksRepo,
    private readonly queueService: QueueService
  ) {}

  async listProjectTasks(projectId: string): Promise<TaskSummary[]> {
    return this.tasksRepo.listProjectTasks(projectId);
  }

  async createTask(projectId: string, input: CreateTaskInput): Promise<TaskSummary> {
    return this.tasksRepo.createTask(projectId, input);
  }

  async getTask(taskId: string): Promise<TaskSummary | null> {
    return this.tasksRepo.getTask(taskId);
  }

  async assignTask(taskId: string, employeeIds: string[]): Promise<TaskSummary | null> {
    return this.tasksRepo.assignTask(taskId, employeeIds);
  }

  async runTask(
    taskId: string,
    employeeId: string
  ): Promise<RuntimeJobSummary | null> {
    const job = await this.tasksRepo.createRuntimeJob(taskId, employeeId);

    if (job) {
      await this.queueService.enqueueTaskRun({
        taskId,
        employeeId
      });
    }

    return job;
  }

  async listArtifacts(taskId: string): Promise<ArtifactSummary[]> {
    return this.tasksRepo.listArtifacts(taskId);
  }
}
