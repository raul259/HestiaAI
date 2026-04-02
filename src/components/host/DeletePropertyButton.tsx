"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/host/properties");
    } else {
      setLoading(false);
      setConfirming(false);
      alert("Error al eliminar la propiedad.");
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-inter text-red-600">¿Eliminar propiedad?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-inter text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Confirmar
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-inter text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-xs font-inter text-red-500 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Eliminar
    </button>
  );
}
