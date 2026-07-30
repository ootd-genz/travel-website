import "server-only";

import { headers } from "next/headers";

function normalizeIp(value: string | null) {
  const candidate = value?.split(",")[0]?.trim();

  if (!candidate || candidate.length > 64) {
    return "unknown";
  }

  return candidate;
}

function normalizeRequestId(value: string | null) {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
    ? value
    : "unknown";
}

export async function getAuthRequestContext() {
  const requestHeaders = await headers();

  return {
    requestId: normalizeRequestId(requestHeaders.get("x-request-id")),
    ipAddress: normalizeIp(
      requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
    ),
  };
}
