import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Building2, AlertCircle, Wrench, ArrowRight, Plus, Leaf, Car, Clock, MessageSquare, TrendingUp, BarChart2 } from "lucide-react";
import LogoutButton from "@/components/host/LogoutButton";
import RealtimeIncidents from "@/components/host/RealtimeIncidents";
import IncidentChart from "@/components/host/IncidentChart";
import { ProgressRing } from "@/components/ui/ProgressRing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [properties, incidents, allIncidents, conversations] = await Promise.all([
    prisma.property.findMany({
      where: { hostId: user!.id },
      include: {
        _count: { select: { appliances: true, incidents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.incident.findMany({
      where: { property: { hostId: user!.id }, status: { in: ["open", "in_progress"] } },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.incident.findMany({
      where: { property: { hostId: user!.id } },
      select: { status: true, createdAt: true, updatedAt: true },
    }),
    prisma.conversation.findMany({
      where: { property: { hostId: user!.id } },
      select: { messages: true },
    }),
  ]);

  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const totalAppliances = properties.reduce(
    (acc, p) => acc + p._count.appliances,
    0
  );

  // ESG metrics
  const resolvedIncidents = allIncidents.filter((i) => i.status === "resolved");
  const visitasEvitadas = resolvedIncidents.length;
  const co2Ahorrado = +(visitasEvitadas * 1.2).toFixed(1);
  const avgResolutionHours =
    resolvedIncidents.length > 0
      ? +(
          resolvedIncidents.reduce(
            (acc, i) => acc + (i.updatedAt.getTime() - i.createdAt.getTime()),
            0
          ) /
          resolvedIncidents.length /
          1000 /
          3600
        ).toFixed(1)
      : null;

  // Ring metrics
  const totalInc = allIncidents.length;
  const resolutionPct = totalInc > 0 ? Math.round((resolvedIncidents.length / totalInc) * 100) : 0;
  const propertiesWithGuest = properties.filter((p) => p.status === "with_guest").length;
  const occupancyPct = properties.length > 0 ? Math.round((propertiesWithGuest / properties.length) * 100) : 0;

  // Multi-barra: desglose de estados de incidencias
  const statusBreakdown = [
    { label: "Resueltas",   count: allIncidents.filter((i) => i.status === "resolved").length,    color: "#88EBC0", dot: "bg-[#88EBC0]" },
    { label: "En proceso",  count: allIncidents.filter((i) => i.status === "in_progress").length,  color: "#FBB040", dot: "bg-amber-400" },
    { label: "Abiertas",    count: allIncidents.filter((i) => i.status === "open").length,         color: "#F87171", dot: "bg-red-400"   },
    { label: "Cerradas",    count: allIncidents.filter((i) => i.status === "closed").length,       color: "#D1D5DB", dot: "bg-gray-300"  },
  ].filter((s) => s.count > 0);

  // Analytics: preguntas más frecuentes por categoría
  const TOPICS = [
    { key: "wifi", keywords: ["wifi", "contraseña", "internet", "password", "wlan", "red"], label: "WiFi / Contraseña" },
    { key: "checkout", keywords: ["checkout", "check-out", "salida", "llave", "dejar", "hora de salida"], label: "Check-out / Llaves" },
    { key: "checkin", keywords: ["checkin", "check-in", "llegada", "entrada", "acceso", "código", "cómo entro"], label: "Check-in / Acceso" },
    { key: "appliance", keywords: ["lavadora", "nevera", "horno", "microondas", "lavavajillas", "aire", "calefacción", "televisión", "tv", "electrodoméstico"], label: "Electrodomésticos" },
    { key: "parking", keywords: ["parking", "aparcamiento", "coche", "garaje", "plaza", "aparcar"], label: "Aparcamiento" },
    { key: "cleaning", keywords: ["limpieza", "toallas", "sábanas", "ropa", "limpiar", "basura"], label: "Limpieza / Ropa de cama" },
  ];

  const topicCounts: Record<string, number> = Object.fromEntries(TOPICS.map((t) => [t.key, 0]));
  let totalUserMessages = 0;

  for (const conv of conversations) {
    try {
      const msgs: { role: string; content: string }[] = JSON.parse(conv.messages);
      for (const msg of msgs) {
        if (msg.role !== "user") continue;
        totalUserMessages++;
        const lower = msg.content.toLowerCase();
        for (const topic of TOPICS) {
          if (topic.keywords.some((kw) => lower.includes(kw))) {
            topicCounts[topic.key]++;
            break;
          }
        }
      }
    } catch {
      // ignore malformed conversations
    }
  }

  const topTopics = TOPICS.map((t) => ({
    label: t.label,
    count: topicCounts[t.key],
    pct: totalUserMessages > 0 ? Math.round((topicCounts[t.key] / totalUserMessages) * 100) : 0,
  }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Gráfico: agrupar incidencias por semana (últimas 8 semanas)
  const now = new Date();
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (7 * (7 - i)));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    const incidencias = allIncidents.filter(
      (inc) => inc.createdAt >= weekStart && inc.createdAt < weekEnd
    ).length;
    return { week: label, incidencias };
  });

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

        <RealtimeIncidents
          initialIncidents={incidents}
          propertyNames={propertyNames}
        />

        {/* Gráfico temporal */}
        <div>
          <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-electric-mint" />
            Evolución de incidencias (últimas 8 semanas)
          </h2>
          <div className="card">
            <IncidentChart data={weeklyData} />
          </div>
        </div>

        {/* Rings — métricas de rendimiento */}
        <div>
          <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-electric-mint" />
            Rendimiento operativo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="card">
              <ProgressRing
                pct={resolutionPct}
                label="Resolución de incidencias"
                sub={`${resolvedIncidents.length} de ${totalInc} resueltas`}
              />
            </div>
            <div className="card">
              <ProgressRing
                pct={100}
                label="Asistente disponible"
                sub="24/7 operativo"
                color="#88EBC0"
              />
            </div>
            <div className="card">
              <ProgressRing
                pct={occupancyPct}
                label="Ocupación actual"
                sub={`${propertiesWithGuest} de ${properties.length} alojamientos`}
                color="#6EE7B7"
              />
            </div>
          </div>
        </div>

        {/* ESG — métricas numéricas */}
        <div>
          <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-electric-mint" />
            Impacto ESG
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <div className="font-outfit font-bold text-2xl text-deep-forest">
                  {co2Ahorrado} <span className="text-base font-inter font-normal text-gray-400">kg CO₂</span>
                </div>
                <div className="font-inter text-sm text-gray-400">Emisiones evitadas</div>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="font-outfit font-bold text-2xl text-deep-forest">{visitasEvitadas}</div>
                <div className="font-inter text-sm text-gray-400">Visitas técnicas evitadas</div>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="font-outfit font-bold text-2xl text-deep-forest">
                  {avgResolutionHours !== null ? (
                    <>{avgResolutionHours} <span className="text-base font-inter font-normal text-gray-400">h</span></>
                  ) : (
                    <span className="text-base font-inter font-normal text-gray-400">Sin datos</span>
                  )}
                </div>
                <div className="font-inter text-sm text-gray-400">Tiempo medio resolución</div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-barra — desglose de estados */}
        {totalInc > 0 && (
          <div>
            <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-electric-mint" />
              Estado de incidencias
            </h2>
            <div className="card space-y-3">
              <p className="font-inter text-xs text-gray-400">Desglose · {totalInc} incidencias en total</p>
              {/* Barra segmentada */}
              <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                {statusBreakdown.map((s) => (
                  <div
                    key={s.label}
                    style={{ width: `${Math.round((s.count / totalInc) * 100)}%`, backgroundColor: s.color }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                  />
                ))}
              </div>
              {/* Leyenda */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {statusBreakdown.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <span className="font-inter text-xs text-gray-500">
                      {s.label} <strong className="text-gray-700">{Math.round((s.count / totalInc) * 100)}%</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {topTopics.length > 0 && (
          <div>
            <h2 className="font-outfit font-semibold text-xl text-deep-forest mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-electric-mint" />
              Preguntas más frecuentes
            </h2>
            <div className="card space-y-4">
              {topTopics.map((topic) => (
                <div key={topic.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-inter text-sm text-slate-body">{topic.label}</span>
                    <span className="font-inter text-xs text-gray-400">{topic.count} preguntas · {topic.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-electric-mint rounded-full transition-all"
                      style={{ width: `${topic.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs font-inter text-gray-400 pt-1">
                Basado en {totalUserMessages} mensajes de huéspedes
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
