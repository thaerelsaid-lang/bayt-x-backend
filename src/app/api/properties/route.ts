import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

// GET /api/properties?location=&minPrice=&maxPrice=&bedrooms=&type=&verifiedOnly=
export async function GET(req: Request) {
  const url = new URL(req.url);
  const location = url.searchParams.get("location") || undefined;
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const bedrooms = url.searchParams.get("bedrooms");
  const type = url.searchParams.get("type") || undefined;
  const verifiedOnly = url.searchParams.get("verifiedOnly") === "true";

  const properties = await prisma.property.findMany({
    where: {
      status: "AVAILABLE",
      ...(location && { location: { district: { contains: location } } }),
      ...(minPrice && { price: { gte: Number(minPrice) } }),
      ...(maxPrice && { price: { lte: Number(maxPrice) } }),
      ...(bedrooms && { bedrooms: Number(bedrooms) }),
      ...(type && { type: type as any }),
      ...(verifiedOnly && { verificationLevel: "VERIFIED" }),
    },
    include: { location: true, images: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return Response.json({ properties });
}

const createPropertySchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  purpose: z.enum(["SALE", "RENT", "BOTH"]),
  type: z.enum(["APARTMENT", "DUPLEX", "VILLA", "TOWNHOUSE", "STUDIO", "OFFICE", "RETAIL", "LAND"]),
  price: z.number().positive(),
  areaSqm: z.number().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  finishLevel: z.enum(["CORE_AND_SHELL", "SEMI_FINISHED", "FULLY_FINISHED", "SUPER_LUX", "ULTRA_LUX"]),
  location: z.object({
    city: z.string(),
    district: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
});

// POST /api/properties — only Sellers/Brokers/Agencies/Developers may list
export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  const denied = requireRole(session, ["SELLER", "BROKER", "AGENCY", "DEVELOPER"]);
  if (denied) return denied;

  const body = await req.json();
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const property = await prisma.property.create({
    data: {
      referenceCode: `PROP-${Math.floor(100000 + Math.random() * 900000)}`,
      ownerId: session!.userId,
      title: data.title,
      description: data.description,
      purpose: data.purpose,
      type: data.type,
      price: data.price,
      areaSqm: data.areaSqm,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      finishLevel: data.finishLevel,
      status: "AVAILABLE",
      location: { create: data.location },
    },
    include: { location: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session!.userId,
      action: "property.created",
      entity: "Property",
      entityId: property.id,
    },
  });

  return Response.json({ property }, { status: 201 });
}
