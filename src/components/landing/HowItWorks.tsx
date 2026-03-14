import { QrCode, MessageCircle, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: <QrCode className="w-8 h-8" />,
    number: "01",
    title: "El anfitrión configura la propiedad",
    description:
      "Introduce los datos del alojamiento, añade los electrodomésticos con sus manuales e instrucciones específicas.",
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    number: "02",
    title: "El huésped accede al asistente",
    description:
      "Con el enlace o QR proporcionado en el alojamiento, el huésped abre el chat y escribe su consulta en su idioma.",
  },
  {
    icon: <CheckCircle2 className="w-8 h-8" />,
    number: "03",
    title: "Solución inmediata o escalado",
    description:
      "La IA responde con instrucciones precisas. Si no puede resolverlo, crea un ticket de incidencia y agenda una visita.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 gradient-hero">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-electric-mint bg-white/10 border border-electric-mint/30 text-sm font-inter font-medium px-4 py-1.5 rounded-full mb-4">
            Proceso simple
          </span>
          <h2 className="font-outfit font-bold text-4xl text-off-white mb-4">
            Cómo funciona Hestia-AI
          </h2>
          <p className="text-white/70 font-inter text-lg max-w-xl mx-auto">
            Tres pasos para transformar la experiencia de tus huéspedes y
            reducir tu carga como anfitrión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-electric-mint/30" />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-16 h-16 bg-electric-mint rounded-2xl flex items-center justify-center text-deep-forest mb-6 shadow-lg shadow-electric-mint/30">
                {step.icon}
              </div>
              <span className="font-outfit font-bold text-5xl text-white/10 absolute -top-2 left-1/2 -translate-x-1/2 select-none">
                {step.number}
              </span>
              <h3 className="font-outfit font-semibold text-xl text-off-white mb-3">
                {step.title}
              </h3>
              <p className="font-inter text-sm text-white/65 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
