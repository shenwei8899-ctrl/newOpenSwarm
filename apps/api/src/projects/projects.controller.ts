import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectEmployeeItem,
  ProjectSummary,
  UpdateProjectEmployeesInput
} from "@openswarm/shared";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async listProjects(): Promise<ProjectSummary[]> {
    return this.projectsService.listProjects();
  }

  @Post()
  async createProject(@Body() body: CreateProjectInput): Promise<ProjectSummary> {
    return this.projectsService.createProject(body);
  }

  @Get(":projectId")
  async getProject(@Param("projectId") projectId: string): Promise<ProjectDetail | null> {
    return this.projectsService.getProject(projectId);
  }

  @Get(":projectId/employees")
  async listProjectEmployees(
    @Param("projectId") projectId: string
  ): Promise<ProjectEmployeeItem[]> {
    return this.projectsService.listProjectEmployees(projectId);
  }

  @Put(":projectId/employees")
  async updateProjectEmployees(
    @Param("projectId") projectId: string,
    @Body() body: UpdateProjectEmployeesInput
  ): Promise<ProjectEmployeeItem[]> {
    return this.projectsService.updateProjectEmployees(projectId, body.employeeIds ?? []);
  }
}
