import { Controller, Get } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import type { EmployeeCatalogItem } from "@openswarm/shared";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get("catalog")
  async listCatalog(): Promise<EmployeeCatalogItem[]> {
    return this.employeesService.listCatalog();
  }
}
