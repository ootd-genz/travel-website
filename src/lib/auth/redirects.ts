const DEFAULT_ADMIN_PATH = "/admin";

export function getSafeAdminRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) {
    return DEFAULT_ADMIN_PATH;
  }

  try {
    const url = new URL(value, "http://internal.local");

    if (
      url.origin !== "http://internal.local" ||
      url.pathname === "/admin/login" ||
      url.pathname === "/admin/forbidden"
    ) {
      return DEFAULT_ADMIN_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_ADMIN_PATH;
  }
}

