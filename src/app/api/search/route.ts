import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/providers";

// POST /api/search  { text: "عايز شقة 3 أوض في التجمع وميزانيتي 4 مليون" }
// Delegates parsing to AIProvider (mock today, a real LLM later — see
// src/lib/providers/index.ts) then runs a normal filtered Prisma query.
export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const ai = getAIProvider();
  const filters = await ai.parseSearchQuery(text);

  const properties = await prisma.property.findMany({
    where: {
      status: "AVAILABLE",
      ...(filters.location && { location: { district: { contains: filters.location } } }),
      ...(filters.bedrooms && { bedrooms: filters.bedrooms }),
      ...(filters.maxBudget && { price: { lte: filters.maxBudget } }),
      ...(filters.purpose && { purpose: filters.purpose }),
    },
    include: { location: true, images: { where: { isCover: true }, take: 1 } },
    take: 40,
  });

  return Response.json({ filters, properties });
}
