import { Injectable } from "@nestjs/common";
import { prisma } from "@openswarm/db";
import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectEmployeeItem,
  ProjectSummary
} from "@openswarm/shared";

@Injectable()
export class ProjectsRepo {
  async createProject(input: CreateProjectInput): Promise<ProjectSummary> {
    const tenant =
      (await prisma.tenant.findFirst({
        where: { slug: "demo" }
      })) ??
      (await prisma.tenant.findFirst());

    if (!tenant) {
      throw new Error("No tenant available for project creation.");
    }

    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: input.name,
        templateId: input.templateId ?? null,
        status: "active"
      }
    });

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      employeeCount: 0,
      activeTaskCount: 0,
      lastDiscussionAt: null
    };
  }

  async getProject(projectId: string): Promise<ProjectDetail | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        employeeLinks: true,
        discussions: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1
        },
        tasks: {
          where: {
            status: {
              in: ["queued", "running", "blocked"]
            }
          },
          select: { id: true }
        }
      }
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      employeeCount: project.employeeLinks.length,
      activeTaskCount: project.tasks.length,
      lastDiscussionAt: project.discussions[0]?.updatedAt.toISOString() ?? null
    };
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employeeLinks: true,
        discussions: {
          select: {
            updatedAt: true
          },
          orderBy: { updatedAt: "desc" },
          take: 1
        },
        tasks: {
          where: {
            status: {
              in: ["queued", "running", "blocked"]
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      employeeCount: project.employeeLinks.length,
      activeTaskCount: project.tasks.length,
      lastDiscussionAt: project.discussions[0]?.updatedAt.toISOString() ?? null
    }));
  }

  async deleteProject(projectId: string): Promise<void> {
    await prisma.project.delete({
      where: { id: projectId }
    });
  }

  async listProjectEmployees(projectId: string): Promise<ProjectEmployeeItem[]> {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        projectLinks: {
          where: { projectId }
        }
      }
    });

    return employees.map((employee) => {
      const link = employee.projectLinks[0];

      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        description: employee.description,
        defaultModel: employee.modelName ?? "gpt-5.4",
        selected: Boolean(link),
        sortOrder: link?.sortOrder ?? null
      };
    });
  }

  async updateProjectEmployees(
    projectId: string,
    employeeIds: string[]
  ): Promise<ProjectEmployeeItem[]> {
    await prisma.$transaction(async (tx) => {
      await tx.projectEmployee.deleteMany({
        where: { projectId }
      });

      for (const [index, employeeId] of employeeIds.entries()) {
        await tx.projectEmployee.create({
          data: {
            projectId,
            employeeId,
            sortOrder: index
          }
        });
      }
    });

    return this.listProjectEmployees(projectId);
  }
}
