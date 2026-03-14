import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Building2, ExternalLink, Wrench, AlertCircle } from "lucide-react";
import { ArrowLeft } from "lucide-react";

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
        {properties.length === 0 ? (
          <div className="card text-center py-20">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-2">
              Aún no tienes propiedades
            </h2>
            <p className="font-inter text-sm text-gray-400 mb-6">
              Añade tu primera propiedad para empezar a usar Hestia-AI.
            </p>
            <Link href="/host/properties/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Añadir propiedad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((property) => {
              const openCount = openByProperty[property.id] ?? 0;
              return (
                <div key={property.id} className="card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-deep-forest/10 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-deep-forest" />
                      </div>
                      {openCount > 0 && (
                        <span className="badge text-xs text-orange-600 bg-orange-50 border-orange-200">
                          {openCount} abierta{openCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <h2 className="font-outfit font-semibold text-deep-forest text-lg mb-1">
                      {property.name}
                    </h2>
                    <p className="font-inter text-sm text-gray-400 mb-4 line-clamp-2">
                      {property.address}
                    </p>

                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center gap-1.5 text-sm font-inter text-gray-500">
                        <Wrench className="w-3.5 h-3.5" />
                        {property._count.appliances} electrodomésticos
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-inter text-gray-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {property._count.incidents} incidencias
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/host/properties/${property.id}`}
                      className="flex-1 text-center text-sm font-inter font-medium text-deep-forest border border-deep-forest/20 rounded-xl py-2 hover:bg-deep-forest hover:text-white transition-colors"
                    >
                      Gestionar
                    </Link>
                    <Link
                      href={`/guest/${property.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-sm font-inter text-electric-mint border border-electric-mint/30 rounded-xl px-3 py-2 hover:bg-electric-mint/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Huésped
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
