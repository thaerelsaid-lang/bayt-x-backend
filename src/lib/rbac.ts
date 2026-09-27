import type { SessionPayload } from "./auth";

/** Throws-free check: does this session have at least one of the allowed roles? */
export function hasRole(session: SessionPayload | null, allowed: string[]): boolean {
  if (!session) return false;
  if (session.roles.includes("SUPER_ADMIN")) return true; // super admin bypasses all checks
  return session.roles.some((r) => allowed.includes(r));
}

/** Use at the top of a route handler; returns a 401/403 Response or null if allowed. */
export function requireRole(
  session: SessionPayload | null,
  allowed: string[]
): Response | null {
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasRole(session, allowed)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
