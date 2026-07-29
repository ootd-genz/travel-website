import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Masukkan email admin.")
    .email("Masukkan alamat email yang valid.")
    .max(254, "Alamat email terlalu panjang."),
  password: z
    .string()
    .min(1, "Masukkan password admin.")
    .max(1024, "Password tidak valid."),
  next: z.string().optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

