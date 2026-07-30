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
    .max(5 * 1024 * 1024),
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

const whatsappApiBaseUrlSchema = z.string().url().refine(
  (value) => {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "graph.facebook.com" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  },
  {
    message:
      "WHATSAPP_API_BASE_URL harus memakai origin HTTPS graph.facebook.com.",
  },
);

const whatsappEnvSchema = z.object({
  APP_URL: appOriginSchema,
  WHATSAPP_PROVIDER: z.literal("meta_cloud_api"),
  WHATSAPP_API_BASE_URL: whatsappApiBaseUrlSchema,
  WHATSAPP_GRAPH_API_VERSION: z.string().regex(/^v[1-9]\d*\.\d+$/),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().regex(/^\d{5,30}$/),
  WHATSAPP_ADMIN_NUMBER: z.string().regex(/^[1-9][0-9]{7,14}$/),
  WHATSAPP_TEMPLATE_NAME: z.string().regex(/^[a-z0-9_]{1,512}$/),
  WHATSAPP_TEMPLATE_LANGUAGE: z
    .string()
    .regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/),
});

const optionalHttpsUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
  z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === "https:")
    .optional(),
);

const observabilityEnvSchema = z.object({
  OBSERVABILITY_SERVICE_NAME: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .default("travel-website"),
  OBSERVABILITY_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
  OBSERVABILITY_ERROR_WEBHOOK_URL: optionalHttpsUrl,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type WhatsAppEnv = z.infer<typeof whatsappEnvSchema>;
export type ObservabilityEnv = {
  serviceName: string;
  logLevel: "debug" | "info" | "warn" | "error";
  errorWebhookUrl?: string;
};

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

export function getWhatsAppEnv(): WhatsAppEnv {
  return whatsappEnvSchema.parse({
    APP_URL: process.env.APP_URL,
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_BASE_URL: process.env.WHATSAPP_API_BASE_URL,
    WHATSAPP_GRAPH_API_VERSION: process.env.WHATSAPP_GRAPH_API_VERSION,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ADMIN_NUMBER: process.env.WHATSAPP_ADMIN_NUMBER,
    WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME,
    WHATSAPP_TEMPLATE_LANGUAGE: process.env.WHATSAPP_TEMPLATE_LANGUAGE,
  });
}

export function getObservabilityEnv(): ObservabilityEnv {
  const parsed = observabilityEnvSchema.parse({
    OBSERVABILITY_SERVICE_NAME: process.env.OBSERVABILITY_SERVICE_NAME,
    OBSERVABILITY_LOG_LEVEL: process.env.OBSERVABILITY_LOG_LEVEL,
    OBSERVABILITY_ERROR_WEBHOOK_URL:
      process.env.OBSERVABILITY_ERROR_WEBHOOK_URL,
  });

  return {
    serviceName: parsed.OBSERVABILITY_SERVICE_NAME,
    logLevel: parsed.OBSERVABILITY_LOG_LEVEL,
    errorWebhookUrl: parsed.OBSERVABILITY_ERROR_WEBHOOK_URL,
  };
}
