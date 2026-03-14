import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Wifi, Phone, LogOut, Trash2, ExternalLink } from "lucide-react";
import ApplianceSection from "@/components/host/ApplianceSection";
import IncidentList from "@/components/host/IncidentList";
import QRCodeCard from "@/components/host/QRCodeCard";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      appliances: { orderBy: { createdAt: "asc" } },
      incidents: {
        orderBy: { createdAt: "desc" },
        include: { property: { select: { name: true } } },
      },
    },
  });

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-off-white">
      <header className="bg-deep-forest px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/host/dashboard" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-outfit font-bold text-off-white text-lg">
                {property.name}
              </h1>
              <p className="font-inter text-xs text-white/50">{property.address}</p>
            </div>
          </div>
          <Link
            href={`/guest/${property.id}`}
            target="_blank"
            className="flex items-center gap-2 text-sm font-inter text-electric-mint border border-electric-mint/30 rounded-xl px-4 py-2 hover:bg-electric-mint/10 transition-colors"
          >
            Vista huésped
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card space-y-4">
            <h2 className="font-outfit font-semibold text-lg text-deep-forest">
              Información básica
            </h2>
            <InfoRow icon={<Wifi className="w-4 h-4" />} label="WiFi">
              {property.wifiName ? (
                <span>
                  <strong>{property.wifiName}</strong> — {property.wifiPassword}
                </span>
              ) : (
                <span className="text-gray-400">No configurado</span>
              )}
            </InfoRow>
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Emergencias">
              {property.emergencyContact ?? (
                <span className="text-gray-400">No configurado</span>
              )}
            </InfoRow>
            {property.accessCode && (
              <InfoRow icon={<span>🔑</span>} label="Código acceso">
                {property.accessCode}
              </InfoRow>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="font-outfit font-semibold text-lg text-deep-forest">
              Instrucciones
            </h2>
            <InfoRow icon={<LogOut className="w-4 h-4" />} label="Check-out">
              <p className="whitespace-pre-line text-xs leading-relaxed">
                {property.checkoutInstructions ?? (
                  <span className="text-gray-400">No configurado</span>
                )}
              </p>
            </InfoRow>
            <InfoRow icon={<Trash2 className="w-4 h-4" />} label="Residuos">
              <p className="whitespace-pre-line text-xs leading-relaxed">
                {property.wasteInstructions ?? (
                  <span className="text-gray-400">No configurado</span>
                )}
              </p>
            </InfoRow>
          </div>

          <QRCodeCard propertyId={property.id} propertyName={property.name} />
        </div>

        <ApplianceSection
          propertyId={property.id}
          appliances={property.appliances}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-outfit font-semibold text-xl text-deep-forest">
              Incidencias ({property.incidents.length})
            </h2>
          </div>
          <IncidentList incidents={property.incidents} />
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg-electric-mint/10 rounded-lg flex items-center justify-center text-deep-forest flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-inter text-xs text-gray-400 mb-1">{label}</p>
        <div className="font-inter text-sm text-slate-body">{children}</div>
      </div>
    </div>
  );
}
