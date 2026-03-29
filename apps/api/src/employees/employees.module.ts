import { Module } from "@nestjs/common";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { EmployeesRepo } from "./employees.repo";

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesRepo]
})
export class EmployeesModule {}
