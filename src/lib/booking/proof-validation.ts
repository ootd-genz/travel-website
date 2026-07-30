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
    | "unsafe_content"
    | "upload_failed";

  constructor(
    code:
      | "missing"
      | "empty"
      | "too_large"
      | "invalid_type"
      | "invalid_extension"
      | "invalid_signature"
      | "unsafe_content"
      | "upload_failed",
  ) {
    super(code);
    this.code = code;
    this.name = "TransferProofError";
  }
}

const MAX_IMAGE_DIMENSION = 12_000;
const MAX_IMAGE_PIXELS = 25_000_000;

function validateImageDimensions(width: number, height: number) {
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new TransferProofError("unsafe_content");
  }
}

function validatePngStructure(bytes: Uint8Array) {
  if (bytes.length < 24) throw new TransferProofError("unsafe_content");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  validateImageDimensions(view.getUint32(16), view.getUint32(20));
}

function validateJpegStructure(bytes: Uint8Array) {
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 1;
      continue;
    }

    const segmentLength = (bytes[offset + 1] << 8) | bytes[offset + 2];
    if (segmentLength < 2 || offset + segmentLength >= bytes.length) break;
    if (startOfFrameMarkers.has(marker)) {
      const height = (bytes[offset + 4] << 8) | bytes[offset + 5];
      const width = (bytes[offset + 6] << 8) | bytes[offset + 7];
      validateImageDimensions(width, height);
      return;
    }
    offset += segmentLength + 1;
  }

  throw new TransferProofError("unsafe_content");
}

function validatePdfStructure(bytes: Uint8Array) {
  const text = new TextDecoder("latin1").decode(bytes);
  const tail = text.slice(-2_048);
  if (!tail.includes("%%EOF")) throw new TransferProofError("unsafe_content");

  if (
    /\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia|OpenAction|AA)\b/i.test(
      text,
    )
  ) {
    throw new TransferProofError("unsafe_content");
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

  if (mimeType === "image/png") validatePngStructure(bytes);
  else if (mimeType === "image/jpeg") validateJpegStructure(bytes);
  else validatePdfStructure(bytes);

  return {
    bytes,
    extension: MIME_EXTENSIONS[mimeType][0],
    mimeType,
  };
}
