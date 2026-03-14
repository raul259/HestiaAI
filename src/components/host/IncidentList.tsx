"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  guestName?: string | null;
  guestEmail?: string | null;
  scheduledAt?: Date | null;
  createdAt: Date;
  property: { name: string };
}

interface Props {
  incidents: IncidentRow[];
}

export default function IncidentList({ incidents: initial }: Props) {
  const [incidents, setIncidents] = useState(initial);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  if (incidents.length === 0) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="font-inter text-sm text-gray-400">
          No hay incidencias para esta propiedad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <div key={incident.id} className="card space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-inter font-medium text-sm text-deep-forest">
                {incident.title}
              </h4>
              <p className="font-inter text-xs text-gray-500 mt-1 line-clamp-2">
                {incident.description}
              </p>
              {incident.guestName && (
                <p className="font-inter text-xs text-gray-400 mt-1">
                  Huésped: {incident.guestName}
                  {incident.guestEmail ? ` (${incident.guestEmail})` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`badge ${getPriorityColor(incident.priority)}`}>
                {incident.priority}
              </span>
              <span className={`badge ${getStatusColor(incident.status)}`}>
                {incident.status}
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
                  className="text-xs font-inter text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1 hover:bg-green-100 transition-colors"
                >
                  Resolver
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
