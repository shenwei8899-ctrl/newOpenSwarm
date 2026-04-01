import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Prisma, prisma } from "@openswarm/db";
import { DeerFlowRuntimeClient } from "@openswarm/deerflow-adapter";
import {
  type AutonomyStepJob,
  type DiscussionRunJob,
  type TaskRunJob,
  queueNames
} from "@openswarm/shared";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const deerFlowClient = new DeerFlowRuntimeClient({
  gatewayBaseUrl: process.env.DEERFLOW_GATEWAY_BASE_URL ?? "http://127.0.0.1:8001",
  langgraphBaseUrl: process.env.DEERFLOW_LANGGRAPH_BASE_URL ?? "http://127.0.0.1:2024",
  runTimeoutMs: Number(process.env.DEERFLOW_RUN_TIMEOUT_MS ?? 180000),
  recursionLimit: Number(process.env.DEERFLOW_RECURSION_LIMIT ?? 100)
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

type ParsedAutonomyResult = {
  status: "completed" | "handoff" | "blocked";
  artifacts: string[];
  handoffTo: string | null;
  handoffMessage: string | null;
  needsYin: boolean;
  taskDone: boolean;
};

async function processAutonomyStepJob(job: { data: AutonomyStepJob }) {
  const step = await prisma.autonomyStep.findUnique({
    where: { id: job.data.stepId },
    include: {
      run: {
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
      },
      ownerEmployee: true
    }
  });

  if (!step || step.runId !== job.data.runId) {
    return { ok: false, reason: "autonomy_step_not_found" };
  }

  if (!["ready", "running"].includes(step.status)) {
    return { ok: false, reason: "autonomy_step_not_ready" };
  }

  const assignedSkills = await prisma.employeeSkill.findMany({
    where: {
      projectId: step.run.projectId,
      employeeId: step.ownerEmployeeId
    },
    include: {
      skill: true
    }
  });

  await deerFlowClient.createOrUpdateAgent({
    agentName: step.ownerEmployee.agentName,
    description: `${step.ownerEmployee.role}。${step.ownerEmployee.description}`,
    modelName: step.ownerEmployee.modelName,
    allowedSkills: assignedSkills.map((item) => item.skillId)
  });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.autonomyStep.update({
      where: { id: step.id },
      data: {
        status: "running",
        startedAt: step.startedAt ?? new Date()
      }
    });

    await tx.autonomyRun.update({
      where: { id: step.runId },
      data: {
        status: "running",
        currentEmployeeId: step.ownerEmployeeId,
        lastError: null
      }
    });

    await tx.autonomyEvent.create({
      data: {
        runId: step.runId,
        stepId: step.id,
        type: "step_started",
        agentId: step.ownerEmployeeId,
        message: `${step.ownerEmployee.name} 开始执行“${step.title}”。`,
        metadata: {
          stepKey: step.stepKey
        }
      }
    });
  });

  try {
    const previousSteps = await prisma.autonomyStep.findMany({
      where: {
        runId: step.runId,
        stepIndex: {
          lt: step.stepIndex
        }
      },
      orderBy: { stepIndex: "asc" },
      include: {
        ownerEmployee: true
      }
    });

    const response = await deerFlowClient.runAgent({
      agentName: step.ownerEmployee.agentName,
      threadId: `autonomy-${step.runId}-${step.id}`,
      modelName: step.ownerEmployee.modelName,
      metadata: {
        project_id: step.run.projectId,
        autonomy_run_id: step.runId,
        autonomy_step_id: step.id,
        employee_id: step.ownerEmployeeId
      },
      message: buildAutonomyStepPrompt({
        projectName: step.run.project.name,
        runTitle: step.run.title,
        runGoal: step.run.goal,
        stepTitle: step.title,
        stepGoal: step.goal,
        employeeName: step.ownerEmployee.name,
        employeeRole: step.ownerEmployee.role,
        skills: assignedSkills.map((item) => item.skill.name),
        sourceDiscussionSummary: step.run.sourceDiscussion?.summary ?? null,
        sourceDiscussionTranscript: step.run.sourceDiscussion
          ? step.run.sourceDiscussion.messages
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
          : null,
        previousSteps: previousSteps.map((previousStep) => ({
          title: previousStep.title,
          owner: previousStep.ownerEmployee.name,
          summary: previousStep.outputSummary ?? "暂无总结"
        }))
      })
    });

    const parsed = parseAutonomyResult(response.outputText);
    const stepSummary = stripAutonomyResultBlock(response.outputText) || `${step.ownerEmployee.name} 已完成当前步骤。`;
    const resolvedArtifacts =
      response.artifacts.length > 0
        ? response.artifacts
        : await deerFlowClient.listArtifacts(response.threadId);
    const artifactPaths = resolvedArtifacts.map((artifact) => artifact.virtualPath);

    const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const linkedTaskId = step.run.sourceTaskId;
      const stepRuntimeJob = linkedTaskId
        ? await tx.runtimeJob.create({
            data: {
              tenantId: step.run.tenantId,
              taskId: linkedTaskId,
              employeeId: step.ownerEmployeeId,
              threadId: response.threadId,
              agentName: step.ownerEmployee.agentName,
              status: parsed.needsYin || parsed.status === "blocked" ? "failed" : "completed",
              error: parsed.needsYin || parsed.status === "blocked"
                ? parsed.handoffMessage ?? null
                : null,
              startedAt: step.startedAt ?? new Date(),
              finishedAt: new Date()
            }
          })
        : null;

      await tx.autonomyStep.update({
        where: { id: step.id },
        data: {
          status: parsed.status === "blocked" ? "blocked" : "done",
          outputSummary: stepSummary,
          artifacts: artifactPaths,
          handoffTo: parsed.handoffTo,
          handoffMessage: parsed.handoffMessage,
          runtimeJobId: stepRuntimeJob?.id ?? response.threadId,
          finishedAt: new Date()
        }
      });

      if (linkedTaskId && stepRuntimeJob) {
        for (const artifact of resolvedArtifacts) {
          await tx.artifact.create({
            data: {
              tenantId: step.run.tenantId,
              taskId: linkedTaskId,
              runtimeJobId: stepRuntimeJob.id,
              threadId: artifact.threadId,
              virtualPath: artifact.virtualPath,
              filename: artifact.filename,
              mimeType: inferMimeType(artifact.filename)
            }
          });
        }
      }

      await tx.autonomyEvent.create({
        data: {
          runId: step.runId,
          stepId: step.id,
          type: parsed.status === "handoff" ? "handoff" : "step_completed",
          agentId: step.ownerEmployeeId,
          message:
            parsed.status === "handoff"
              ? parsed.handoffMessage ?? `${step.ownerEmployee.name} 已交接下一棒。`
              : `${step.ownerEmployee.name} 已完成“${step.title}”。`,
          metadata: {
            handoffTo: parsed.handoffTo,
            artifacts: artifactPaths
          }
        }
      });

      if (parsed.needsYin || parsed.status === "blocked") {
        await tx.autonomyRun.update({
          where: { id: step.runId },
          data: {
            status: "needs_yin",
            lastError: parsed.handoffMessage ?? "当前步骤需要主控仲裁。",
            summary: stepSummary
          }
        });

        if (linkedTaskId) {
          await tx.task.update({
            where: { id: linkedTaskId },
            data: {
              status: "needs_yin",
              summary: stepSummary
            }
          });
        }

        await tx.autonomyEvent.create({
          data: {
            runId: step.runId,
            stepId: step.id,
            type: "needs_yin",
            agentId: step.ownerEmployeeId,
            message: parsed.handoffMessage ?? "当前步骤进入主控仲裁。",
            metadata: {}
          }
        });
        return {
          enqueueNextSteps: [] as AutonomyStepJob[]
        };
      }

      const allSteps = await tx.autonomyStep.findMany({
        where: { runId: step.runId },
        orderBy: { stepIndex: "asc" }
      });

      const completedStepKeys = new Set(
        allSteps
          .filter((item) => item.status === "done" || item.id === step.id)
          .map((item) => item.stepKey)
      );

      const newlyReadySteps = allSteps.filter((item) => {
        if (item.status !== "queued") {
          return false;
        }

        const deps = Array.isArray(item.dependsOn) ? (item.dependsOn as string[]) : [];
        return deps.every((dep) => completedStepKeys.has(dep));
      });

      const prioritizedReadySteps = sortReadySteps(newlyReadySteps, parsed.handoffTo);

      const finishedStepsCount =
        allSteps.filter((item) => item.status === "done" || item.status === "completed").length;
      const totalSteps = allSteps.length;
      const hasRemainingUnfinishedSteps = allSteps.some((item) => {
        if (item.id === step.id) {
          return false;
        }

        return ["queued", "ready", "running"].includes(item.status);
      });

      if (finishedStepsCount >= totalSteps || (parsed.taskDone && !hasRemainingUnfinishedSteps)) {
        const completionTime = new Date();

        await tx.autonomyStep.updateMany({
          where: {
            runId: step.runId,
            status: {
              in: ["queued", "ready", "running"]
            }
          },
          data: {
            status: "completed",
            finishedAt: completionTime
          }
        });

        await tx.autonomyRun.update({
          where: { id: step.runId },
          data: {
            status: "completed",
            summary: stepSummary,
            currentEmployeeId: null
          }
        });

        if (linkedTaskId) {
          await tx.task.update({
            where: { id: linkedTaskId },
            data: {
              status: "done",
              summary: stepSummary
            }
          });
        }

        return {
          enqueueNextSteps: [] as AutonomyStepJob[]
        };
      } else {
        const now = new Date();
        const runningReadySteps: AutonomyStepJob[] = [];

        for (const readyStep of prioritizedReadySteps) {
          await tx.autonomyStep.update({
            where: { id: readyStep.id },
            data: {
              status: "running",
              startedAt: readyStep.startedAt ?? now
            }
          });

          runningReadySteps.push({
            runId: step.runId,
            stepId: readyStep.id
          });
        }

        await tx.autonomyRun.update({
          where: { id: step.runId },
          data: {
            status: "running",
            summary: stepSummary,
            currentEmployeeId:
              prioritizedReadySteps.length === 1
                ? prioritizedReadySteps[0]?.ownerEmployeeId ?? null
                : null
          }
        });

        if (linkedTaskId) {
          await tx.task.update({
            where: { id: linkedTaskId },
            data: {
              status: "running",
              summary: stepSummary
            }
          });
        }

        return {
          enqueueNextSteps: runningReadySteps
        };
      }
    });

    return {
      ok: true,
      enqueueNextSteps: transactionResult.enqueueNextSteps
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown autonomy worker error";

    logWorkerEvent("autonomy.failed", {
      runId: step.runId,
      stepId: step.id,
      employeeId: step.ownerEmployeeId,
      error: message
    });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.autonomyStep.update({
        where: { id: step.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          outputSummary: message
        }
      });

      await tx.autonomyRun.update({
        where: { id: step.runId },
        data: {
          status: "needs_yin",
          lastError: message
        }
      });

      if (step.run.sourceTaskId) {
        await tx.task.update({
          where: { id: step.run.sourceTaskId },
          data: {
            status: "needs_yin",
            summary: message
          }
        });
      }

      await tx.autonomyEvent.create({
        data: {
          runId: step.runId,
          stepId: step.id,
          type: "needs_yin",
          agentId: step.ownerEmployeeId,
          message,
          metadata: {
            error: message
          }
        }
      });
    });

    throw error;
  }
}

