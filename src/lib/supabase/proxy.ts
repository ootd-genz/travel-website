import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnv, hasSupabasePublicEnv } from "@/configs/env";

function applyPrivateRouteHeaders(response: NextResponse, pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/booking/")) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export async function updateSession(
  request: NextRequest,
  requestHeaders = request.headers,
) {
  const pathname = request.nextUrl.pathname;

  const nextResponse = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  if (!hasSupabasePublicEnv()) {
    return applyPrivateRouteHeaders(nextResponse(), pathname);
  }

  const env = getPublicEnv();
  let response = nextResponse();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const isProtectedAdminRoute =
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    pathname !== "/admin/forbidden";

  if (isProtectedAdminRoute && (error || !data?.claims)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirectResponse;
  }

  return applyPrivateRouteHeaders(response, pathname);
}
