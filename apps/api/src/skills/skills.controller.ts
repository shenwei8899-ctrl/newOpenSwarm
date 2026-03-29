import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { SkillsService } from "./skills.service";
import type {
  ProjectSkillAssignmentsResponse,
  SkillCatalogItem,
  UpdateProjectSkillAssignmentsInput
} from "@openswarm/shared";

@Controller()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get("skills")
  async listSkills(): Promise<SkillCatalogItem[]> {
    return this.skillsService.listSkills();
  }

  @Get("projects/:projectId/skill-assignments")
  async getProjectSkillAssignments(
    @Param("projectId") projectId: string
  ): Promise<ProjectSkillAssignmentsResponse> {
    return this.skillsService.getProjectSkillAssignments(projectId);
  }

  @Put("projects/:projectId/skill-assignments")
  async updateProjectSkillAssignments(
    @Param("projectId") projectId: string,
    @Body() body: UpdateProjectSkillAssignmentsInput
  ): Promise<ProjectSkillAssignmentsResponse> {
    return this.skillsService.updateProjectSkillAssignments(
      projectId,
      body.assignments ?? []
    );
  }
}
