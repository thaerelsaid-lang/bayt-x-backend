import { prisma } from "@/lib/db";

// Server component: fetches AVAILABLE properties directly via Prisma.
// This is the real, DB-backed equivalent of the front-end demo artifact —
// wire it up to the same search/filter UI once the design system is ported
// from the demo into React components.
export default async function HomePage() {
  const properties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    include: { location: true },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>BAYT-X</h1>
      <p>من أول البحث... لحد المفتاح</p>
      <ul>
        {properties.map((p) => (
          <li key={p.id}>
            {p.title} — {p.location?.district} — {Number(p.price).toLocaleString("ar-EG")} ج.م
          </li>
        ))}
      </ul>
    </main>
  );
}
