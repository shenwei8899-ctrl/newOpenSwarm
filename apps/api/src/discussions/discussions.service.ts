import { Injectable } from "@nestjs/common";
import type {
  CreateDiscussionInput,
  DiscussionMessageItem,
  DiscussionSessionSummary
} from "@openswarm/shared";
import { DiscussionsRepo } from "./discussions.repo";
import { QueueService } from "../queue/queue.service";

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly discussionsRepo: DiscussionsRepo,
    private readonly queueService: QueueService
  ) {}

  async listProjectDiscussions(
    projectId: string
  ): Promise<DiscussionSessionSummary[]> {
    return this.discussionsRepo.listProjectDiscussions(projectId);
  }

  async createDiscussion(
    projectId: string,
    input: CreateDiscussionInput
  ): Promise<DiscussionSessionSummary> {
    return this.discussionsRepo.createDiscussion(projectId, input);
  }

  async listDiscussionMessages(
    discussionId: string
  ): Promise<DiscussionMessageItem[]> {
    return this.discussionsRepo.listDiscussionMessages(discussionId);
  }

  async createDiscussionMessage(
    discussionId: string,
    content: string
  ): Promise<DiscussionMessageItem> {
    return this.discussionsRepo.createUserMessage(discussionId, content);
  }

  async enqueueDiscussionRun(
    discussionId: string,
    rounds: number
  ): Promise<{ discussionId: string; status: string }> {
    await this.queueService.enqueueDiscussionRun({
      discussionId,
      rounds
    });

    return {
      discussionId,
      status: "queued"
    };
  }
}
