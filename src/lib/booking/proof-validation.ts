const MIME_EXTENSIONS = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/pdf": ["pdf"],
} as const;

export type TransferProofMimeType = keyof typeof MIME_EXTENSIONS;

export class TransferProofError extends Error {
  readonly code:
    | "missing"
    | "empty"
    | "too_large"
    | "invalid_type"
    | "invalid_extension"
    | "invalid_signature"
    | "upload_failed";

  constructor(
    code:
      | "missing"
      | "empty"
      | "too_large"
      | "invalid_type"
      | "invalid_extension"
      | "invalid_signature"
      | "upload_failed",
  ) {
    super(code);
    this.code = code;
    this.name = "TransferProofError";
  }
}

function fileExtension(name: string) {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

function hasValidSignature(bytes: Uint8Array, mimeType: TransferProofMimeType) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((value, index) => bytes[index] === value);
  }

  return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

export async function validateTransferProofFile(
  file: File,
  config: {
    maxBytes: number;
    allowedTypes: TransferProofMimeType[];
  },
) {
  if (!file.name || file.size === 0) {
    throw new TransferProofError(file.name ? "empty" : "missing");
  }
  if (file.size > config.maxBytes) {
    throw new TransferProofError("too_large");
  }
  if (!config.allowedTypes.includes(file.type as TransferProofMimeType)) {
    throw new TransferProofError("invalid_type");
  }

  const mimeType = file.type as TransferProofMimeType;
  const extension = fileExtension(file.name);
  if (
    !extension ||
    !MIME_EXTENSIONS[mimeType].some((allowed) => allowed === extension)
  ) {
    throw new TransferProofError("invalid_extension");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, mimeType)) {
    throw new TransferProofError("invalid_signature");
  }

  return {
    bytes,
    extension: MIME_EXTENSIONS[mimeType][0],
    mimeType,
  };
}
