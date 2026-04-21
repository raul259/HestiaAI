import { MessageSquare, Zap, ShieldCheck, Clock } from "lucide-react";

const features = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Asistente 24/7 con IA",
    description:
      "Resuelve al instante cualquier duda sobre electrodomésticos, WiFi o instrucciones del alojamiento sin esperar al anfitrión.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Guía de electrodomésticos",
    description:
      "El LLM conoce los manuales exactos de cada dispositivo de tu propiedad y explica paso a paso cómo operarlos.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Gestión de incidencias",
    description:
      "Si el problema supera la autoayuda, se crea un ticket automático y se puede agendar una visita técnica desde la app.",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Respuesta inmediata",
    description:
      "Eliminamos la espera de horas para recibir respuesta. La IA responde en segundos con información contextualizada.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-off-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-deep-forest bg-electric-mint/60 border border-deep-forest/30 text-sm font-inter font-medium px-4 py-1.5 rounded-full mb-4">
            Funcionalidades clave
          </span>
          <h2 className="font-outfit font-bold text-4xl text-deep-forest mb-4">
            Todo lo que tu huésped necesita,<br />
            <span className="text-electric-mint font-bold" style={{ textShadow: "0 0 1px #1B3022, 1px 1px 0px #1B3022, -2px -2px 0px #1B3022, 1px -1px 0px #1B3022, -1px 1px 0px #1B3022" }}>
              al alcance de un mensaje
            </span>
          </h2>
          <p className="text-slate-body font-inter text-lg max-w-2xl mx-auto">
            Hestia-AI actúa como conserje virtual personalizado para cada
            propiedad, disponible en cualquier momento y en cualquier idioma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="card text-center hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-electric-mint/15 rounded-xl flex items-center justify-center mb-4 text-deep-forest group-hover:bg-electric-mint group-hover:text-deep-forest transition-colors duration-300 mx-auto">
                {feature.icon}
              </div>
              <h3 className="font-outfit font-semibold text-lg text-deep-forest mb-2">
                {feature.title}
              </h3>
              <p className="font-inter text-sm text-slate-body leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
