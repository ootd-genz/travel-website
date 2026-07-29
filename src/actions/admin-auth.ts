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
  const { ipAddress } = await getAuthRequestContext();
  const identifierHash = hashLoginIdentifier(email, ipAddress);
  const ipHash = hashIpAddress(ipAddress);

  let rateLimit;

  try {
    rateLimit = await consumeAdminLoginAttempt(identifierHash);
  } catch {
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

  redirect(getSafeAdminRedirect(next));
}

export async function logoutAdmin() {
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

  redirect("/admin/login?loggedOut=1");
}
