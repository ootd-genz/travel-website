import "server-only";

import { createHmac } from "node:crypto";

import { z } from "zod";

import { getServerEnv } from "@/configs/env";
import { createAdminClient } from "@/lib/supabase/admin";

const rateLimitResultSchema = z
  .array(
    z.object({
      allowed: z.boolean(),
      retry_after_seconds: z.number().int().nonnegative(),
      remaining: z.number().int().nonnegative(),
    }),
  )
  .min(1);

type RateLimitScope =
  | "booking_draft"
  | "booking_submit_ip"
  | "booking_submit_token";

export class RateLimitServiceError extends Error {
  constructor() {
    super("Rate limit service unavailable.");
    this.name = "RateLimitServiceError";
  }
}

function hashIdentifier(scope: RateLimitScope, identifier: string) {
  return createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY)
    .update(`rate-limit:${scope}:${identifier}`)
    .digest("hex");
}

async function consumeRateLimit(input: {
  scope: RateLimitScope;
  identifier: string;
  maxAttempts: number;
  windowSeconds: number;
}) {
  const { data, error } = await createAdminClient().rpc(
    "consume_request_rate_limit",
    {
      p_scope: input.scope,
      p_identifier_hash: hashIdentifier(input.scope, input.identifier),
      p_max_attempts: input.maxAttempts,
      p_window_seconds: input.windowSeconds,
    },
  );
  if (error) throw new RateLimitServiceError();

  const parsed = rateLimitResultSchema.safeParse(data);
  if (!parsed.success) throw new RateLimitServiceError();
  return parsed.data[0];
}

export function consumeBookingDraftRateLimit(ipAddress: string) {
  return consumeRateLimit({
    scope: "booking_draft",
    identifier: ipAddress,
    maxAttempts: 20,
    windowSeconds: 10 * 60,
  });
}

export async function consumeBookingSubmitRateLimits(
  ipAddress: string,
  bookingToken: string,
) {
  const [ip, token] = await Promise.all([
    consumeRateLimit({
      scope: "booking_submit_ip",
      identifier: ipAddress,
      maxAttempts: 10,
      windowSeconds: 15 * 60,
    }),
    consumeRateLimit({
      scope: "booking_submit_token",
      identifier: bookingToken,
      maxAttempts: 5,
      windowSeconds: 15 * 60,
    }),
  ]);

  return {
    allowed: ip.allowed && token.allowed,
    retryAfterSeconds: Math.max(
      ip.allowed ? 0 : ip.retry_after_seconds,
      token.allowed ? 0 : token.retry_after_seconds,
    ),
    limitedScope: !ip.allowed ? "ip" : !token.allowed ? "token" : null,
  } as const;
}