function sortReadySteps<
  T extends {
    ownerEmployeeId: string;
  }
>(steps: T[], preferredEmployeeId: string | null) {
  if (!preferredEmployeeId) {
    return steps;
  }

  return [...steps].sort((a, b) => {
    if (a.ownerEmployeeId === preferredEmployeeId && b.ownerEmployeeId !== preferredEmployeeId) {
      return -1;
    }

    if (b.ownerEmployeeId === preferredEmployeeId && a.ownerEmployeeId !== preferredEmployeeId) {
      return 1;
    }

    return 0;
  });
}

function buildAutonomyStepPrompt(input: {
  projectName: string;
  runTitle: string;
  runGoal: string;
  stepTitle: string;
  stepGoal: string;
  employeeName: string;
  employeeRole: string;
  skills: string[];
  sourceDiscussionSummary: string | null;
  sourceDiscussionTranscript: string | null;
  previousSteps: Array<{ title: string; owner: string; summary: string }>;
}) {
  const shouldCreateDeliverableFile = /markdown|\.md|文档|报告|成稿|文件|交付/i.test(
    `${input.runGoal}\n${input.stepGoal}`
  );

  const previousSummary =
    input.previousSteps.length > 0
      ? input.previousSteps
          .map(
            (step, index) =>
              `${index + 1}. ${step.title} / ${step.owner}: ${step.summary}`
          )
          .join("\n")
      : "暂无上游步骤输出。";

  return [
    "你正在执行 OpenSwarm 的自治接力步骤。",
    `项目：${input.projectName}`,
    `自治任务：${input.runTitle}`,
    `整体目标：${input.runGoal}`,
    `当前步骤：${input.stepTitle}`,
    `当前步骤目标：${input.stepGoal}`,
    `当前执行员工：${input.employeeName}（${input.employeeRole}）`,
    `可用技能：${input.skills.join("、") || "未分配明确技能"}`,
    "",
    input.sourceDiscussionSummary ? `源讨论摘要：${input.sourceDiscussionSummary}` : "",
    input.sourceDiscussionTranscript ? `源讨论记录：\n${input.sourceDiscussionTranscript}` : "",
    "",
    `上游步骤输出：\n${previousSummary}`,
    "",
    input.sourceDiscussionSummary || input.sourceDiscussionTranscript
      ? "如果现有讨论和上游步骤已经足够支撑当前棒次，请优先基于已有上下文完成，不要因为缺少外部检索而卡住。只有当缺少关键信息且无法合理推进时，才进入 blocked 或 needs_yin。"
      : "",
    shouldCreateDeliverableFile
      ? "如果当前棒次已经具备交付条件，请创建一个 markdown 文件，并使用 present_files 呈现该文件。请把文件路径写入 autonomy_result.artifacts。"
      : "",
    "请只完成你这一棒最适合的部分，不要越界包办整个任务。",
    "先输出一段简洁的自然语言总结，然后在最后输出结构化自治结果：",
    '<autonomy_result>{"status":"completed|handoff|blocked","artifacts":[],"handoff_to":null,"handoff_message":null,"needs_yin":false,"task_done":false}</autonomy_result>'
  ]
    .filter(Boolean)
    .join("\n");
}

