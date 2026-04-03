"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

function detectPlaceholders(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g);
  return matches ?? [];
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placeholderWarnings, setPlaceholderWarnings] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    hostName: "",
    hostEmail: "",
    wifiName: "",
    wifiPassword: "",
    accessCode: "",
    checkoutInstructions: "",
    wasteInstructions: "",
    emergencyContact: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.hostName || !form.hostEmail) {
      setError("Nombre, dirección, nombre del anfitrión y email son obligatorios.");
      return;
    }

    const warnings: Record<string, string[]> = {};
    const checkoutPh = detectPlaceholders(form.checkoutInstructions);
    const wastePh = detectPlaceholders(form.wasteInstructions);
    if (checkoutPh.length) warnings.checkoutInstructions = checkoutPh;
    if (wastePh.length) warnings.wasteInstructions = wastePh;
    setPlaceholderWarnings(warnings);
    if (Object.keys(warnings).length > 0) {
      setError("Hay campos sin completar en las instrucciones. Revísalos antes de crear la propiedad.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const property = await res.json();
        router.push(`/host/properties/${property.id}`);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al crear la propiedad.");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const F = (
    key: keyof typeof form,
    value: string
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-off-white">
      <header className="bg-deep-forest px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/host/dashboard" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-outfit font-bold text-off-white text-lg">
            Nueva propiedad
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-5">
            <h2 className="font-outfit font-semibold text-lg text-deep-forest">
              Información básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Nombre del alojamiento *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => F("name", e.target.value)}
                  placeholder="Villa Mediterránea"
                  maxLength={60}
                  className="input-field"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Dirección completa *
                </label>
                <input
                  value={form.address}
                  onChange={(e) => F("address", e.target.value)}
                  placeholder="Calle del Mar, 14, 07001 Palma"
                  maxLength={120}
                  className="input-field"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Descripción del alojamiento
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => F("description", e.target.value)}
                  placeholder="Precioso apartamento a 200m de la playa..."
                  maxLength={300}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Tu nombre *
                </label>
                <input
                  value={form.hostName}
                  onChange={(e) => F("hostName", e.target.value)}
                  placeholder="Carlos Martínez"
                  maxLength={60}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Tu email *
                </label>
                <input
                  type="email"
                  value={form.hostEmail}
                  onChange={(e) => F("hostEmail", e.target.value)}
                  placeholder="carlos@email.com"
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <h2 className="font-outfit font-semibold text-lg text-deep-forest">
              Acceso y conectividad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Nombre red WiFi
                </label>
                <input
                  value={form.wifiName}
                  onChange={(e) => F("wifiName", e.target.value)}
                  placeholder="MiRed_5G"
                  maxLength={60}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Contraseña WiFi
                </label>
                <input
                  value={form.wifiPassword}
                  onChange={(e) => F("wifiPassword", e.target.value)}
                  placeholder="Contraseña1234"
                  maxLength={60}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Código acceso (caja de llaves)
                </label>
                <input
                  value={form.accessCode}
                  onChange={(e) => F("accessCode", e.target.value)}
                  placeholder="1234"
                  maxLength={10}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-inter text-gray-600 mb-1.5">
                  Contacto de emergencias
                </label>
                <input
                  value={form.emergencyContact}
                  onChange={(e) => F("emergencyContact", e.target.value)}
                  placeholder="+34 612 345 678"
                  maxLength={60}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <h2 className="font-outfit font-semibold text-lg text-deep-forest">
              Instrucciones para el huésped
            </h2>
            <div>
              <label className="block text-sm font-inter text-gray-600 mb-1.5">
                Check-out
              </label>
              <textarea
                value={form.checkoutInstructions}
                onChange={(e) => { F("checkoutInstructions", e.target.value); setPlaceholderWarnings((p) => ({ ...p, checkoutInstructions: [] })); }}
                placeholder="1. Lavar los platos utilizados&#10;2. Dejar las llaves en la caja de seguridad&#10;3. Check-out antes de las 11:00h"
                maxLength={1000}
                rows={4}
                className="input-field resize-none text-sm"
              />
              {placeholderWarnings.checkoutInstructions?.length > 0 && (
                <div className="flex items-start gap-2 mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Campos sin completar: {placeholderWarnings.checkoutInstructions.join(", ")}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-inter text-gray-600 mb-1.5">
                Gestión de residuos
              </label>
              <textarea
                value={form.wasteInstructions}
                onChange={(e) => { F("wasteInstructions", e.target.value); setPlaceholderWarnings((p) => ({ ...p, wasteInstructions: [] })); }}
                placeholder="Contenedor amarillo (plástico): Calle Mayor&#10;Contenedor azul (papel): Plaza Central"
                maxLength={1000}
                rows={4}
                className="input-field resize-none text-sm"
              />
              {placeholderWarnings.wasteInstructions?.length > 0 && (
                <div className="flex items-start gap-2 mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Campos sin completar: {placeholderWarnings.wasteInstructions.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm font-inter text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
              {error}
            </p>
          )}

          <div className="flex gap-4">
            <Link href="/host/dashboard" className="flex-1 btn-outline text-center py-3">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear propiedad"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
