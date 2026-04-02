import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import PropertiesGrid from "@/components/host/PropertiesGrid";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      _count: { select: { appliances: true, incidents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const openCounts = await prisma.incident.groupBy({
    by: ["propertyId"],
    where: { status: "open" },
    _count: { id: true },
  });

  const openByProperty = Object.fromEntries(
    openCounts.map((r) => [r.propertyId, r._count.id])
  );

  return (
    <div className="min-h-screen bg-off-white">
      <header className="bg-deep-forest px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/host/dashboard" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-outfit font-bold text-off-white text-lg">
              Mis propiedades
            </h1>
          </div>
          <Link href="/host/properties/new" className="btn-accent text-sm py-2 px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva propiedad
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <PropertiesGrid properties={properties} openByProperty={openByProperty} />
      </main>
    </div>
  );
}
