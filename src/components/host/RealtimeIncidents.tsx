"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Wifi, WifiOff, Trash2, Loader2 } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  guestName?: string | null;
  guestEmail?: string | null;
  createdAt: Date | string;
  property: { name: string };
}

interface Props {
  initialIncidents: IncidentRow[];
  // mapa propertyId -> nombre, para asignar nombre a incidencias nuevas
  propertyNames: Record<string, string>;
}

export default function RealtimeIncidents({ initialIncidents, propertyNames }: Props) {
  const [incidents, setIncidents] = useState<IncidentRow[]>(initialIncidents);
  const [connected, setConnected] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const propertyIds = Object.keys(propertyNames);
  const propertyIdsKey = propertyIds.join(",");

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteIncident = async (id: string) => {
    await fetch(`/api/incidents?id=${id}`, { method: "DELETE" });
    setIncidents((prev) => prev.filter((i) => i.id !== id));
  };

  useEffect(() => {
    if (propertyIds.length === 0) return;

    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-incidents")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Incident" },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const pid = raw.propertyId as string;

          if (!propertyIds.includes(pid)) return;

          const newIncident: IncidentRow = {
            id: raw.id as string,
            title: raw.title as string,
            description: raw.description as string,
            category: raw.category as string,
            status: raw.status as string,
            priority: raw.priority as string,
            guestName: raw.guestName as string | null,
            guestEmail: raw.guestEmail as string | null,
            createdAt: raw.createdAt as string,
            property: { name: propertyNames[pid] ?? "Propiedad" },
          };

          setIncidents((prev) => [newIncident, ...prev].slice(0, 10));

          // Resaltar en verde durante 6 segundos
          setNewIds((prev) => new Set([...Array.from(prev), newIncident.id]));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(newIncident.id);
              return next;
            });
          }, 6000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Incident" },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          setIncidents((prev) =>
            prev.map((i) =>
              i.id === (raw.id as string) ? { ...i, status: raw.status as string } : i
            )
          );
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyIdsKey]);

  return (
    <div>
      {/* Indicador de conexión realtime */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-outfit font-semibold text-xl text-deep-forest">
          Incidencias abiertas
        </h2>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-electric-mint animate-pulse" />
              <span className="text-xs text-gray-400 font-inter flex items-center gap-1">
                <Wifi className="w-3 h-3" /> En vivo
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400 font-inter flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Conectando…
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-inter text-sm text-gray-400">
              No hay incidencias registradas.
            </p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className={`card space-y-3 transition-all duration-700 ${
                newIds.has(incident.id)
                  ? "ring-2 ring-electric-mint shadow-md"
                  : ""
              }`}
            >
              {newIds.has(incident.id) && (
                <div className="flex items-center gap-1.5 -mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-mint animate-pulse" />
                  <span className="text-xs font-inter text-electric-mint font-medium">
                    Nueva incidencia
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-inter font-medium text-sm text-deep-forest truncate">
                    {incident.title}
                  </h4>
                  <p className="font-inter text-xs text-gray-400 mt-0.5">
                    {incident.property.name}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className={`badge text-xs ${getPriorityColor(incident.priority)}`}>
                    {getPriorityLabel(incident.priority)}
                  </span>
                  <span className={`badge text-xs ${getStatusColor(incident.status)}`}>
                    {getStatusLabel(incident.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-inter text-xs text-gray-400">
                  {formatDate(incident.createdAt)}
                </span>
                <div className="flex gap-2">
                  {incident.status === "open" && (
                    <button
                      onClick={() => updateStatus(incident.id, "in_progress")}
                      className="text-xs font-inter text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 hover:bg-yellow-100 transition-colors"
                    >
                      En proceso
                    </button>
                  )}
                  {(incident.status === "open" || incident.status === "in_progress") && (
                    <button
                      onClick={() => updateStatus(incident.id, "resolved")}
                      disabled={updatingId === incident.id}
                      className="text-xs font-inter text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {updatingId === incident.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Resolver
                    </button>
                  )}
                  {(incident.status === "resolved" || incident.status === "closed") && (
                    <button
                      onClick={() => deleteIncident(incident.id)}
                      className="text-xs font-inter text-red-500 bg-red-50 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