function parseAutonomyResult(outputText: string): ParsedAutonomyResult {
  const match = outputText.match(/<autonomy_result>([\s\S]*?)<\/autonomy_result>/i);

  if (!match) {
    return {
      status: "completed",
      artifacts: [],
      handoffTo: null,
      handoffMessage: null,
      needsYin: false,
      taskDone: false
    };
  }

  try {
    const parsed = JSON.parse(match[1] ?? "{}") as Partial<ParsedAutonomyResult>;
    return {
      status:
        parsed.status === "handoff" || parsed.status === "blocked"
          ? parsed.status
          : "completed",
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
      handoffTo: parsed.handoffTo ?? null,
      handoffMessage: parsed.handoffMessage ?? null,
      needsYin: Boolean(parsed.needsYin),
      taskDone: Boolean(parsed.taskDone)
    };
  } catch {
    return {
      status: "completed",
      artifacts: [],
      handoffTo: null,
      handoffMessage: null,
      needsYin: false,
      taskDone: false
    };
  }
}

function stripAutonomyResultBlock(outputText: string) {
  return outputText
    .replace(/<autonomy_result>[\s\S]*?<\/autonomy_result>/gi, "")
    .trim();
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

const autonomyWorker = new Worker<AutonomyStepJob>(
  queueNames.autonomy,
  async (job) => {
    logWorkerEvent("autonomy.processing", {
      bullmqJobId: job.id,
      runId: job.data.runId,
      stepId: job.data.stepId
    });

    const result = await processAutonomyStepJob(job);

    if (
      result &&
      typeof result === "object" &&
      "enqueueNextSteps" in result &&
      Array.isArray(result.enqueueNextSteps) &&
      result.enqueueNextSteps.length > 0
    ) {
      const autonomyQueue = new (await import("bullmq")).Queue<AutonomyStepJob>(
        queueNames.autonomy,
        { connection }
      );
      for (const nextStep of result.enqueueNextSteps) {
        await autonomyQueue.add("run-autonomy-step", nextStep);
      }
    }

    return result;
  },
  {
    connection,
    concurrency: 4
  }
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

autonomyWorker.on("completed", (job) => {
  logWorkerEvent("autonomy.completed", {
    bullmqJobId: job.id
  });
});

console.log("OpenSwarm worker bootstrap ready");
