import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Prisma, prisma } from "@openswarm/db";
import { DeerFlowRuntimeClient } from "@openswarm/deerflow-adapter";
import {
  type DiscussionRunJob,
  type TaskRunJob,
  queueNames
} from "@openswarm/shared";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const deerFlowClient = new DeerFlowRuntimeClient({
  gatewayBaseUrl: process.env.DEERFLOW_GATEWAY_BASE_URL ?? "http://127.0.0.1:8001",
  langgraphBaseUrl: process.env.DEERFLOW_LANGGRAPH_BASE_URL ?? "http://127.0.0.1:2024"
});

function logWorkerEvent(event: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      scope: "openswarm-worker",
      event,
      ...payload
    })
  );
}

function inferMimeType(filename: string): string | null {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".pdf")) return "application/pdf";

  return null;
}

async function processDiscussionJob(job: { data: DiscussionRunJob }) {
  const discussion = await prisma.discussionSession.findUnique({
    where: { id: job.data.discussionId },
    include: {
      project: true,
      participants: {
        orderBy: { sortOrder: "asc" },
        include: {
          employee: true
        }
      }
    }
  });

  if (!discussion) {
    return { ok: false, reason: "discussion_not_found" };
  }

  const latestUserMessage = await prisma.discussionMessage.findFirst({
    where: {
      discussionId: discussion.id,
      senderType: "user"
    },
    orderBy: { createdAt: "desc" }
  });

  const promptSummary = latestUserMessage?.content ?? "请围绕项目目标继续协作。";
  const history = await prisma.discussionMessage.findMany({
    where: { discussionId: discussion.id },
    orderBy: { createdAt: "asc" }
  });
  let transcript = history
    .map((message) => `${message.senderType === "employee" ? "员工" : "用户"}(${message.senderId ?? "system"}): ${message.content}`)
    .join("\n");
  const summaryParts: string[] = [];

  for (let roundNo = 1; roundNo <= job.data.rounds; roundNo += 1) {
    for (const participant of discussion.participants) {
      const assignedSkills = await prisma.employeeSkill.findMany({
        where: {
          projectId: discussion.projectId,
          employeeId: participant.employeeId
        },
        include: {
          skill: true
        }
      });

      await deerFlowClient.createOrUpdateAgent({
        agentName: participant.employee.agentName,
        description: `${participant.employee.role}。${participant.employee.description}`,
        modelName: participant.employee.modelName,
        allowedSkills: assignedSkills.map((item) => item.skillId)
      });

      const response = await deerFlowClient.runAgent({
        agentName: participant.employee.agentName,
        threadId: `discussion-${discussion.id}-${participant.employeeId}`,
        modelName: participant.employee.modelName,
        metadata: {
          project_id: discussion.projectId,
          discussion_id: discussion.id,
          employee_id: participant.employeeId
        },
        message: [
          `你正在参与 OpenSwarm 项目讨论。`,
          `项目：${discussion.project.name}`,
          `讨论主题：${discussion.title || "未命名讨论"}`,
          `当前轮次：第 ${roundNo} 轮，共 ${job.data.rounds} 轮。`,
          `你的身份：${participant.employee.name}（${participant.employee.role}）。`,
          `你的技能：${assignedSkills.map((item) => item.skill.name).join("、") || "当前未分配明确技能"}`,
          "",
          "请阅读当前讨论上下文，并从你的角色出发给出一段简洁、专业、可执行的回应。",
          "要求：",
          "1. 直接回应当前需求，不要自我介绍过长。",
          "2. 如果前面已有其他员工发言，请在其基础上补充，不要重复。",
          "3. 回答控制在 120 字以内。",
          "",
          `当前用户需求：${promptSummary}`,
          "",
          "当前讨论记录：",
          transcript || "暂无"
        ].join("\n")
      });

      const content = response.outputText || `${participant.employee.name} 暂未返回有效内容。`;

      await prisma.discussionMessage.create({
        data: {
          discussionId: discussion.id,
          senderType: "employee",
          senderId: participant.employeeId,
          roundNo,
          content
        }
      });

      transcript = `${transcript}\n员工(${participant.employeeId}): ${content}`.trim();
      summaryParts.push(`${participant.employee.name}: ${content}`);
    }
  }

  await prisma.discussionSession.update({
    where: { id: discussion.id },
    data: {
      summary: summaryParts.slice(-discussion.participants.length).join(" "),
      updatedAt: new Date()
    }
  });

  return { ok: true };
}

