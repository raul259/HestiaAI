"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, Upload, CheckCircle2, Box, HelpCircle, Loader2 } from "lucide-react";
import { Appliance } from "@/types";
import { getCategoryIcon } from "@/lib/utils";
import ScanGuideModal from "./ScanGuideModal";

const CATEGORIES = [
  { value: "tv", label: "Televisión" },
  { value: "ac", label: "Aire acondicionado" },
  { value: "washer", label: "Lavadora" },
  { value: "dryer", label: "Secadora" },
  { value: "oven", label: "Cocina / Horno" },
  { value: "dishwasher", label: "Lavavajillas" },
  { value: "water_heater", label: "Calentador de agua" },
  { value: "wifi", label: "Router / WiFi" },
  { value: "other", label: "Otro" },
];

interface Props {
  propertyId: string;
  appliances: Appliance[];
}

export default function ApplianceSection({ propertyId, appliances: initial }: Props) {
  const [appliances, setAppliances] = useState<Appliance[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extrayendo, setExtrayendo] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [uploadingGlb, setUploadingGlb] = useState<string | null>(null); // applianceId en curso
  const [showScanGuide, setShowScanGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    model: "",
    category: "other",
    location: "",
    manual: "",
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.manual) return;
    setSaving(true);

    const res = await fetch("/api/appliances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, propertyId }),
    });

    if (res.ok) {
      const newAppliance = await res.json();
      setAppliances((prev) => [...prev, newAppliance]);
      setForm({ name: "", model: "", category: "other", location: "", manual: "" });
      setShowForm(false);
    }
    setSaving(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError("");
    setExtrayendo(true);

    const data = new FormData();
    data.append("pdf", file);

    const res = await fetch("/api/upload-manual", { method: "POST", body: data });
    const json = await res.json();

    if (!res.ok) {
      setPdfError(json.error || "Error al procesar el PDF.");
    } else {
      setForm((prev) => ({ ...prev, manual: json.texto }));
    }

    setExtrayendo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGlbUpload = async (e: React.ChangeEvent<HTMLInputElement>, appliance: Appliance) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      alert("Solo se admiten archivos .glb o .gltf.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo supera el límite de 50 MB.");
      return;
    }

    setUploadingGlb(appliance.id);
    const data = new FormData();
    data.append("glb", file);
    data.append("applianceId", appliance.id);
    data.append("propertyId", propertyId);

    const res = await fetch("/api/appliances/upload-glb", { method: "POST", body: data });
    const json = await res.json();

    if (res.ok) {
      setAppliances((prev) =>
        prev.map((a) => (a.id === appliance.id ? { ...a, glbUrl: json.glbUrl } : a))
      );
    } else {
      alert(json.error ?? "Error al subir el modelo 3D.");
    }

    setUploadingGlb(null);
    if (glbInputRef.current) glbInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este electrodoméstico?")) return;
    await fetch(`/api/appliances?id=${id}`, { method: "DELETE" });
    setAppliances((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-outfit font-semibold text-xl text-deep-forest">
          Electrodomésticos ({appliances.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-accent text-sm py-2 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 border-electric-mint/30 border-2">
          <h3 className="font-outfit font-semibold text-deep-forest mb-4">
            Nuevo electrodoméstico
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter text-gray-500 mb-1">
                  Nombre *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Aire acondicionado"
                  className="input-field text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-inter text-gray-500 mb-1">
                  Modelo
                </label>
                <input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Daikin FTXM35R"
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter text-gray-500 mb-1">
                  Categoría
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="input-field text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-inter text-gray-500 mb-1">
                  Ubicación
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Salón"
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-inter text-gray-500">
                  Manual / instrucciones *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      extrayendo
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-electric-mint/50 text-[#1B3022] hover:bg-electric-mint/10"
                    }`}
                  >
                    {extrayendo ? (
                      <>
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Extrayendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Subir PDF
                      </>
                    )}
                  </label>
                </div>
              </div>
              {pdfError && (
                <p className="text-red-500 text-xs mb-1">{pdfError}</p>
              )}
              {form.manual && (
                <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                  <FileText className="w-3 h-3" />
                  Texto extraído del PDF — puedes editarlo antes de guardar
                </div>
              )}
              <textarea
                value={form.manual}
                onChange={(e) => setForm({ ...form, manual: e.target.value })}
                placeholder="Escribe las instrucciones manualmente o sube un PDF para extraer el texto automáticamente..."
                rows={6}
                className="input-field text-sm resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 btn-outline text-sm py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {appliances.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="font-inter text-sm">
              No hay electrodomésticos aún. Añade el primero.
            </p>
          </div>
        ) : (
          appliances.map((a) => (
            <div key={a.id} className="card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(a.category)}</span>
                  <div>
                    <h4 className="font-inter font-medium text-sm text-deep-forest">
                      {a.name}
                      {a.model && (
                        <span className="text-gray-400 font-normal ml-1">
                          ({a.model})
                        </span>
                      )}
                    </h4>
                    {a.location && (
                      <p className="text-xs text-gray-400">{a.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(a.id);
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expanded === a.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {expanded === a.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {/* Estado del manual */}
                  {a.manual ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-inter font-medium">Manual procesado y listo para responder preguntas del huésped</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{Math.round(a.manual.length / 5)} palabras aprox. · Gemini usará este contenido como contexto</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="font-inter">Sin manual — sube un PDF para activar el asistente en este electrodoméstico</span>
                    </div>
                  )}

                  {/* Estado del modelo 3D */}
                  {a.glbUrl ? (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <Box className="w-4 h-4 flex-shrink-0" />
                      <span className="font-inter font-medium flex-1">Modelo 3D cargado ✓</span>
                      <button
                        onClick={() => glbInputRef.current?.click()}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Reemplazar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          glbInputRef.current?.setAttribute("data-id", a.id);
                          glbInputRef.current?.click();
                        }}
                        disabled={uploadingGlb === a.id}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-inter border border-dashed border-blue-300 text-blue-600 rounded-xl px-4 py-2.5 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        {uploadingGlb === a.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo modelo...</>
                        ) : (
                          <><Box className="w-4 h-4" /> Subir modelo 3D (.glb)</>
                        )}
                      </button>
                      <button
                        onClick={() => setShowScanGuide(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-deep-forest hover:border-deep-forest/30 transition-colors flex-shrink-0"
                        title="¿Cómo obtengo un modelo 3D?"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Input oculto para subida de GLB */}
      <input
        ref={glbInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          const id = glbInputRef.current?.getAttribute("data-id");
          const appliance = appliances.find((a) => a.id === id);
          if (appliance) handleGlbUpload(e, appliance);
        }}
      />

      <ScanGuideModal open={showScanGuide} onClose={() => setShowScanGuide(false)} />
    </div>
  );
}
