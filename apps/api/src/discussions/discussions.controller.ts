import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type {
  CreateDiscussionInput,
  CreateDiscussionMessageInput,
  DiscussionMessageItem,
  RunDiscussionInput,
  DiscussionSessionSummary
} from "@openswarm/shared";
import { DiscussionsService } from "./discussions.service";

@Controller()
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get("projects/:projectId/discussions")
  async listProjectDiscussions(
    @Param("projectId") projectId: string
  ): Promise<DiscussionSessionSummary[]> {
    return this.discussionsService.listProjectDiscussions(projectId);
  }

  @Post("projects/:projectId/discussions")
  async createDiscussion(
    @Param("projectId") projectId: string,
    @Body() body: CreateDiscussionInput
  ): Promise<DiscussionSessionSummary> {
    return this.discussionsService.createDiscussion(projectId, body);
  }

  @Get("discussions/:discussionId/messages")
  async listDiscussionMessages(
    @Param("discussionId") discussionId: string
  ): Promise<DiscussionMessageItem[]> {
    return this.discussionsService.listDiscussionMessages(discussionId);
  }

  @Post("discussions/:discussionId/messages")
  async createDiscussionMessage(
    @Param("discussionId") discussionId: string,
    @Body() body: CreateDiscussionMessageInput
  ): Promise<DiscussionMessageItem> {
    return this.discussionsService.createDiscussionMessage(
      discussionId,
      body.content ?? ""
    );
  }

  @Post("discussions/:discussionId/run")
  async runDiscussion(
    @Param("discussionId") discussionId: string,
    @Body() body: RunDiscussionInput
  ): Promise<{ discussionId: string; status: string }> {
    return this.discussionsService.enqueueDiscussionRun(
      discussionId,
      body.rounds ?? 1
    );
  }
}
