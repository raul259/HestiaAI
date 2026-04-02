"use client";

import { useState, useMemo } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Loader2, MessageSquare, Send, Search } from "lucide-react";
import { formatDate, getPriorityColor, getStatusColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";

interface IncidentNote {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

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

function IncidentNotes({ incidentId, guestEmail }: { incidentId: string; guestEmail?: string | null }) {
  const [notes, setNotes] = useState<IncidentNote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [type, setType] = useState<"internal" | "reply">("internal");

  const loadNotes = async () => {
    if (notes !== null) return;
    setLoading(true);
    const res = await fetch(`/api/incidents/notes?incidentId=${incidentId}`);
    const data = await res.json();
    setNotes(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSending(true);
    const res = await fetch("/api/incidents/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incidentId, content: note, type }),
    });
    const created = await res.json();
    setNotes((prev) => [...(prev ?? []), created]);
    setNote("");
    setSending(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={loadNotes}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-deep-forest transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {notes === null ? "Ver notas" : `${notes.length} nota${notes.length !== 1 ? "s" : ""}`}
      </button>

      {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}

      {notes !== null && (
        <>
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`text-xs p-3 rounded-xl ${
                    n.type === "reply"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-gray-50 border border-gray-200 text-gray-600"
                  }`}
                >
                  <span className="font-medium block mb-1">
                    {n.type === "reply" ? "Respuesta al huésped" : "Nota interna"}
                  </span>
                  <p>{n.content}</p>
                  <span className="text-gray-400 mt-1 block">{formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setType("internal")}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                  type === "internal"
                    ? "bg-gray-100 border-gray-400 text-gray-700"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                Nota interna
              </button>
              {guestEmail && (
                <button
                  onClick={() => setType("reply")}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    type === "reply"
                      ? "bg-green-100 border-green-400 text-green-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  Responder al huésped
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                placeholder={
                  type === "reply"
                    ? `Responder a ${guestEmail}...`
                    : "Añadir nota interna..."
                }
                className="input-field text-xs flex-1 py-2"
              />
              <button
                onClick={handleSubmit}
                disabled={sending || !note.trim()}
                className="p-2 bg-deep-forest text-white rounded-xl hover:bg-deep-forest/80 disabled:opacity-40 transition-colors"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function IncidentList({ incidents: initial }: Props) {
  const [incidents, setIncidents] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => incidents.filter((inc) => {
    const matchesSearch = search === "" ||
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || inc.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [incidents, search, statusFilter, priorityFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    setUpdatingId(null);
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar incidencia..."
            className="input-field text-sm pl-9 py-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="all">Todos los estados</option>
          <option value="open">Abierta</option>
          <option value="in_progress">En proceso</option>
          <option value="resolved">Resuelta</option>
          <option value="closed">Cerrada</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="all">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      {(search || statusFilter !== "all" || priorityFilter !== "all") && (
        <p className="text-xs text-gray-400">
          {filtered.length} incidencia{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-3">
      {filtered.map((incident) => (
        <div key={incident.id} className="card space-y-3">
          <div
            className="flex items-start justify-between gap-4 cursor-pointer"
            onClick={() => setExpanded(expanded === incident.id ? null : incident.id)}
          >
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
                {getPriorityLabel(incident.priority)}
              </span>
              <span className={`badge ${getStatusColor(incident.status)}`}>
                {getStatusLabel(incident.status)}
              </span>
              {expanded === incident.id
                ? <ChevronUp className="w-3.5 h-3.5 text-gray-300 mt-1" />
                : <ChevronDown className="w-3.5 h-3.5 text-gray-300 mt-1" />
              }
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
                  disabled={updatingId === incident.id}
                  className="text-xs font-inter text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 hover:bg-yellow-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {updatingId === incident.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : "En proceso"}
                </button>
              )}
              {(incident.status === "open" || incident.status === "in_progress") && (
                <button
                  onClick={() => updateStatus(incident.id, "resolved")}
                  disabled={updatingId === incident.id}
                  className="text-xs font-inter text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-1 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {updatingId === incident.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : "Resolver"}
                </button>
              )}
            </div>
          </div>

          {expanded === incident.id && (
            <IncidentNotes incidentId={incident.id} guestEmail={incident.guestEmail} />
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
