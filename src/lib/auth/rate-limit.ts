import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

type RateLimitRow = {
  allowed: boolean;
  retry_after_seconds: number;
};

export async function consumeAdminLoginAttempt(identifierHash: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_admin_login_rate_limit", {
    p_identifier_hash: identifierHash,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (error) {
    throw new Error(`Admin login rate limit unavailable (${error.code}).`);
  }

  const result = (data as RateLimitRow[] | null)?.[0];

  if (!result) {
    throw new Error("Admin login rate limit returned no result.");
  }

  return result;
}

export async function resetAdminLoginAttempts(identifierHash: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("reset_admin_login_rate_limit", {
    p_identifier_hash: identifierHash,
  });

  if (error) {
    logger.error("auth.login_rate_limit_reset_failed", { code: error.code });
  }
}
