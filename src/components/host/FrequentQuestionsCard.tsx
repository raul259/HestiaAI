"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Building2, MessageSquare } from "lucide-react";

interface PropertyBreakdown {
  propertyName: string;
  count: number;
  examples: string[];
}

interface Topic {
  label: string;
  count: number;
  pct: number;
  breakdown: PropertyBreakdown[];
}

interface Props {
  topics: Topic[];
  totalMessages: number;
}

export default function FrequentQuestionsCard({ topics, totalMessages }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="card space-y-4">
      {topics.map((topic) => (
        <div key={topic.label}>
          <div
            className="flex items-center justify-between mb-1 cursor-pointer group"
            onClick={() => setExpanded(expanded === topic.label ? null : topic.label)}
          >
            <div className="flex items-center gap-2">
              <span className="font-inter text-sm text-slate-body">{topic.label}</span>
              {topic.breakdown.length > 0 && (
                expanded === topic.label
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-deep-forest" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-deep-forest" />
              )}
            </div>
            <span className="font-inter text-xs text-gray-400">{topic.count} preguntas · {topic.pct}%</span>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-electric-mint rounded-full transition-all"
              style={{ width: `${topic.pct}%` }}
            />
          </div>

          {expanded === topic.label && topic.breakdown.length > 0 && (
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-electric-mint/30">
              {topic.breakdown.map((b) => (
                <div key={b.propertyName} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-electric-mint flex-shrink-0" />
                    <span className="font-inter text-xs font-medium text-deep-forest">{b.propertyName}</span>
                    <span className="font-inter text-xs text-gray-400">· {b.count} {b.count === 1 ? "pregunta" : "preguntas"}</span>
                  </div>
                  {b.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-1.5 pl-5">
                      <MessageSquare className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" />
                      <p className="font-inter text-xs text-gray-500 italic">"{ex}"</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="text-xs font-inter text-gray-400 pt-1">
        Basado en {totalMessages} mensajes de huéspedes
      </p>
    </div>
  );
}
