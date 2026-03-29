import { Body, Controller, Get, Put } from "@nestjs/common";
import type { ModelSettingsState, UpdateModelSettingsInput } from "@openswarm/shared";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("model")
  getModelSettings(): ModelSettingsState {
    return this.settingsService.getModelSettings();
  }

  @Put("model")
  updateModelSettings(@Body() input: UpdateModelSettingsInput): ModelSettingsState {
    return this.settingsService.updateModelSettings(input);
  }
}
