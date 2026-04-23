"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      setCargando(false);
      return;
    }

    setListo(true);
    setTimeout(() => router.push("/host/dashboard"), 2500);
  }

  return (
    <div className="relative min-h-screen gradient-hero flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <HeroScene />
      </div>
      <div className="absolute inset-0 z-10 bg-deep-forest/50" />

      <div className="relative z-20 w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-electric-mint/70 hover:text-electric-mint border border-electric-mint/20 hover:border-electric-mint/50 bg-electric-mint/5 hover:bg-electric-mint/10 text-sm mb-4 px-3 py-1.5 rounded-full transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio de sesión
          </Link>
          <h1 className="text-3xl font-bold text-off-white font-['Outfit']">
            Hestia<span className="text-electric-mint">AI</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm">Panel de anfitriones</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          {listo ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-electric-mint/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-electric-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-off-white">Contraseña actualizada</h2>
              <p className="text-white/50 text-sm">Redirigiendo al panel...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-off-white mb-2">Nueva contraseña</h2>
              <p className="text-white/50 text-sm mb-6">Elige una contraseña segura para tu cuenta.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-off-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-electric-mint focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-off-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-electric-mint focus:border-transparent"
                    placeholder="Repite la contraseña"
                  />
                </div>

                {error && (
                  <p className="text-red-300 text-sm bg-red-500/20 p-3 rounded-lg border border-red-400/30">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-electric-mint text-deep-forest font-semibold py-3 rounded-xl hover:bg-electric-mint/90 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cargando ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Guardando...
                    </>
                  ) : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
