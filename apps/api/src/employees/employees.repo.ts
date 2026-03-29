import { Injectable } from "@nestjs/common";
import { prisma } from "@openswarm/db";
import type { EmployeeCatalogItem } from "@openswarm/shared";

@Injectable()
export class EmployeesRepo {
  async listCatalog(): Promise<EmployeeCatalogItem[]> {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "asc" }
    });

    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      description: employee.description,
      defaultModel: employee.modelName ?? "gpt-5.4"
    }));
  }
}
