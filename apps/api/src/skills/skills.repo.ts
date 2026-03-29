import { Injectable } from "@nestjs/common";
import { prisma } from "@openswarm/db";
import type {
  ProjectSkillAssignmentsResponse,
  SkillCatalogItem
} from "@openswarm/shared";

@Injectable()
export class SkillsRepo {
  async listSkills(): Promise<SkillCatalogItem[]> {
    const skills = await prisma.skill.findMany({
      where: { enabled: true },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      enabled: skill.enabled,
      source: skill.source
    }));
  }

  async getProjectSkillAssignments(
    projectId: string
  ): Promise<ProjectSkillAssignmentsResponse> {
    const employees = await prisma.projectEmployee.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      include: {
        employee: true
      }
    });

    const assignments = await prisma.employeeSkill.findMany({
      where: { projectId }
    });

    return {
      projectId,
      assignments: employees.map((link) => ({
        employeeId: link.employeeId,
        employeeName: link.employee.name,
        skillIds: assignments
          .filter((assignment) => assignment.employeeId === link.employeeId)
          .map((assignment) => assignment.skillId)
      }))
    };
  }

  async updateProjectSkillAssignments(
    projectId: string,
    updates: Array<{ employeeId: string; skillIds: string[] }>
  ): Promise<ProjectSkillAssignmentsResponse> {
    await prisma.$transaction(async (tx) => {
      await tx.employeeSkill.deleteMany({
        where: { projectId }
      });

      for (const assignment of updates) {
        for (const skillId of assignment.skillIds) {
          await tx.employeeSkill.create({
            data: {
              projectId,
              employeeId: assignment.employeeId,
              skillId
            }
          });
        }
      }
    });

    return this.getProjectSkillAssignments(projectId);
  }
}
