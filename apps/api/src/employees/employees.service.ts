import { Injectable } from "@nestjs/common";
import type { EmployeeCatalogItem } from "@openswarm/shared";
import { EmployeesRepo } from "./employees.repo";

@Injectable()
export class EmployeesService {
  constructor(private readonly employeesRepo: EmployeesRepo) {}

  async listCatalog(): Promise<EmployeeCatalogItem[]> {
    return this.employeesRepo.listCatalog();
  }
}
