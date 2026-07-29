import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const CONTENT_MEDIA_BUCKET = "content-media";
const MAX_CONTENT_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function hasValidSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  if (mimeType === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function uploadContentImage(file: File, folder: string) {
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("Format media harus JPEG, PNG, atau WebP.");
  if (file.size === 0 || file.size > MAX_CONTENT_IMAGE_BYTES) throw new Error("Ukuran media harus lebih dari 0 dan maksimum 5 MiB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("Isi file tidak sesuai dengan format media yang dipilih.");

  const safeFolder = folder.replace(/[^a-z0-9-]/g, "");
  const path = `${safeFolder}/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
  const client = createAdminClient();
  const { error } = await client.storage.from(CONTENT_MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw new Error(`Media gagal diunggah (${error.name}).`);
  return path;
}

export async function removeContentImage(path: string | null | undefined) {
  if (!path || /^https:\/\//i.test(path)) return;
  const client = createAdminClient();
  await client.storage.from(CONTENT_MEDIA_BUCKET).remove([path]);
}

export function getContentImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https:\/\//i.test(path)) return path;
  return createAdminClient().storage.from(CONTENT_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
