import { Injectable } from "@nestjs/common";
import { prisma } from "@openswarm/db";
import type {
  CreateDiscussionInput,
  DiscussionMessageItem,
  DiscussionSessionSummary
} from "@openswarm/shared";

@Injectable()
export class DiscussionsRepo {
  async listProjectDiscussions(
    projectId: string
  ): Promise<DiscussionSessionSummary[]> {
    const discussions = await prisma.discussionSession.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: true
      }
    });

    return discussions.map((discussion) => ({
      id: discussion.id,
      projectId: discussion.projectId,
      title: discussion.title,
      mode: discussion.mode,
      status: discussion.status,
      summary: discussion.summary,
      participantEmployeeIds: discussion.participants.map((p) => p.employeeId),
      createdAt: discussion.createdAt.toISOString(),
      updatedAt: discussion.updatedAt.toISOString()
    }));
  }

  async createDiscussion(
    projectId: string,
    input: CreateDiscussionInput
  ): Promise<DiscussionSessionSummary> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true }
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const discussion = await prisma.discussionSession.create({
      data: {
        projectId,
        tenantId: project.tenantId,
        title: input.title,
        mode: input.mode,
        participants: {
          create: input.participantEmployeeIds.map((employeeId, index) => ({
            employeeId,
            sortOrder: index
          }))
        }
      },
      include: {
        participants: true
      }
    });

    return {
      id: discussion.id,
      projectId: discussion.projectId,
      title: discussion.title,
      mode: discussion.mode,
      status: discussion.status,
      summary: discussion.summary,
      participantEmployeeIds: discussion.participants.map((p) => p.employeeId),
      createdAt: discussion.createdAt.toISOString(),
      updatedAt: discussion.updatedAt.toISOString()
    };
  }

  async listDiscussionMessages(
    discussionId: string
  ): Promise<DiscussionMessageItem[]> {
    const messages = await prisma.discussionMessage.findMany({
      where: { discussionId },
      orderBy: { createdAt: "asc" }
    });

    return messages.map((message) => ({
      id: message.id,
      discussionId: message.discussionId,
      senderType: message.senderType as DiscussionMessageItem["senderType"],
      senderId: message.senderId ?? null,
      roundNo: message.roundNo,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }));
  }

  async createUserMessage(
    discussionId: string,
    content: string
  ): Promise<DiscussionMessageItem> {
    const message = await prisma.discussionMessage.create({
      data: {
        discussionId,
        senderType: "user",
        content,
        roundNo: 0
      }
    });

    return {
      id: message.id,
      discussionId: message.discussionId,
      senderType: "user",
      senderId: message.senderId ?? null,
      roundNo: message.roundNo,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    };
  }

  async deleteDiscussion(discussionId: string): Promise<void> {
    await prisma.discussionSession.delete({
      where: { id: discussionId }
    });
  }
}
