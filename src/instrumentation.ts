import type { Instrumentation } from "next";

import { reportUnhandledRequestError } from "@/lib/observability/report-error";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const normalizedError =
    error instanceof Error ? error : new Error("Unknown server error");
  await reportUnhandledRequestError({
    error: normalizedError,
    request,
    context,
  });
};
