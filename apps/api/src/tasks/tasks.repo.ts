import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { prisma } from "@openswarm/db";
import type {
  ArtifactSummary,
  CreateTaskInput,
  RuntimeJobSummary,
  TaskSummary
} from "@openswarm/shared";

@Injectable()
export class TasksRepo {
  private toTaskSummary(task: {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: string;
    sourceDiscussionId: string | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
    sourceDiscussion?: { title: string } | null;
    runtimeJobs?: Array<{
      id: string;
      taskId: string;
      employeeId: string;
      threadId: string;
      agentName: string;
      status: string;
      error: string | null;
      startedAt: Date | null;
      finishedAt: Date | null;
      createdAt: Date;
    }>;
  }): TaskSummary {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      sourceDiscussionId: task.sourceDiscussionId ?? null,
      sourceDiscussionTitle: task.sourceDiscussion?.title ?? null,
      summary: task.summary ?? null,
      runtimeJobs: (task.runtimeJobs ?? []).map((job) => ({
        id: job.id,
        taskId: job.taskId,
        employeeId: job.employeeId,
        threadId: job.threadId,
        agentName: job.agentName,
        status: job.status,
        error: job.error ?? null,
        startedAt: job.startedAt?.toISOString() ?? null,
        finishedAt: job.finishedAt?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString()
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };
  }

  async listProjectTasks(projectId: string): Promise<TaskSummary[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        sourceDiscussion: {
          select: { title: true }
        },
        runtimeJobs: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      }
    });

    return tasks.map((task) => this.toTaskSummary(task));
  }

  async createTask(projectId: string, input: CreateTaskInput): Promise<TaskSummary> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true }
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const task = await prisma.task.create({
      data: {
        tenantId: project.tenantId,
        projectId,
        title: input.title,
        description: input.description,
        sourceDiscussionId: input.sourceDiscussionId ?? null
      }
    });

    return this.getTask(task.id) as Promise<TaskSummary>;
  }

  async getTask(taskId: string): Promise<TaskSummary | null> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sourceDiscussion: {
          select: { title: true }
        },
        runtimeJobs: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!task) {
      return null;
    }

    return this.toTaskSummary(task);
  }

  async assignTask(taskId: string, employeeIds: string[]): Promise<TaskSummary | null> {
    await prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({
        where: { taskId }
      });

      for (const employeeId of employeeIds) {
        await tx.taskAssignment.create({
          data: {
            taskId,
            employeeId
          }
        });
      }
    });

    return this.getTask(taskId);
  }

  async createRuntimeJob(
    taskId: string,
    employeeId: string
  ): Promise<RuntimeJobSummary | null> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "running" }
    });

    const job = await prisma.runtimeJob.create({
      data: {
        tenantId: task.tenantId,
        taskId,
        employeeId,
        threadId: randomUUID(),
        agentName: employee.agentName,
        status: "queued"
      }
    });

    return {
      id: job.id,
      taskId: job.taskId,
      employeeId: job.employeeId,
      threadId: job.threadId,
      agentName: job.agentName,
      status: job.status,
      error: job.error ?? null,
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString()
    };
  }

  async listArtifacts(taskId: string): Promise<ArtifactSummary[]> {
    const artifacts = await prisma.artifact.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" }
    });

    return artifacts.map((artifact) => ({
      id: artifact.id,
      taskId: artifact.taskId,
      runtimeJobId: artifact.runtimeJobId,
      threadId: artifact.threadId,
      virtualPath: artifact.virtualPath,
      filename: artifact.filename,
      mimeType: artifact.mimeType ?? null,
      sizeBytes: artifact.sizeBytes?.toString() ?? null,
      createdAt: artifact.createdAt.toISOString()
    }));
  }

  async getArtifact(taskId: string, artifactId: string): Promise<ArtifactSummary | null> {
    const artifact = await prisma.artifact.findFirst({
      where: {
        id: artifactId,
        taskId
      }
    });

    if (!artifact) {
      return null;
    }

    return {
      id: artifact.id,
      taskId: artifact.taskId,
      runtimeJobId: artifact.runtimeJobId,
      threadId: artifact.threadId,
      virtualPath: artifact.virtualPath,
      filename: artifact.filename,
      mimeType: artifact.mimeType ?? null,
      sizeBytes: artifact.sizeBytes?.toString() ?? null,
      createdAt: artifact.createdAt.toISOString()
    };
  }
}
