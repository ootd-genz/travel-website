import { createClient } from "@supabase/supabase-js";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_SETUP_EMAIL",
  "ADMIN_SETUP_PASSWORD",
  "ADMIN_SETUP_DISPLAY_NAME",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} wajib tersedia hanya selama proses setup admin.`);
  }
}

const email = process.env.ADMIN_SETUP_EMAIL.trim().toLowerCase();
const password = process.env.ADMIN_SETUP_PASSWORD;
const displayName = process.env.ADMIN_SETUP_DISPLAY_NAME.trim();

if (password.length < 12) {
  throw new Error("ADMIN_SETUP_PASSWORD minimal 12 karakter.");
}

if (displayName.length < 2 || displayName.length > 100) {
  throw new Error("ADMIN_SETUP_DISPLAY_NAME harus 2-100 karakter.");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: activeAdmins, error: activeAdminError } = await supabase
  .from("admin_users")
  .select("id, auth_user_id")
  .eq("is_active", true);

if (activeAdminError) {
  throw new Error(`Gagal memeriksa admin aktif (${activeAdminError.code}).`);
}

if (activeAdmins.length > 0) {
  throw new Error(
    "Project sudah memiliki satu admin aktif. Nonaktifkan/rotasi akun melalui prosedur terkontrol, bukan membuat admin kedua.",
  );
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError || !created.user) {
  throw new Error(`Gagal membuat user Auth (${createError?.code ?? "unknown"}).`);
}

const { error: allowlistError } = await supabase.from("admin_users").insert({
  auth_user_id: created.user.id,
  display_name: displayName,
});

if (allowlistError) {
  const { error: cleanupError } = await supabase.auth.admin.deleteUser(created.user.id);

  if (cleanupError) {
    throw new Error(
      `Allowlist admin gagal (${allowlistError.code}) dan user Auth perlu dibersihkan manual.`,
    );
  }

  throw new Error(`Allowlist admin gagal (${allowlistError.code}); user Auth sudah dibersihkan.`);
}

console.log("Single admin berhasil dibuat dan dimasukkan ke allowlist aktif.");

