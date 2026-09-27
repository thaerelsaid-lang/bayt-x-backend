import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

const bodySchema = z.object({
  amount: z.number().positive(),
  madeBy: z.enum(["BUYER", "SELLER"]),
});

// POST /api/deals/:id/offers
// Records a new offer. Never deletes or edits a previous Offer row — every
// counter-offer is a new insert, which is what lets the Deal Room render a
// full, tamper-evident negotiation timeline.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  const denied = requireRole(session, ["BUYER", "SELLER", "BROKER", "ADMIN"]);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { amount, madeBy } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { offers: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!deal) return Response.json({ error: "Deal not found" }, { status: 404 });

  const offer = await prisma.offer.create({
    data: { dealId: deal.id, amount, madeBy, status: "PENDING" },
  });

  await prisma.dealTimelineEvent.create({
    data: {
      dealId: deal.id,
      type: madeBy === "BUYER" ? "offer_made" : "counter_offer",
      payload: { amount },
    },
  });

  return Response.json({ offer }, { status: 201 });
}

// PATCH /api/deals/:id/offers  { offerId, action: "accept" | "reject" }
// Accepting an offer moves the Deal itself to OFFER_ACCEPTED — it does not
// retroactively touch any earlier Offer row.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  const denied = requireRole(session, ["BUYER", "SELLER", "BROKER", "ADMIN"]);
  if (denied) return denied;

  const { offerId, action } = await req.json();
  if (action !== "accept") {
    return Response.json({ error: "Only 'accept' is supported here" }, { status: 400 });
  }

  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: { status: "ACCEPTED" },
  });

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: { status: "OFFER_ACCEPTED", agreedPrice: offer.amount },
  });

  await prisma.dealTimelineEvent.create({
    data: { dealId: params.id, type: "accepted", payload: { amount: offer.amount } },
  });

  return Response.json({ deal, offer });
}
