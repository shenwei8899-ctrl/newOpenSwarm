import { Module } from "@nestjs/common";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";
import { SkillsRepo } from "./skills.repo";

@Module({
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepo]
})
export class SkillsModule {}