async function processTaskJob(job: { data: TaskRunJob }) {
  const runtimeJob = await prisma.runtimeJob.findFirst({
    where: {
      taskId: job.data.taskId,
      employeeId: job.data.employeeId
    },
    orderBy: { createdAt: "desc" }
  });

  if (!runtimeJob) {
    return { ok: false, reason: "runtime_job_not_found" };
  }

  const hydratedJob = await prisma.runtimeJob.findUnique({
    where: { id: runtimeJob.id },
    include: {
      employee: true,
      task: {
        include: {
          project: true,
          sourceDiscussion: {
            include: {
              messages: {
                orderBy: { createdAt: "asc" }
              }
            }
          }
        }
      }
    }
  });

  if (!hydratedJob) {
    return { ok: false, reason: "runtime_job_hydration_failed" };
  }

  const assignedSkills = await prisma.employeeSkill.findMany({
    where: {
      projectId: hydratedJob.task.projectId,
      employeeId: hydratedJob.employeeId
    },
    include: {
      skill: true
    }
  });

  await deerFlowClient.createOrUpdateAgent({
    agentName: hydratedJob.employee.agentName,
    description: `${hydratedJob.employee.role}。${hydratedJob.employee.description}`,
    modelName: hydratedJob.employee.modelName,
    allowedSkills: assignedSkills.map((item) => item.skillId)
  });

  await prisma.runtimeJob.update({
    where: { id: hydratedJob.id },
    data: {
      status: "running",
      startedAt: hydratedJob.startedAt ?? new Date()
    }
  });

  try {
    const sourceDiscussion = hydratedJob.task.sourceDiscussion;
    const discussionSummary = sourceDiscussion?.summary?.trim() || "";
    const discussionTranscript = sourceDiscussion
      ? sourceDiscussion.messages
          .map((message) => {
            const sender =
              message.senderType === "employee"
                ? `员工(${message.senderId ?? "unknown"})`
                : message.senderType === "user"
                  ? "用户"
                  : message.senderType;

            return `${sender}: ${message.content}`;
          })
          .join("\n")
      : "";

    const response = await deerFlowClient.runAgent({
      agentName: hydratedJob.employee.agentName,
      threadId: hydratedJob.threadId,
      modelName: hydratedJob.employee.modelName,
      metadata: {
        project_id: hydratedJob.task.projectId,
        task_id: hydratedJob.taskId,
        employee_id: hydratedJob.employeeId
      },
      message: [
        `你正在执行 OpenSwarm 项目任务。`,
        `项目：${hydratedJob.task.project.name}`,
        `执行员工：${hydratedJob.employee.name}（${hydratedJob.employee.role}）`,
        `任务标题：${hydratedJob.task.title}`,
        `任务描述：${hydratedJob.task.description || "无额外描述"}`,
        `可用技能：${assignedSkills.map((item) => item.skill.name).join("、") || "当前未分配明确技能"}`,
        "",
        sourceDiscussion
          ? `关联讨论：${sourceDiscussion.title || "未命名讨论"}`
          : "当前任务没有关联讨论。",
        discussionSummary ? `讨论摘要：${discussionSummary}` : "",
        discussionTranscript ? `讨论记录：\n${discussionTranscript}` : "",
        "",
        "请根据任务给出一份高质量执行结果。",
        "如果你生成了文件，请使用 present_files 工具呈现。"
      ]
        .filter(Boolean)
        .join("\n")
    });

    const resolvedArtifacts =
      response.artifacts.length > 0
        ? response.artifacts
        : await deerFlowClient.listArtifacts(hydratedJob.threadId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.runtimeJob.update({
        where: { id: hydratedJob.id },
        data: {
          status: "completed",
          finishedAt: new Date(),
          error: null
        }
      });

      await tx.task.update({
        where: { id: hydratedJob.taskId },
        data: {
          status: "done",
          summary: response.outputText || "DeerFlow 已完成任务。"
        }
      });

      await tx.artifact.deleteMany({
        where: {
          runtimeJobId: hydratedJob.id
        }
      });

      for (const artifact of resolvedArtifacts) {
        await tx.artifact.create({
          data: {
            tenantId: hydratedJob.tenantId,
            taskId: hydratedJob.taskId,
            runtimeJobId: hydratedJob.id,
            threadId: artifact.threadId,
            virtualPath: artifact.virtualPath,
            filename: artifact.filename,
            mimeType: inferMimeType(artifact.filename)
          }
        });
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DeerFlow runtime error";

    logWorkerEvent("task.failed", {
      taskId: hydratedJob.taskId,
      employeeId: hydratedJob.employeeId,
      threadId: hydratedJob.threadId,
      error: message
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.runtimeJob.update({
        where: { id: hydratedJob.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          error: message
        }
      });

      await tx.task.update({
        where: { id: hydratedJob.taskId },
        data: {
          status: "failed",
          summary: message
        }
      });
    });

    throw error;
  }

  return { ok: true };
}

const discussionsWorker = new Worker<DiscussionRunJob>(
  queueNames.discussions,
  async (job) => {
    logWorkerEvent("discussion.processing", {
      bullmqJobId: job.id,
      discussionId: job.data.discussionId,
      rounds: job.data.rounds
    });
    return processDiscussionJob(job);
  },
  { connection }
);

const tasksWorker = new Worker<TaskRunJob>(
  queueNames.tasks,
  async (job) => {
    logWorkerEvent("task.processing", {
      bullmqJobId: job.id,
      taskId: job.data.taskId,
      employeeId: job.data.employeeId
    });
    return processTaskJob(job);
  },
  { connection }
);

discussionsWorker.on("completed", (job) => {
  logWorkerEvent("discussion.completed", {
    bullmqJobId: job.id
  });
});

tasksWorker.on("completed", (job) => {
  logWorkerEvent("task.completed", {
    bullmqJobId: job.id
  });
});

console.log("OpenSwarm worker bootstrap ready");
