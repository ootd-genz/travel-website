import "server-only";

import { createHmac } from "node:crypto";

import { getServerEnv } from "@/configs/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuthEventType =
  | "login_success"
  | "login_failure"
  | "login_rate_limited"
  | "logout"
  | "access_denied"
  | "session_expired";

type AuditEvent = {
  authUserId?: string | null;
  eventType: AdminAuthEventType;
  identifierHash?: string | null;
  ipHash?: string | null;
  reasonCode?: string | null;
};

function hmac(value: string) {
  return createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY)
    .update(value)
    .digest("hex");
}

export function hashLoginIdentifier(email: string, ipAddress: string) {
  return hmac(`login:${email.trim().toLowerCase()}:${ipAddress}`);
}

export function hashIpAddress(ipAddress: string) {
  return hmac(`ip:${ipAddress}`);
}

export async function writeAdminAuthEvent(event: AuditEvent) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_auth_events").insert({
    auth_user_id: event.authUserId ?? null,
    event_type: event.eventType,
    identifier_hash: event.identifierHash ?? null,
    ip_hash: event.ipHash ?? null,
    reason_code: event.reasonCode ?? null,
  });

  if (error) {
    console.error("Gagal menulis audit autentikasi admin.", { code: error.code });
  }
}

