"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError("Error al registrarse. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    setExito(true);
    setCargando(false);
  }

  return (
    <div className="relative min-h-screen gradient-hero flex items-center justify-center px-4 overflow-hidden">
      {/* Escena 3D de fondo */}
      <div className="absolute inset-0 z-0">
        <HeroScene />
      </div>
      <div className="absolute inset-0 z-10 bg-deep-forest/50" />

      {/* Tarjeta */}
      <div className="relative z-20 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-off-white font-['Outfit']">
            Hestia<span className="text-electric-mint">AI</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm">Panel de anfitriones</p>
        </div>

        {exito ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-electric-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-electric-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-off-white mb-2">¡Cuenta creada!</h2>
            <p className="text-white/50 text-sm mb-6">
              Revisa tu correo electrónico para confirmar tu cuenta y luego inicia sesión.
            </p>
            <Link href="/auth/login" className="bg-electric-mint text-deep-forest font-semibold py-3 px-6 rounded-xl hover:bg-electric-mint/90 transition-colors inline-block">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-xl font-semibold text-off-white mb-6">
              Crear cuenta
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-off-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-electric-mint focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Contraseña
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
                  placeholder="••••••••"
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
                className="w-full bg-electric-mint text-deep-forest font-semibold py-3 rounded-xl hover:bg-electric-mint/90 transition-colors mt-2 disabled:opacity-60"
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <p className="text-center text-sm text-white/50 mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-electric-mint font-medium hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
