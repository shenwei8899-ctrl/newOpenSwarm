import * as fs from "node:fs";
import * as path from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), "..", "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function bootstrap() {
  loadLocalEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(3001);
}

void bootstrap();
