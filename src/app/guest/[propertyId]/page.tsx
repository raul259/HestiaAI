"use client";

import { useEffect, useState } from "react";
import { Wifi, LogOut, Trash2, Phone, Home, Bot, ClipboardList, Box } from "lucide-react";
import ChatInterface from "@/components/guest/ChatInterface";
import IncidentForm from "@/components/guest/IncidentForm";
import GuestIncidents from "@/components/guest/GuestIncidents";
import ApplianceModal from "@/components/guest/ApplianceModal";
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

interface QuickInfo {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
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
  const [activeTab, setActiveTab] = useState<"chat" | "info" | "incidencias">("chat");
  const [incidentCount, setIncidentCount] = useState(0);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);

  // Leer conteo de incidencias del localStorage al montar
  useEffect(() => {
    const ids: string[] = JSON.parse(
      localStorage.getItem(`hestia_incidents_${propertyId}`) ?? "[]"
    );
    setIncidentCount(ids.length);
  }, [propertyId]);

  useEffect(() => {
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        setProperty(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-electric-mint border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
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
            El enlace que has utilizado no corresponde a ningún alojamiento
            registrado. Contacta con tu anfitrión.
          </p>
        </div>
      </div>
    );
  }

  const quickInfoItems: QuickInfo[] = [
    ...(property.wifiName
      ? [
          {
            icon: <Wifi className="w-4 h-4" />,
            label: "WiFi",
            value: `${property.wifiName} — ${property.wifiPassword ?? ""}`,
            highlight: true,
          },
        ]
      : []),
    ...(property.checkoutInstructions
      ? [
          {
            icon: <LogOut className="w-4 h-4" />,
            label: "Check-out",
            value: property.checkoutInstructions,
          },
        ]
      : []),
    ...(property.wasteInstructions
      ? [
          {
            icon: <Trash2 className="w-4 h-4" />,
            label: "Residuos",
            value: property.wasteInstructions,
          },
        ]
      : []),
    ...(property.emergencyContact
      ? [
          {
            icon: <Phone className="w-4 h-4" />,
            label: "Emergencias",
            value: property.emergencyContact,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      <header className="bg-deep-forest px-4 py-3 flex items-center gap-3 shadow-lg">
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
          <p className="font-inter text-xs text-white/50 truncate">
            {property.address}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-electric-mint rounded-full animate-pulse" />
          <span className="text-xs text-electric-mint font-inter">En línea</span>
        </div>
      </header>

      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-inter font-medium transition-colors border-b-2 ${
            activeTab === "chat"
              ? "border-deep-forest text-deep-forest"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Bot className="w-4 h-4" />
          Asistente
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-inter font-medium transition-colors border-b-2 ${
            activeTab === "info"
              ? "border-deep-forest text-deep-forest"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Home className="w-4 h-4" />
          Info
        </button>
        <button
          onClick={() => setActiveTab("incidencias")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-inter font-medium transition-colors border-b-2 relative ${
            activeTab === "incidencias"
              ? "border-deep-forest text-deep-forest"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Mis incidencias
          {incidentCount > 0 && (
            <span className="absolute top-2 right-3 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {incidentCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Chat — siempre montado para no perder la conversación */}
        <div className={activeTab === "chat" ? "h-full" : "hidden"} style={{ height: "calc(100vh - 140px)" }}>
          <ChatInterface
            propertyId={propertyId}
            sessionId={sessionId}
            onIncidentRequest={() => setShowIncident(true)}
            appliances={property.appliances ?? []}
            onOpenAppliance={(a) => setSelectedAppliance(a)}
          />
        </div>

        <div className={activeTab === "incidencias" ? "overflow-y-auto" : "hidden"} style={{ height: "calc(100vh - 140px)" }}>
          <GuestIncidents propertyId={propertyId} />
        </div>

        <div className={activeTab === "info" ? "p-4 space-y-4 overflow-y-auto" : "hidden"} style={{ height: "calc(100vh - 140px)" }}>
          <div>
            {property.description && (
              <div className="card">
                <h3 className="font-outfit font-semibold text-deep-forest mb-2 text-base">
                  Sobre el alojamiento
                </h3>
                <p className="font-inter text-sm text-slate-body leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {quickInfoItems.map((item, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-electric-mint/15 rounded-lg flex items-center justify-center text-deep-forest">
                    {item.icon}
                  </div>
                  <h3 className="font-outfit font-semibold text-deep-forest text-sm">
                    {item.label}
                  </h3>
                </div>
                <p
                  className={`font-inter text-sm leading-relaxed whitespace-pre-line ${
                    item.highlight ? "font-medium text-deep-forest" : "text-slate-body"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}

            {/* Electrodomésticos */}
            {property.appliances && property.appliances.length > 0 && (
              <div className="card">
                <h3 className="font-outfit font-semibold text-deep-forest mb-3 text-base flex items-center gap-2">
                  <Box className="w-4 h-4 text-electric-mint" />
                  Electrodomésticos
                </h3>
                <div className="space-y-2">
                  {property.appliances.map((appliance) => (
                    <div
                      key={appliance.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-inter font-medium text-sm text-deep-forest truncate">
                          {appliance.name}
                        </p>
                        <p className="font-inter text-xs text-slate-body">
                          {appliance.category}
                          {appliance.location ? ` · ${appliance.location}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedAppliance(appliance)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-inter font-medium text-electric-mint bg-electric-mint/10 hover:bg-electric-mint/20 border border-electric-mint/30 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Box className="w-3 h-3" />
                        Ver 3D
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIncident(true)}
              className="w-full btn-outline text-sm py-3 flex items-center justify-center gap-2"
            >
              Reportar una incidencia
            </button>
          </div>
        </div>
      </div>

      {showIncident && (
        <IncidentForm
          propertyId={propertyId}
          onClose={() => setShowIncident(false)}
          onIncidentCreated={() => {
            setIncidentCount((n) => n + 1);
            setShowIncident(false);
            setActiveTab("incidencias");
          }}
        />
      )}

      {selectedAppliance && (
        <ApplianceModal
          appliance={selectedAppliance}
          onClose={() => setSelectedAppliance(null)}
        />
      )}
    </div>
  );
}
