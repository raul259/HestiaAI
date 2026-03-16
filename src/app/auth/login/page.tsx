"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    router.push("/host/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen gradient-hero flex items-center justify-center px-4 overflow-hidden">
      {/* Escena 3D de fondo */}
      <div className="absolute inset-0 z-0">
        <HeroScene />
      </div>
      <div className="absolute inset-0 z-10 bg-deep-forest/50" />

      {/* Tarjeta de login */}
      <div className="relative z-20 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-off-white font-['Outfit']">
            Hestia<span className="text-electric-mint">AI</span>
          </h1>
          <p className="text-white/50 mt-2 text-sm">Panel de anfitriones</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-xl font-semibold text-off-white mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
              {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="text-electric-mint font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
