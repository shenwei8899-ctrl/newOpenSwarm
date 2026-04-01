import { Injectable, NotFoundException } from "@nestjs/common";
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

  private readonly deerFlowGatewayBaseUrl =
    process.env.DEERFLOW_GATEWAY_BASE_URL ?? "http://127.0.0.1:8001";

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

  async getArtifactAccessUrl(
    taskId: string,
    artifactId: string,
    options?: { download?: boolean }
  ): Promise<string> {
    const artifact = await this.tasksRepo.getArtifact(taskId, artifactId);

    if (!artifact) {
      throw new NotFoundException("Artifact not found.");
    }

    const resolvedVirtualPath = normalizeArtifactVirtualPath(artifact.virtualPath, artifact.filename);

    const encodedPath = resolvedVirtualPath
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    const url = new URL(
      `/api/threads/${encodeURIComponent(artifact.threadId)}/artifacts/${encodedPath}`,
      this.deerFlowGatewayBaseUrl
    );

    if (options?.download) {
      url.searchParams.set("download", "true");
    }

    return url.toString();
  }
}

function normalizeArtifactVirtualPath(virtualPath: string, filename: string): string {
  if (virtualPath.startsWith("/mnt/user-data/")) {
    return virtualPath;
  }

  if (virtualPath.startsWith("/artifacts/")) {
    return `/mnt/user-data/outputs/${filename}`;
  }

  return `/mnt/user-data/outputs/${filename}`;
}
