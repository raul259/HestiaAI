import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import { ArrowRight, Star, Users, TrendingUp } from "lucide-react";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-deep-forest to-[#2d5040]" />
  ),
});

const stats = [
  { value: "24/7", label: "Disponibilidad", icon: <Star className="w-4 h-4" /> },
  { value: "<3s", label: "Tiempo de respuesta", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "100%", label: "Consultas atendidas", icon: <Users className="w-4 h-4" /> },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Escena 3D fija en el fondo — fondo sólido para que el canvas alpha no mezcle con blanco */}
      <div className="fixed inset-0 z-0 bg-deep-forest">
        <HeroScene />
      </div>

      {/* Todo el contenido scrollea por encima */}
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">

          <div className="relative w-full max-w-3xl mx-auto px-6 py-20 text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-electric-mint/30 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-electric-mint rounded-full animate-pulse" />
              <span className="text-sm font-inter text-electric-mint">
                Asistente IA para alojamientos vacacionales
              </span>
            </div>

            <h1 className="font-outfit font-bold text-5xl lg:text-7xl text-off-white leading-tight">
              Tu conserje virtual,{" "}
              <span className="text-electric-mint">siempre disponible</span>
            </h1>

            <p className="font-inter text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              Hestia-AI resuelve al instante cualquier duda o incidencia de tus
              huéspedes usando inteligencia artificial contextualizada con los
              datos exactos de tu propiedad.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth/register" className="btn-accent flex items-center gap-2">
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/login" className="btn-outline text-off-white border-white/40 hover:bg-white hover:text-deep-forest">
                Iniciar sesión
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 justify-center pt-4">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-electric-mint/15 rounded-lg flex items-center justify-center text-electric-mint">
                    {stat.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-outfit font-bold text-xl text-off-white">
                      {stat.value}
                    </div>
                    <div className="font-inter text-xs text-white/50">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — fondo blanco translúcido, se ve la escena detrás */}
        <div className="bg-off-white/90 backdrop-blur-sm">
          <Features />
        </div>

        {/* How It Works — gradiente verde semitransparente, 3D visible debajo */}
        <div style={{ background: "linear-gradient(135deg, rgba(27,48,34,0.80) 0%, rgba(45,80,64,0.80) 100%)" }}>
          <HowItWorks />
        </div>

        {/* Sostenibilidad — fondo blanco translúcido */}
        <section className="py-24 bg-off-white/90 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-outfit font-bold text-4xl text-deep-forest mb-6">
              Sostenibilidad social en cada interacción
            </h2>
            <p className="font-inter text-lg text-slate-body mb-8 max-w-2xl mx-auto leading-relaxed">
              Hestia-AI reduce la brecha digital para viajeros de cualquier
              origen, garantiza accesibilidad 24/7 y contribuye a un turismo más
              sostenible al reducir desplazamientos innecesarios de técnicos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: "🌱", title: "Impacto Ambiental", desc: "Menos visitas técnicas innecesarias = menos huella de carbono." },
                { icon: "🤝", title: "Impacto Social", desc: "Accesibilidad para huéspedes de cualquier idioma o capacidad digital." },
                { icon: "📋", title: "Gobernanza", desc: "Registro de incidencias trazable para mejora continua del alojamiento." },
              ].map((item, i) => (
                <div key={i} className="card text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h4 className="font-outfit font-semibold text-deep-forest mb-2">{item.title}</h4>
                  <p className="font-inter text-sm text-slate-body">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/guest/demo" className="btn-primary inline-flex items-center gap-2">
              Comenzar ahora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer — sólido */}
        <footer className="bg-deep-forest py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-electric-mint rounded-lg flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" fill="#1B3022" />
                    <circle cx="12" cy="15" r="2.5" fill="#88EBC0" />
                  </svg>
                </span>
                <span className="font-outfit font-bold text-off-white text-lg">
                  Hestia<span className="text-electric-mint">-AI</span>
                </span>
              </div>
              <p className="font-inter text-sm text-white/40">
                © 2025 Hestia-AI. Asistencia inteligente para alojamientos vacacionales.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
