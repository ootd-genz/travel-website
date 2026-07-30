import "server-only";

import { getObservabilityEnv } from "@/configs/env";
import { logger } from "@/lib/observability/logger";
import { sanitizeLogString } from "@/lib/observability/redaction";

type RequestErrorInput = {
  error: Error & { digest?: string };
  request: { path: string; method: string };
  context: {
    routePath: string;
    routeType: string;
    routerKind: string;
  };
};

function safePath(path: string) {
  return sanitizeLogString(path.split("?")[0] ?? "/").slice(0, 500);
}

export async function reportUnhandledRequestError(input: RequestErrorInput) {
  const errorId = input.error.digest ?? crypto.randomUUID();
  const payload = {
    errorId,
    errorName: input.error.name,
    method: input.request.method.slice(0, 16),
    path: safePath(input.request.path),
    routePath: safePath(input.context.routePath),
    routeType: input.context.routeType,
    routerKind: input.context.routerKind,
  };

  logger.error("request.unhandled_error", payload);

  const { errorWebhookUrl, serviceName } = getObservabilityEnv();
  if (!errorWebhookUrl) return;

  try {
    const response = await fetch(errorWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, service: serviceName }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      logger.warn("monitoring.webhook_rejected", {
        errorId,
        status: response.status,
      });
    }
  } catch (error) {
    logger.warn("monitoring.webhook_failed", { errorId, error });
  }
}

