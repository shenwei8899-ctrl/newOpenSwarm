import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { TasksRepo } from "./tasks.repo";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [QueueModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepo]
})
export class TasksModule {}
