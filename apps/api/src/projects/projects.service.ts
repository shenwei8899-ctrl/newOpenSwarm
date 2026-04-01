import { Injectable } from "@nestjs/common";
import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectEmployeeItem,
  ProjectSummary
} from "@openswarm/shared";
import { ProjectsRepo } from "./projects.repo";

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepo: ProjectsRepo) {}

  async listProjects(): Promise<ProjectSummary[]> {
    return this.projectsRepo.listProjects();
  }

  async createProject(input: CreateProjectInput): Promise<ProjectSummary> {
    return this.projectsRepo.createProject(input);
  }

  async getProject(projectId: string): Promise<ProjectDetail | null> {
    return this.projectsRepo.getProject(projectId);
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.projectsRepo.deleteProject(projectId);
  }

  async listProjectEmployees(projectId: string): Promise<ProjectEmployeeItem[]> {
    return this.projectsRepo.listProjectEmployees(projectId);
  }

  async updateProjectEmployees(
    projectId: string,
    employeeIds: string[]
  ): Promise<ProjectEmployeeItem[]> {
    return this.projectsRepo.updateProjectEmployees(projectId, employeeIds);
  }
}
