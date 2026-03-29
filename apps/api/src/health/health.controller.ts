import { Controller, Get } from "@nestjs/common";
import type { AppHealth } from "@openswarm/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): AppHealth {
    return { ok: true, service: "api" };
  }
}
