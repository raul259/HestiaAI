"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock, Wrench, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  open: {
    label: "Pendiente",
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  in_progress: {
    label: "En proceso",
    icon: <Wrench className="w-3.5 h-3.5" />,
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  resolved: {
    label: "Resuelto ✓",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bg: "bg-green-50",
    text: "text-green-600",
  },
  closed: {
    label: "Cerrado",
    icon: <XCircle className="w-3.5 h-3.5" />,
    bg: "bg-gray-100",
    text: "text-gray-500",
  },
};

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Props {
  propertyId: string;
}

export default function GuestIncidents({ propertyId }: Props) {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const storageKey = `hestia_incidents_${propertyId}`;

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/incidents?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setIncidents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Suscripción Realtime para ver cambios de estado en tiempo real
    const supabase = createClient();
    const channel = supabase
      .channel("guest-incidents")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Incident" },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          if (!ids.includes(raw.id as string)) return;

          const newStatus = raw.status as string;

          setIncidents((prev) =>
            prev.map((i) =>
              i.id === (raw.id as string) ? { ...i, status: newStatus } : i
            )
          );

          // Destacar brevemente si pasa a "resolved"
          if (newStatus === "resolved") {
            setResolvedIds((prev) => new Set([...Array.from(prev), raw.id as string]));
            setTimeout(() => {
              setResolvedIds((prev) => {
                const next = new Set(prev);
                next.delete(raw.id as string);
                return next;
              });
            }, 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storageKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 border-2 border-electric-mint border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12 space-y-3 px-4">
        <AlertCircle className="w-10 h-10 text-gray-200 mx-auto" />
        <p className="font-inter text-sm text-gray-400">
          No has reportado ninguna incidencia en este dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {incidents.map((incident) => {
        const cfg = STATUS_CONFIG[incident.status] ?? STATUS_CONFIG.open;
        const isJustResolved = resolvedIds.has(incident.id);
        return (
          <div
            key={incident.id}
            className={`card space-y-3 transition-all duration-700 ${
              isJustResolved ? "ring-2 ring-green-400 shadow-md" : ""
            }`}
          >
            {isJustResolved && (
              <div className="flex items-center gap-1.5 -mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-inter text-green-600 font-medium">
                  ¡Tu incidencia ha sido resuelta!
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-inter font-medium text-sm text-deep-forest leading-snug">
                  {incident.title}
                </p>
                <p className="font-inter text-xs text-gray-400 mt-0.5">
                  {formatDate(incident.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-inter font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}
              >
                {cfg.icon}
                {cfg.label}
              </span>
            </div>

            <p className="font-inter text-xs text-gray-500 leading-relaxed line-clamp-2">
              {incident.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
