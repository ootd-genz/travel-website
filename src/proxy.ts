import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

function privateRouteCsp(nonce: string) {
  let supabaseOrigin: string | null = null;
  try {
    supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : null;
  } catch {}

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://images.unsplash.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: http:" : ""}${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const suppliedRequestId = request.headers.get("x-request-id");
  const requestId =
    suppliedRequestId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      suppliedRequestId,
    )
      ? suppliedRequestId
      : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const isPrivateRoute =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/booking/");
  const privateCsp = isPrivateRoute
    ? privateRouteCsp(crypto.randomUUID().replaceAll("-", ""))
    : null;
  if (privateCsp) {
    const nonce = /'nonce-([^']+)'/.exec(privateCsp)?.[1];
    if (nonce) requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", privateCsp);
  }
  const response = await updateSession(request, requestHeaders);
  response.headers.set("x-request-id", requestId);
  if (privateCsp) response.headers.set("Content-Security-Policy", privateCsp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
