import type {
  WhatsAppProvider,
  WhatsAppSendResult,
  WhatsAppTemplateMessage,
} from "./provider";

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_PROVIDER_RESPONSE_CHARS = 64 * 1024;

export type MetaCloudApiConfig = {
  apiBaseUrl: string;
  apiVersion: string;
  accessToken: string;
  phoneNumberId: string;
  timeoutMs?: number;
};

type FetchImplementation = typeof fetch;

function sanitizeProviderCode(value: unknown, fallback: string) {
  const normalized =
    typeof value === "number" || typeof value === "string"
      ? String(value).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 70)
      : "";

  return `meta_${normalized || fallback}`.slice(0, 100);
}

function getProviderError(body: unknown, status: number) {
  if (!body || typeof body !== "object" || !("error" in body)) {
    return {
      errorCode: sanitizeProviderCode(null, `http_${status}`),
      providerCode: null,
    };
  }

  const error = body.error;
  if (!error || typeof error !== "object") {
    return {
      errorCode: sanitizeProviderCode(null, `http_${status}`),
      providerCode: null,
    };
  }

  const providerCode =
    "code" in error &&
    (typeof error.code === "number" || typeof error.code === "string")
      ? Number(error.code)
      : null;

  return {
    errorCode: sanitizeProviderCode(
      "code" in error ? error.code : null,
      `http_${status}`,
    ),
    providerCode: Number.isFinite(providerCode) ? providerCode : null,
  };
}

function isRetryableProviderError(status: number, providerCode: number | null) {
  if (status === 408 || status === 429 || status >= 500) return true;

  return (
    providerCode !== null &&
    [1, 2, 4, 17, 32, 613].includes(providerCode)
  );
}

function parseResponseBody(value: string): unknown {
  if (!value || value.length > MAX_PROVIDER_RESPONSE_CHARS) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getProviderMessageId(body: unknown) {
  if (!body || typeof body !== "object" || !("messages" in body)) return null;
  if (!Array.isArray(body.messages)) return null;

  const firstMessage = body.messages[0];
  if (
    !firstMessage ||
    typeof firstMessage !== "object" ||
    !("id" in firstMessage) ||
    typeof firstMessage.id !== "string"
  ) {
    return null;
  }

  return firstMessage.id.trim().slice(0, 500) || null;
}

export async function sendMetaCloudApiTemplate(
  config: MetaCloudApiConfig,
  message: WhatsAppTemplateMessage,
  fetchImplementation: FetchImplementation = fetch,
): Promise<WhatsAppSendResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const endpoint = new URL(
      `${config.apiVersion}/${config.phoneNumberId}/messages`,
      `${config.apiBaseUrl.replace(/\/$/, "")}/`,
    );
    const response = await fetchImplementation(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.destinationNumber,
        type: "template",
        template: {
          name: message.templateName,
          language: {
            code: message.languageCode,
          },
          components: [
            {
              type: "body",
              parameters: message.bodyParameters.map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const body = parseResponseBody(await response.text());
    if (!response.ok) {
      const providerError = getProviderError(body, response.status);
      return {
        ok: false,
        errorCode: providerError.errorCode,
        retryable: isRetryableProviderError(
          response.status,
          providerError.providerCode,
        ),
      };
    }

    const providerMessageId = getProviderMessageId(body);
    if (!providerMessageId) {
      return {
        ok: false,
        errorCode: "provider_invalid_response",
        retryable: true,
      };
    }

    return { ok: true, providerMessageId };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        errorCode: "provider_timeout",
        retryable: true,
      };
    }

    return {
      ok: false,
      errorCode: "provider_network_error",
      retryable: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function createMetaCloudApiProvider(
  config: MetaCloudApiConfig,
): WhatsAppProvider {
  return {
    sendTemplate(message) {
      return sendMetaCloudApiTemplate(config, message);
    },
  };
}
