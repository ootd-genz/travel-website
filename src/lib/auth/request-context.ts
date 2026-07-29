import "server-only";

import { headers } from "next/headers";

function normalizeIp(value: string | null) {
  const candidate = value?.split(",")[0]?.trim();

  if (!candidate || candidate.length > 64) {
    return "unknown";
  }

  return candidate;
}

export async function getAuthRequestContext() {
  const requestHeaders = await headers();

  return {
    ipAddress: normalizeIp(
      requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
    ),
  };
}

