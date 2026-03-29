import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectsRepo } from "./projects.repo";

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepo]
})
export class ProjectsModule {}
