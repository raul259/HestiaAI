"use client";

import { useState, useRef } from "react";
import { X, AlertTriangle, Loader2, CheckCircle2, Sparkles, Camera, Wand2 } from "lucide-react";

const PRIORITIES = [
  { value: "low", label: "Baja — no urgente" },
  { value: "medium", label: "Media — molestia" },
  { value: "high", label: "Alta — afecta al confort" },
  { value: "urgent", label: "Urgente — emergencia" },
];

interface Props {
  propertyId: string;
  sessionId?: string;
  onClose: () => void;
  onIncidentCreated?: () => void;
}

export default function IncidentForm({ propertyId, sessionId, onClose, onIncidentCreated }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    guestName: "",
    guestEmail: "",
    scheduledAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    const data = new FormData();
    data.append("photo", file);
    try {
      const res = await fetch("/api/analyze-photo", { method: "POST", body: data });
      const json = await res.json();
      if (json.description) setForm((prev) => ({ ...prev, description: json.description }));
    } catch {
      // ignore analysis errors
    } finally {
      setAnalyzing(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setError("El título y la descripción son obligatorios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId, ...(sessionId && { sessionId }) }),
      });

      if (res.ok) {
        const created = await res.json();
        // Guardar ID en localStorage para poder hacer seguimiento
        const storageKey = `hestia_incidents_${propertyId}`;
        const existing: string[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        localStorage.setItem(storageKey, JSON.stringify([...existing, created.id]));
        onIncidentCreated?.();
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al enviar la incidencia.");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-outfit font-semibold text-lg text-deep-forest">
                Reportar incidencia
              </h2>
              <p className="font-inter text-xs text-gray-400">
                Se notificará al anfitrión automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-outfit font-semibold text-xl text-deep-forest">
              Incidencia registrada
            </h3>
            <p className="font-inter text-sm text-slate-body">
              Tu incidencia ha sido enviada al anfitrión. Recibirás respuesta lo
              antes posible. En caso de emergencia, usa el contacto de
              emergencia disponible en el chat.
            </p>
            <button onClick={onClose} className="btn-primary mt-4">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-inter font-medium text-slate-body mb-1.5">
                Título del problema <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: El aire acondicionado no funciona"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-slate-body mb-1.5">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe el problema con el mayor detalle posible..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={analyzing}
                className="flex items-center gap-2 text-sm font-inter text-slate-body border border-dashed border-gray-300 rounded-xl px-4 py-2.5 hover:border-electric-mint hover:text-deep-forest transition-colors w-full justify-center disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-pulse text-electric-mint" />
                    Analizando imagen con IA...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Adjuntar foto del problema
                  </>
                )}
              </button>
              {photoPreview && (
                <div className="mt-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="preview" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-electric-mint/10 border border-electric-mint/30 rounded-xl px-3 py-2">
              <Sparkles className="w-4 h-4 text-electric-mint flex-shrink-0" />
              <p className="text-xs font-inter text-deep-forest">
                La categoría se detecta automáticamente con IA según tu descripción
              </p>
            </div>

            <div>
              <label className="block text-sm font-inter font-medium text-slate-body mb-1.5">
                Urgencia
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-field"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-inter text-gray-400">
                Opcional: déjanos tus datos para facilitar el seguimiento
              </p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.guestName}
                  onChange={(e) =>
                    setForm({ ...form, guestName: e.target.value })
                  }
                  placeholder="Tu nombre"
                  className="input-field text-sm"
                />
                <input
                  type="email"
                  value={form.guestEmail}
                  onChange={(e) =>
                    setForm({ ...form, guestEmail: e.target.value })
                  }
                  placeholder="Tu email"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-inter font-medium text-slate-body mb-1.5">
                  ¿Proponer una franja horaria para el técnico?
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="input-field text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Solo si necesitas que acuda alguien a la propiedad.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm font-inter text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-outline text-sm py-2.5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando y enviando...
                  </>
                ) : (
                  "Enviar incidencia"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
