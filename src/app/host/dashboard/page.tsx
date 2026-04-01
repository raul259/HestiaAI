import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Building2, AlertCircle, Wrench, ArrowRight, Plus, ExternalLink } from "lucide-react";
import LogoutButton from "@/components/host/LogoutButton";
import RealtimeIncidents from "@/components/host/RealtimeIncidents";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [properties, incidents] = await Promise.all([
    prisma.property.findMany({
      where: { hostId: user!.id },
      include: {
        _count: { select: { appliances: true, incidents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.incident.findMany({
      where: { property: { hostId: user!.id } },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const totalAppliances = properties.reduce(
    (acc, p) => acc + p._count.appliances,
    0
  );

  // Mapa propertyId → nombre para el componente Realtime
  const propertyNames = Object.fromEntries(
    properties.map((p) => [p.id, p.name])
  );

  return (
    <div className="min-h-screen bg-off-white">
      <header className="bg-deep-forest px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-electric-mint rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="#1B3022" />
                <circle cx="12" cy="15" r="2.5" fill="#88EBC0" />
              </svg>
            </span>
            <span className="font-outfit font-bold text-off-white">
              Hestia<span className="text-electric-mint">-AI</span>
            </span>
          </Link>
          <span className="text-white/30 hidden sm:block">/</span>
          <span className="font-inter text-sm text-white/60 hidden sm:block">Panel de anfitrión</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 hidden sm:block">{user?.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-outfit font-bold text-3xl text-deep-forest">
              Panel de control
            </h1>
            <p className="font-inter text-sm text-gray-400 mt-1">
              Gestiona tus propiedades e incidencias
            </p>
          </div>
          <Link href="/host/properties/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva propiedad
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: "Propiedades",
              value: properties.length,
              icon: <Building2 className="w-5 h-5" />,
              color: "bg-blue-50 text-blue-600",
              href: "/host/properties",
            },
            {
              label: "Incidencias abiertas",
              value: openIncidents,
              icon: <AlertCircle className="w-5 h-5" />,
              color: "bg-orange-50 text-orange-600",
              href: "/host/properties",
            },
            {
              label: "Electrodomésticos",
              value: totalAppliances,
              icon: <Wrench className="w-5 h-5" />,
              color: "bg-green-50 text-green-600",
              href: "/host/properties",
            },
          ].map((stat, i) => (
            <Link key={i} href={stat.href} className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <div className="font-outfit font-bold text-2xl text-deep-forest">
                  {stat.value}
                </div>
                <div className="font-inter text-sm text-gray-400">{stat.label}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-outfit font-semibold text-xl text-deep-forest">
                Mis propiedades
              </h2>
              <Link
                href="/host/properties"
                className="text-sm font-inter text-electric-mint hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {properties.length === 0 ? (
                <div className="card text-center py-12">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-inter text-sm text-gray-400">
                    No tienes propiedades aún.
                  </p>
                  <Link
                    href="/host/properties/new"
                    className="btn-primary text-sm mt-4 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir primera propiedad
                  </Link>
                </div>
              ) : (
                properties.slice(0, 4).map((p) => (
                  <div key={p.id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-outfit font-semibold text-deep-forest truncate">
                          {p.name}
                        </h3>
                        <p className="font-inter text-xs text-gray-400 truncate mt-0.5">
                          {p.address}
                        </p>
                        <div className="flex gap-3 mt-3">
                          <span className="text-xs font-inter text-gray-500">
                            {p._count.appliances} electrodomésticos
                          </span>
                          <span className="text-xs font-inter text-gray-500">
                            {p._count.incidents} incidencias
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Link
                          href={`/host/properties/${p.id}`}
                          className="text-xs font-inter text-deep-forest border border-deep-forest/20 rounded-lg px-3 py-1.5 hover:bg-deep-forest hover:text-white transition-colors"
                        >
                          Gestionar
                        </Link>
                        <Link
                          href={`/guest/${p.id}`}
                          target="_blank"
                          className="text-xs font-inter text-emerald-700 border border-emerald-300 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors flex items-center gap-1"
                        >
                          Vista huésped
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <RealtimeIncidents
            initialIncidents={incidents}
            propertyNames={propertyNames}
          />
        </div>
      </main>
    </div>
  );
}
