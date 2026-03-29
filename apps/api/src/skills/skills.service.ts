import { Injectable } from "@nestjs/common";
import type {
  ProjectSkillAssignmentsResponse,
  SkillCatalogItem
} from "@openswarm/shared";
import { SkillsRepo } from "./skills.repo";

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepo: SkillsRepo) {}

  async listSkills(): Promise<SkillCatalogItem[]> {
    return this.skillsRepo.listSkills();
  }

  async getProjectSkillAssignments(
    projectId: string
  ): Promise<ProjectSkillAssignmentsResponse> {
    return this.skillsRepo.getProjectSkillAssignments(projectId);
  }

  async updateProjectSkillAssignments(
    projectId: string,
    updates: Array<{ employeeId: string; skillIds: string[] }>
  ): Promise<ProjectSkillAssignmentsResponse> {
    return this.skillsRepo.updateProjectSkillAssignments(projectId, updates);
  }
}
