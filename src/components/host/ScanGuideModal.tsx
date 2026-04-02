"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Smartphone, Sun, Camera, Cpu, Upload } from "lucide-react";

const STEPS = [
  {
    icon: <Smartphone className="w-8 h-8 text-electric-mint" />,
    title: "Elige la app de escaneo",
    content: (
      <div className="space-y-3 text-sm font-inter text-slate-body">
        <p>Usa una app de fotogrametría en tu móvil para generar el modelo 3D:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-electric-mint/10 rounded-xl px-4 py-3">
            <span className="text-lg">⭐</span>
            <div>
              <p className="font-medium text-deep-forest">KIRI Engine</p>
              <p className="text-xs text-gray-500">Android + iOS · Gratuita · Recomendada</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-lg">📱</span>
            <div>
              <p className="font-medium text-deep-forest">Scaniverse</p>
              <p className="text-xs text-gray-500">iOS · Gratuita · Alternativa</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">Descárgala antes de empezar y crea una cuenta gratuita.</p>
      </div>
    ),
  },
  {
    icon: <Sun className="w-8 h-8 text-electric-mint" />,
    title: "Prepara el electrodoméstico",
    content: (
      <ul className="space-y-2 text-sm font-inter text-slate-body">
        {[
          "Buena iluminación — luz natural o lámpara directa",
          "Espacio libre alrededor para poder caminar",
          "Puertas y cajones cerrados",
          "Superficie limpia, sin reflejos ni objetos encima",
          "Si es muy brillante, cúbrelo con un paño mate para reducir reflejos",
        ].map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-5 h-5 bg-electric-mint/20 text-deep-forest rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: <Camera className="w-8 h-8 text-electric-mint" />,
    title: "Fotografía el objeto",
    content: (
      <div className="space-y-3 text-sm font-inter text-slate-body">
        <div className="bg-deep-forest/5 rounded-xl p-4 text-center">
          <p className="text-3xl mb-2">🔄</p>
          <p className="font-medium text-deep-forest">Da 3 vueltas completas al electrodoméstico</p>
        </div>
        <ul className="space-y-2">
          {[
            "40-60 fotos en total",
            "3 alturas: baja (30°), media (horizontal) y alta (picado)",
            "70% de solapamiento entre fotos consecutivas",
            "Sin zoom — aléjate físicamente si es necesario",
            "Incluye el panel de control y las etiquetas",
            "Muévete despacio y de forma continua",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="text-electric-mint mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: <Cpu className="w-8 h-8 text-electric-mint" />,
    title: "Genera el modelo en KIRI Engine",
    content: (
      <div className="space-y-3 text-sm font-inter text-slate-body">
        <ol className="space-y-3">
          {[
            { step: "Abre KIRI Engine y pulsa \"+ Nuevo escaneo\"" },
            { step: "Selecciona \"Photo Scan\" (no LiDAR)" },
            { step: "Sube todas las fotos que tomaste" },
            { step: "Pulsa \"Procesar\" — tarda unos minutos en la nube" },
            { step: "Cuando termine, pulsa \"Exportar\"" },
            { step: "Elige el formato GLB y descárgalo" },
          ].map(({ step }, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-electric-mint text-deep-forest rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          El archivo descargado tendrá extensión <strong>.glb</strong> — ese es el que necesitas subir a Hestia IA.
        </p>
      </div>
    ),
  },
  {
    icon: <Upload className="w-8 h-8 text-electric-mint" />,
    title: "Sube el GLB a Hestia IA",
    content: (
      <div className="space-y-3 text-sm font-inter text-slate-body">
        <p>Ya tienes el archivo .glb. Ahora súbelo:</p>
        <div className="bg-electric-mint/10 border border-electric-mint/30 rounded-xl px-4 py-3 space-y-2">
          <p className="font-medium text-deep-forest">En el panel del electrodoméstico:</p>
          <ol className="space-y-1 text-xs">
            <li>1. Expande el electrodoméstico que escaneaste</li>
            <li>2. Pulsa el botón <strong>&quot;Subir modelo 3D&quot;</strong></li>
            <li>3. Selecciona el archivo .glb descargado</li>
            <li>4. Espera la subida — aparecerá el badge &quot;Modelo 3D ✓&quot;</li>
          </ol>
        </div>
        <p className="text-xs text-gray-400">
          Los huéspedes verán el modelo real de tu electrodoméstico en lugar del modelo genérico.
        </p>
      </div>
    ),
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ScanGuideModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-outfit font-semibold text-deep-forest">Guía de escaneo 3D</h2>
            <p className="text-xs font-inter text-gray-400">Paso {step + 1} de {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-4 px-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-electric-mint" : i < step ? "w-3 bg-electric-mint/40" : "w-3 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col items-center gap-3 mb-5">
            {STEPS[step].icon}
            <h3 className="font-outfit font-semibold text-lg text-deep-forest text-center">
              {STEPS[step].title}
            </h3>
          </div>
          {STEPS[step].content}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-inter text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-deep-forest text-electric-mint text-sm font-inter font-medium hover:bg-opacity-90 transition-all"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-electric-mint text-deep-forest text-sm font-inter font-semibold hover:bg-opacity-90 transition-all"
            >
              Ir al formulario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
