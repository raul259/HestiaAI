"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2 } from "lucide-react";

interface Props {
  property: {
    id: string;
    name: string;
    address: string;
    description?: string | null;
    wifiName?: string | null;
    wifiPassword?: string | null;
    checkoutInstructions?: string | null;
    wasteInstructions?: string | null;
    emergencyContact?: string | null;
    hostName: string;
    hostEmail: string;
    accessCode?: string | null;
  };
}

export default function EditPropertyModal({ property }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: property.name,
    address: property.address,
    description: property.description ?? "",
    wifiName: property.wifiName ?? "",
    wifiPassword: property.wifiPassword ?? "",
    checkoutInstructions: property.checkoutInstructions ?? "",
    wasteInstructions: property.wasteInstructions ?? "",
    emergencyContact: property.emergencyContact ?? "",
    hostName: property.hostName,
    hostEmail: property.hostEmail,
    accessCode: property.accessCode ?? "",
  });

  const F = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: property.id, ...form }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-inter text-white/70 border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-outfit font-semibold text-lg text-deep-forest">Editar propiedad</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Nombre *</label>
                  <input value={form.name} onChange={(e) => F("name", e.target.value)} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Dirección *</label>
                  <input value={form.address} onChange={(e) => F("address", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Red WiFi</label>
                  <input value={form.wifiName} onChange={(e) => F("wifiName", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Contraseña WiFi</label>
                  <input value={form.wifiPassword} onChange={(e) => F("wifiPassword", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Nombre anfitrión</label>
                  <input value={form.hostName} onChange={(e) => F("hostName", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Email anfitrión</label>
                  <input value={form.hostEmail} onChange={(e) => F("hostEmail", e.target.value)} type="email" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Contacto emergencias</label>
                  <input value={form.emergencyContact} onChange={(e) => F("emergencyContact", e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Código acceso</label>
                  <input value={form.accessCode} onChange={(e) => F("accessCode", e.target.value)} maxLength={10} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Instrucciones check-out</label>
                  <textarea value={form.checkoutInstructions} onChange={(e) => F("checkoutInstructions", e.target.value)} rows={3} className="input-field resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-inter text-gray-600 mb-1.5">Gestión de residuos</label>
                  <textarea value={form.wasteInstructions} onChange={(e) => F("wasteInstructions", e.target.value)} rows={3} className="input-field resize-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setOpen(false)} className="flex-1 btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.name.trim() || !form.address.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
