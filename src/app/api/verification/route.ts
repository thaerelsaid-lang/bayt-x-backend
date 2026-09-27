import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

const STAGE_ORDER = ["REQUESTED", "ASSIGNED", "IN_REVIEW", "DOCUMENTS_MISSING", "COMPLETED"] as const;

// POST /api/verification  { propertyId, action: "request" | "advance" }
// Only ADMIN / LAWYER / ENGINEER roles can move a review forward — this is a
// deliberate workflow, not something a listing owner can self-approve.
export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  const denied = requireRole(session, ["ADMIN", "SUPER_ADMIN", "LAWYER", "ENGINEER"]);
  if (denied) return denied;

  const { propertyId, action } = await req.json();
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return Response.json({ error: "Property not found" }, { status: 404 });

  const latest = await prisma.propertyVerification.findFirst({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });

  let nextStatus: (typeof STAGE_ORDER)[number] = "REQUESTED";
  if (action === "advance" && latest) {
    const idx = STAGE_ORDER.indexOf(latest.status as any);
    nextStatus = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
  }

  const entry = await prisma.propertyVerification.create({
    data: { propertyId, status: nextStatus as any, reviewedById: session!.userId },
  });

  if (nextStatus === "COMPLETED") {
    await prisma.property.update({
      where: { id: propertyId },
      data: { verificationLevel: "VERIFIED" },
    });
  }

  return Response.json({ verification: entry });
}
