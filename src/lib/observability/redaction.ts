const REDACTED = "[REDACTED]";

const SENSITIVE_KEY =
  /(?:authorization|cookie|password|passwd|secret|token|api[_-]?key|service[_-]?role|access[_-]?token|refresh[_-]?token|email|phone|whatsapp|customer[_-]?name|sender[_-]?account)/i;

export function sanitizeLogString(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`)
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      REDACTED,
    )
    .replace(
      /([?&](?:token|key|secret|signature|code)=)[^&#\s]+/gi,
      `$1${REDACTED}`,
    )
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED)
    .replace(/(?<![A-Za-z0-9])\+?\d[\d\s().-]{6,}\d(?![A-Za-z0-9])/g, REDACTED);
}

export function redactLogValue(value: unknown, key = "value"): unknown {
  if (SENSITIVE_KEY.test(key)) return REDACTED;
  if (typeof value === "string") return sanitizeLogString(value).slice(0, 2_000);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactLogValue(item));
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      digest:
        "digest" in value && typeof value.digest === "string"
          ? sanitizeLogString(value.digest).slice(0, 128)
          : undefined,
    };
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([childKey, childValue]) => [
          childKey,
          redactLogValue(childValue, childKey),
        ]),
    );
  }
  return String(value).slice(0, 2_000);
}

