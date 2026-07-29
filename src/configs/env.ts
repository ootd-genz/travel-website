import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const appOriginSchema = z.string().url().refine(
  (value) => {
    const url = new URL(value);

    return url.pathname === "/" && !url.search && !url.hash;
  },
  { message: "APP_URL harus berupa origin tanpa path, query, atau hash." },
);

const transferProofMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_URL: appOriginSchema,
  BOOKING_DRAFT_TTL_MINUTES: z.coerce.number().int().min(1).max(1440),
  TRANSFER_PROOF_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
  TRANSFER_PROOF_ALLOWED_TYPES: z
    .string()
    .transform((value) => value.split(",").map((item) => item.trim()))
    .pipe(z.array(transferProofMimeTypeSchema).min(1)),
  WHATSAPP_PROVIDER: z.literal("meta_cloud_api"),
  WHATSAPP_API_BASE_URL: z.string().url(),
  WHATSAPP_ADMIN_NUMBER: z.string().regex(/^[1-9][0-9]{7,14}$/),
  BANK_NAME: z.string().trim().min(2).max(50),
  BANK_ACCOUNT_NUMBER: z.string().regex(/^[0-9]{6,30}$/),
  BANK_ACCOUNT_HOLDER: z.string().trim().min(2).max(100),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ...getPublicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_URL: process.env.APP_URL,
    BOOKING_DRAFT_TTL_MINUTES: process.env.BOOKING_DRAFT_TTL_MINUTES,
    TRANSFER_PROOF_MAX_BYTES: process.env.TRANSFER_PROOF_MAX_BYTES,
    TRANSFER_PROOF_ALLOWED_TYPES:
      process.env.TRANSFER_PROOF_ALLOWED_TYPES,
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_BASE_URL: process.env.WHATSAPP_API_BASE_URL,
    WHATSAPP_ADMIN_NUMBER: process.env.WHATSAPP_ADMIN_NUMBER,
    BANK_NAME: process.env.BANK_NAME,
    BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
    BANK_ACCOUNT_HOLDER: process.env.BANK_ACCOUNT_HOLDER,
  });
}
