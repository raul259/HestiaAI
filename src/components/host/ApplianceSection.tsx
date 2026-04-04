"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, Upload, CheckCircle2, Box, HelpCircle, Loader2, MapPin, MessageSquare, Send, X } from "lucide-react";
import { Appliance } from "@/types";
import { getCategoryIcon } from "@/lib/utils";
import ScanGuideModal from "./ScanGuideModal";
import ApplianceHotspotEditor from "./ApplianceHotspotEditor";

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
  const [uploadingGlb, setUploadingGlb] = useState<string | null>(null);
  const [extractingForId, setExtractingForId] = useState<string | null>(null);
  const [showScanGuide, setShowScanGuide] = useState(false);
  const [editingHotspots, setEditingHotspots] = useState<Appliance | null>(null);
  const [testingAppliance, setTestingAppliance] = useState<Appliance | null>(null);
  const [testQuestion, setTestQuestion] = useState("");
  const [testAnswer, setTestAnswer] = useState("");
  const [testLoading, setTestLoading] = useState(false);
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
    if (!form.name) return;
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, applianceId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError("");

    if (applianceId) {
      setExtractingForId(applianceId);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const data = new FormData();
      data.append("pdf", file);
      const res = await fetch("/api/upload-manual", { method: "POST", body: data });
      const json = await res.json();
      if (res.ok) {
        await fetch("/api/appliances", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: applianceId, manual: json.texto }),
        });
        setAppliances((prev) =>
          prev.map((a) => (a.id === applianceId ? { ...a, manual: json.texto } : a))
        );
      } else {
        setPdfError(json.error || "Error al procesar el PDF.");
      }
      setExtractingForId(null);
    } else {
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
    }
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
    if (glbInputRef.current) glbInputRef.current.value = "";

    try {
      // 1. Pedir signed URL al servidor
      const signedRes = await fetch(
        `/api/appliances/upload-glb?applianceId=${appliance.id}&propertyId=${propertyId}`
      );
      const { signedUrl, error: signedError } = await signedRes.json();
      if (!signedRes.ok || !signedUrl) throw new Error(signedError ?? "Error obteniendo URL");

      // 2. Subir directamente a Supabase desde el cliente (sin pasar por Vercel)
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "model/gltf-binary" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Error subiendo a Supabase Storage");

      // 3. Notificar al servidor para actualizar la BD
      const patchRes = await fetch("/api/appliances/upload-glb", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applianceId: appliance.id, propertyId }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error ?? "Error actualizando BD");

      setAppliances((prev) =>
        prev.map((a) => (a.id === appliance.id ? { ...a, glbUrl: patchJson.glbUrl } : a))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el modelo 3D.");
    }

    setUploadingGlb(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este electrodoméstico?")) return;
    await fetch(`/api/appliances?id=${id}`, { method: "DELETE" });
    setAppliances((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTestQuestion = async () => {
    if (!testQuestion.trim() || !testingAppliance) return;
    setTestLoading(true);
    setTestAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          sessionId: `host_test_${testingAppliance.id}`,
          messages: [{ role: "user", content: testQuestion }],
        }),
      });
      const data = await res.json();
      setTestAnswer(data.reply ?? "Sin respuesta.");
    } catch {
      setTestAnswer("Error de conexión.");
    } finally {
      setTestLoading(false);
    }
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
                    disabled={extrayendo}
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
                placeholder="Escribe las instrucciones manualmente o sube un PDF para extraer el texto automáticamente (opcional — puedes añadirlo después)..."
                rows={6}
                className="input-field text-sm resize-none"
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
                disabled={saving || extrayendo}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-60"
              >
                {saving ? "Guardando..." : extrayendo ? "Extrayendo PDF..." : "Guardar"}
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
                      <div className="flex items-center justify-between gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span className="font-inter font-medium">Manual procesado</span>
                        </div>
                        <span className="text-xs font-inter text-green-600">
                          Subido {new Date(a.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{Math.round(a.manual.length / 5)} palabras aprox. · Listo para responder preguntas</span>
                        </div>
                        <button
                          onClick={() => { setTestingAppliance(a); setTestQuestion(""); setTestAnswer(""); }}
                          className="flex items-center gap-1.5 text-xs font-inter font-medium text-deep-forest border border-deep-forest/20 rounded-lg px-3 py-1.5 hover:bg-deep-forest hover:text-white transition-colors flex-shrink-0"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Probar pregunta
                        </button>
                      </div>
                    </>
                  ) : extractingForId === a.id ? (
                    <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                      <span className="font-inter font-medium">Extrayendo manual del PDF...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="font-inter flex-1">Sin manual — sube un PDF para activar el asistente</span>
                      </div>
                      <label
                        htmlFor={`pdf-existing-${a.id}`}
                        className="flex items-center justify-center gap-2 text-sm font-inter border border-dashed border-amber-300 text-amber-700 rounded-xl px-4 py-2.5 hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Subir PDF ahora
                      </label>
                      <input
                        id={`pdf-existing-${a.id}`}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => handlePdfUpload(e, a.id)}
                      />
                    </div>
                  )}

                  {/* Estado del modelo 3D */}
                  {a.glbUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <Box className="w-4 h-4 flex-shrink-0" />
                        <span className="font-inter font-medium flex-1">Modelo 3D cargado ✓</span>
                        <button
                          onClick={() => {
                            glbInputRef.current?.setAttribute("data-id", a.id);
                            glbInputRef.current?.click();
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Reemplazar
                        </button>
                      </div>
                      <button
                        onClick={() => setEditingHotspots(a)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-inter text-deep-forest border border-deep-forest/20 rounded-xl px-4 py-2 hover:bg-deep-forest hover:text-white transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Editar puntos de interés
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

      {editingHotspots && (
        <ApplianceHotspotEditor
          appliance={editingHotspots}
          onClose={() => setEditingHotspots(null)}
        />
      )}

      {/* Mini-modal: probar pregunta */}
      {testingAppliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-semibold text-deep-forest">
                Probar: {testingAppliance.name}
              </h3>
              <button
                onClick={() => setTestingAppliance(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-inter text-gray-400">
              Escribe una pregunta como si fueras el huésped — la IA responderá usando el manual de este electrodoméstico.
            </p>
            <div className="flex gap-2">
              <input
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTestQuestion()}
                placeholder="Ej: ¿Cómo pongo el modo eco?"
                className="input-field text-sm py-2 flex-1"
                disabled={testLoading}
              />
              <button
                onClick={handleTestQuestion}
                disabled={testLoading || !testQuestion.trim()}
                className="w-10 h-10 bg-deep-forest text-electric-mint rounded-xl flex items-center justify-center hover:bg-opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {testAnswer && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-inter text-slate-body leading-relaxed">
                {testAnswer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
