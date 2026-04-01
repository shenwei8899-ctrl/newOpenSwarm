import { Module } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module";
import { AutonomyController } from "./autonomy.controller";
import { AutonomyPlannerService } from "./autonomy-planner.service";
import { AutonomyRepo } from "./autonomy.repo";
import { AutonomyService } from "./autonomy.service";

@Module({
  imports: [QueueModule],
  controllers: [AutonomyController],
  providers: [AutonomyRepo, AutonomyPlannerService, AutonomyService]
})
export class AutonomyModule {}
