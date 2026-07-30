import "server-only";

import { getObservabilityEnv } from "@/configs/env";
import { redactLogValue } from "@/lib/observability/redaction";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const config = getObservabilityEnv();
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[config.logLevel]) return;

  const entry = redactLogValue({
    timestamp: new Date().toISOString(),
    level,
    service: config.serviceName,
    environment: process.env.NODE_ENV ?? "unknown",
    event,
    ...context,
  });
  const serialized = JSON.stringify(entry);

  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else if (level === "debug") console.debug(serialized);
  else console.info(serialized);
}

export const logger = {
  debug: (event: string, context?: LogContext) => write("debug", event, context),
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};

