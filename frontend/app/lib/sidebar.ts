export const SIDEBAR_COOKIE = "sidebar";

/** Reads the persisted sidebar state from a Cookie header. */
export function isSidebarCollapsed(cookieHeader: string | null) {
  return (
    cookieHeader?.split(/;\s*/).includes(`${SIDEBAR_COOKIE}=collapsed`) ?? false
  );
}
