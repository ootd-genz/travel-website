import "server-only";

import { randomUUID } from "node:crypto";

import { getServerEnv } from "@/configs/env";
import {
  TransferProofError,
  validateTransferProofFile,
  type TransferProofMimeType,
} from "@/lib/booking/proof-validation";
import { createAdminClient } from "@/lib/supabase/admin";

const TRANSFER_PROOF_BUCKET = "booking-transfer-proofs";

export async function validateTransferProof(file: File) {
  const env = getServerEnv();
  return validateTransferProofFile(file, {
    maxBytes: env.TRANSFER_PROOF_MAX_BYTES,
    allowedTypes:
      env.TRANSFER_PROOF_ALLOWED_TYPES as TransferProofMimeType[],
  });
}

export async function uploadTransferProof(bookingId: string, file: File) {
  const validated = await validateTransferProof(file);
  const path = `${bookingId}/${randomUUID()}.${validated.extension}`;
  const client = createAdminClient();
  const { error } = await client.storage
    .from(TRANSFER_PROOF_BUCKET)
    .upload(path, validated.bytes, {
      cacheControl: "0",
      contentType: validated.mimeType,
      upsert: false,
    });

  if (error) throw new TransferProofError("upload_failed");
  return path;
}

export async function removeTransferProof(path: string) {
  const { error } = await createAdminClient().storage
    .from(TRANSFER_PROOF_BUCKET)
    .remove([path]);
  if (error) throw new Error(`Transfer proof cleanup failed (${error.name}).`);
}

export { TransferProofError };
