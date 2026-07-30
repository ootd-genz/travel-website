"use server";

import { redirect } from "next/navigation";

import {
  hashIpAddress,
  hashLoginIdentifier,
  writeAdminAuthEvent,
} from "@/lib/auth/audit";
import { consumeAdminLoginAttempt, resetAdminLoginAttempts } from "@/lib/auth/rate-limit";
import { getSafeAdminRedirect } from "@/lib/auth/redirects";
import { getAuthRequestContext } from "@/lib/auth/request-context";
import { getAdminIdentity } from "@/lib/auth/require-admin";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import { adminLoginSchema } from "@/validations/auth";

export type AdminLoginState = {
  message: string | null;
  fieldErrors: Partial<Record<"email" | "password", string[]>>;
};

const GENERIC_LOGIN_ERROR = "Email atau password tidak valid.";

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;

    return {
      message: "Periksa kembali data login.",
      fieldErrors: {
        email: errors.email,
        password: errors.password,
      },
    };
  }

  const { email, password, next } = parsed.data;
  const startedAt = Date.now();
  const { ipAddress, requestId } = await getAuthRequestContext();
  const identifierHash = hashLoginIdentifier(email, ipAddress);
  const ipHash = hashIpAddress(ipAddress);

  let rateLimit;

  try {
    rateLimit = await consumeAdminLoginAttempt(identifierHash);
  } catch (error) {
    logger.error("auth.login_rate_limit_unavailable", {
      requestId,
      action: "login_admin",
      durationMs: Date.now() - startedAt,
      error,
    });
    return {
      message: "Login admin sedang tidak tersedia. Coba lagi beberapa saat.",
      fieldErrors: {},
    };
  }

  if (!rateLimit.allowed) {
    await writeAdminAuthEvent({
      eventType: "login_rate_limited",
      identifierHash,
      ipHash,
      reasonCode: "attempt_limit_reached",
    });
    logger.warn("auth.login_rate_limited", {
      requestId,
      action: "login_admin",
      status: "rate_limited",
      durationMs: Date.now() - startedAt,
      retryAfterSeconds: rateLimit.retry_after_seconds,
    });

    return {
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.max(
        1,
        Math.ceil(rateLimit.retry_after_seconds / 60),
      )} menit.`,
      fieldErrors: {},
    };
  }

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

  if (loginError) {
    await writeAdminAuthEvent({
      eventType: "login_failure",
      identifierHash,
      ipHash,
      reasonCode: "invalid_credentials",
    });
    logger.warn("auth.login_failed", {
      requestId,
      action: "login_admin",
      status: "invalid_credentials",
      durationMs: Date.now() - startedAt,
    });

    return { message: GENERIC_LOGIN_ERROR, fieldErrors: {} };
  }

  const identity = await getAdminIdentity();

  if (identity.status !== "admin") {
    const authUserId = identity.status === "forbidden" ? identity.authUserId : null;

    await writeAdminAuthEvent({
      authUserId,
      eventType: "access_denied",
      identifierHash,
      ipHash,
      reasonCode: "not_active_admin",
    });
    logger.warn("auth.login_access_denied", {
      requestId,
      action: "login_admin",
      actorId: authUserId,
      status: "forbidden",
      durationMs: Date.now() - startedAt,
    });
    await supabase.auth.signOut({ scope: "local" });

    return {
      message: "Akun ini tidak memiliki akses admin.",
      fieldErrors: {},
    };
  }

  await resetAdminLoginAttempts(identifierHash);
  await writeAdminAuthEvent({
    authUserId: identity.identity.authUserId,
    eventType: "login_success",
    identifierHash,
    ipHash,
  });

  logger.info("auth.login_succeeded", {
    requestId,
    action: "login_admin",
    actorId: identity.identity.authUserId,
    status: "success",
    durationMs: Date.now() - startedAt,
  });

  redirect(getSafeAdminRedirect(next));
}

export async function logoutAdmin() {
  const startedAt = Date.now();
  const { requestId } = await getAuthRequestContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error("Logout gagal. Silakan coba kembali.");
  }

  await writeAdminAuthEvent({
    authUserId: user?.id ?? null,
    eventType: "logout",
  });

  logger.info("auth.logout_succeeded", {
    requestId,
    action: "logout_admin",
    actorId: user?.id ?? null,
    status: "success",
    durationMs: Date.now() - startedAt,
  });

  redirect("/admin/login?loggedOut=1");
}
