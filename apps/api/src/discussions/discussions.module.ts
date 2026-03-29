import { Module } from "@nestjs/common";
import { DiscussionsController } from "./discussions.controller";
import { DiscussionsService } from "./discussions.service";
import { DiscussionsRepo } from "./discussions.repo";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [QueueModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService, DiscussionsRepo]
})
export class DiscussionsModule {}
