import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "open",        label: "Recibida"   },
  { key: "in_progress", label: "En proceso" },
  { key: "resolved",    label: "Resuelta"   },
  { key: "closed",      label: "Cerrada"    },
];

export function IncidentStepper({ status }: { status: string }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;

        return (
          <div key={step.key} className="flex items-start flex-1">
            {/* Paso */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors",
                  done    ? "bg-electric-mint text-deep-forest" :
                  current ? "bg-deep-forest text-electric-mint ring-2 ring-electric-mint/30" :
                            "bg-gray-100 text-gray-400"
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-inter whitespace-nowrap",
                  current ? "text-deep-forest font-semibold" :
                  done    ? "text-electric-mint/80" :
                            "text-gray-300"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Conector entre pasos */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mt-3.5 mx-1 transition-colors",
                  done ? "bg-electric-mint" : "bg-gray-100"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
