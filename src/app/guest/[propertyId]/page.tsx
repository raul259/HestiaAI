"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import ChatInterface from "@/components/guest/ChatInterface";
import IncidentForm from "@/components/guest/IncidentForm";
import ApplianceModal from "@/components/guest/ApplianceModal";
import GuestIncidents from "@/components/guest/GuestIncidents";
import { Property, Appliance } from "@/types";

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const SESSION_KEY = "hestia_session_id";

function getOrCreateSession(): string {
  if (typeof window === "undefined") return generateSessionId();
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const newId = generateSessionId();
  sessionStorage.setItem(SESSION_KEY, newId);
  return newId;
}

export default function GuestPage({
  params,
}: {
  params: { propertyId: string };
}) {
  const { propertyId } = params;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIncident, setShowIncident] = useState(false);
  const [sessionId] = useState(getOrCreateSession);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [incidentCreatedTrigger, setIncidentCreatedTrigger] = useState(0);
  const [showIncidentsPanel, setShowIncidentsPanel] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        setProperty(data);
        setLoading(false);
        if (data?.status === "active") {
          fetch(`/api/properties/${propertyId}`, { method: "PATCH" }).catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 border-3 border-electric-mint border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderWidth: 3 }}
          />
          <p className="font-inter text-slate-body text-sm">Cargando alojamiento...</p>
        </div>
      </div>
    );
  }

  if (!property || (property as unknown as { error: string }).error) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm space-y-4">
          <div className="text-6xl">🏠</div>
          <h1 className="font-outfit font-bold text-2xl text-deep-forest">
            Alojamiento no encontrado
          </h1>
          <p className="font-inter text-sm text-slate-body">
            El enlace que has utilizado no corresponde a ningún alojamiento registrado. Contacta con tu anfitrión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-off-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-deep-forest px-4 py-3 flex items-center gap-3 shadow-lg flex-shrink-0">
        <div className="w-9 h-9 bg-electric-mint rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="#1B3022" />
            <circle cx="12" cy="15" r="2.5" fill="#88EBC0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-outfit font-bold text-off-white text-base truncate leading-tight">
            {property.name}
          </h1>
          <p className="font-inter text-xs text-white/50 truncate">{property.address}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-electric-mint rounded-full animate-pulse" />
          <span className="text-xs text-electric-mint font-inter">En línea</span>
        </div>
      </header>

      {/* Chat — pantalla única, ocupa todo el espacio restante */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          propertyId={propertyId}
          sessionId={sessionId}
          onIncidentRequest={() => setShowIncident(true)}
          appliances={property.appliances ?? []}
          onOpenAppliance={(a) => setSelectedAppliance(a)}
          incidentCreatedTrigger={incidentCreatedTrigger}
          onViewIncidents={() => setShowIncidentsPanel(true)}
        />
      </div>

      {showIncident && (
        <IncidentForm
          propertyId={propertyId}
          sessionId={sessionId}
          onClose={() => setShowIncident(false)}
          onIncidentCreated={() => {
            setShowIncident(false);
            setIncidentCreatedTrigger((n) => n + 1);
          }}
        />
      )}

      {selectedAppliance && (
        <ApplianceModal
          appliance={selectedAppliance}
          onClose={() => setSelectedAppliance(null)}
        />
      )}

      {/* Panel de incidencias del huésped */}
      {showIncidentsPanel && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-outfit font-semibold text-deep-forest">Mis incidencias</h2>
              <button
                onClick={() => setShowIncidentsPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <GuestIncidents propertyId={propertyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
