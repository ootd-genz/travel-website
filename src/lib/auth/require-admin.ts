import "server-only";

import { redirect } from "next/navigation";

import { writeAdminAuthEvent } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  adminUserId: string;
  authUserId: string;
  displayName: string;
  email: string | null;
};

export class AdminAuthenticationError extends Error {
  constructor(public readonly reason: "unauthenticated" | "forbidden") {
    super(reason === "unauthenticated" ? "Authentication required." : "Admin access required.");
    this.name = "AdminAuthenticationError";
  }
}

export async function getAdminIdentity(): Promise<
  | { status: "admin"; identity: AdminIdentity }
  | { status: "unauthenticated" }
  | { status: "forbidden"; authUserId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, display_name")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    throw new Error(`Gagal memverifikasi authorization admin (${adminError.code}).`);
  }

  if (!adminUser) {
    return { status: "forbidden", authUserId: user.id };
  }

  return {
    status: "admin",
    identity: {
      adminUserId: adminUser.id,
      authUserId: adminUser.auth_user_id,
      displayName: adminUser.display_name,
      email: user.email ?? null,
    },
  };
}

export async function requireAdmin() {
  const result = await getAdminIdentity();

  if (result.status === "admin") {
    return result.identity;
  }

  throw new AdminAuthenticationError(result.status);
}

export async function requireAdminPage(nextPath = "/admin") {
  const result = await getAdminIdentity();

  if (result.status === "admin") {
    return result.identity;
  }

  if (result.status === "forbidden") {
    await writeAdminAuthEvent({
      authUserId: result.authUserId,
      eventType: "access_denied",
      reasonCode: "not_active_admin",
    });
    redirect("/admin/forbidden");
  }

  const search = new URLSearchParams({ next: nextPath });
  redirect(`/admin/login?${search.toString()}`);
}

