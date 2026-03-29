import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { ProjectsModule } from "./projects/projects.module";
import { EmployeesModule } from "./employees/employees.module";
import { SkillsModule } from "./skills/skills.module";
import { DiscussionsModule } from "./discussions/discussions.module";
import { TasksModule } from "./tasks/tasks.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    ProjectsModule,
    EmployeesModule,
    SkillsModule,
    DiscussionsModule,
    TasksModule,
    SettingsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
