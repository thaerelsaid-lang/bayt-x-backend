import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const districts = [
  { city: "القاهرة الجديدة", district: "التجمع الخامس", lat: 30.03, lng: 31.49 },
  { city: "القاهرة", district: "مدينة نصر", lat: 30.06, lng: 31.34 },
  { city: "القاهرة", district: "المعادي", lat: 29.96, lng: 31.26 },
  { city: "الجيزة", district: "6 أكتوبر", lat: 29.94, lng: 30.92 },
  { city: "الجيزة", district: "الشيخ زايد", lat: 30.01, lng: 30.97 },
  { city: "القاهرة", district: "مصر الجديدة (هليوبوليس)", lat: 30.09, lng: 31.32 },
  { city: "الإسكندرية", district: "سموحة", lat: 31.2, lng: 29.94 },
];

async function main() {
  const passwordHash = await bcrypt.hash("Passw0rd!", 12);

  const admin = await prisma.user.create({
    data: {
      fullName: "مدير المنصة",
      email: "admin@baytx.test",
      phone: "+201000000001",
      passwordHash,
      roles: ["ADMIN", "SUPER_ADMIN"],
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const seller = await prisma.user.create({
    data: {
      fullName: "مالك تجريبي",
      email: "seller@baytx.test",
      phone: "+201000000002",
      passwordHash,
      roles: ["SELLER"],
      sellerProfile: { create: { isVerified: true } },
    },
  });

  const broker = await prisma.user.create({
    data: {
      fullName: "وسيط تجريبي",
      email: "broker@baytx.test",
      phone: "+201000000003",
      passwordHash,
      roles: ["BROKER"],
      brokerProfile: { create: { agencyName: "BAYT-X Realty", licenseNumber: "EG-BRK-1042" } },
    },
  });

  const buyer = await prisma.user.create({
    data: {
      fullName: "مشتري تجريبي",
      email: "buyer@baytx.test",
      phone: "+201000000004",
      passwordHash,
      roles: ["BUYER"],
      buyerProfile: { create: {} },
    },
  });

  const types = ["APARTMENT", "DUPLEX", "VILLA"] as const;
  const finishes = ["FULLY_FINISHED", "SUPER_LUX", "SEMI_FINISHED"] as const;

  for (let i = 0; i < 30; i++) {
    const loc = districts[i % districts.length];
    const type = types[i % types.length];
    const bedrooms = 2 + (i % 3);
    const areaSqm = 100 + bedrooms * 35 + (i % 5) * 10;
    const price = areaSqm * (18000 + (i % 4) * 2000);

    await prisma.property.create({
      data: {
        referenceCode: `PROP-${100000 + i}`,
        ownerId: seller.id,
        title: `${type === "VILLA" ? "فيلا" : type === "DUPLEX" ? "دوبلكس" : "شقة"} في ${loc.district}`,
        description: "عقار تجريبي تم إنشاؤه بواسطة Seed Data لأغراض التطوير والاختبار فقط.",
        purpose: i % 5 === 0 ? "RENT" : "SALE",
        type,
        price,
        areaSqm,
        bedrooms,
        bathrooms: Math.max(1, bedrooms - 1),
        finishLevel: finishes[i % finishes.length],
        buildYear: 2014 + (i % 10),
        status: "AVAILABLE",
        verificationLevel: i % 3 === 0 ? "VERIFIED" : i % 3 === 1 ? "PARTIALLY_VERIFIED" : "UNVERIFIED",
        location: {
          create: {
            city: loc.city,
            district: loc.district,
            latitude: loc.lat + Math.random() * 0.01,
            longitude: loc.lng + Math.random() * 0.01,
          },
        },
      },
    });
  }

  await prisma.lead.create({
    data: {
      referenceCode: "LEAD-0091",
      buyerId: buyer.id,
      brokerId: broker.id,
      budgetMin: 2_500_000,
      budgetMax: 3_500_000,
      preferredAreas: ["التجمع الخامس"],
      propertyType: "APARTMENT",
      score: "HIGH",
      lastContactAt: new Date(),
    },
  });

  console.log("Seed complete.");
  console.log("Login users (password for all: Passw0rd!):");
  console.log(`  admin:  ${admin.email}`);
  console.log(`  seller: ${seller.email}`);
  console.log(`  broker: ${broker.email}`);
  console.log(`  buyer:  ${buyer.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
