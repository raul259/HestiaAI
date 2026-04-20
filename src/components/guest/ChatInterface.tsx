"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, AlertTriangle, Box, Wifi, Clock, Phone } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, Appliance } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  sessionId: string;
  onIncidentRequest: () => void;
  appliances?: Appliance[];
  onOpenAppliance?: (appliance: Appliance) => void;
  incidentCreatedTrigger?: number;
  onViewIncidents?: () => void;
}

function detectAppliance(text: string, appliances: Appliance[]): Appliance | null {
  const lower = text.toLowerCase();
  return appliances.find((a) => lower.includes(a.name.toLowerCase())) ?? null;
}

export function parseSuggestions(content: string): { text: string; suggestions: string[] } {
  const match = content.match(/\[SUGERENCIAS:([^\]]+)\]\s*$/);
  if (!match) return { text: content, suggestions: [] };
  const text = content.slice(0, match.index).trimEnd();
  const suggestions = match[1]
    .split(/,(?=\s*")/)
    .map((s) => s.trim().replace(/^"|"$/g, "").trim())
    .filter(Boolean);
  return { text, suggestions };
}

const QUICK_CARDS = [
  {
    title: "WiFi y acceso",
    sub: "Clave y código",
    Icon: Wifi,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    question: "¿Cuál es la contraseña del WiFi y el código de acceso al apartamento?",
  },
  {
    title: "Check-in / out",
    sub: "Horarios y normas",
    Icon: Clock,
    bg: "bg-amber-50",
    iconColor: "text-amber-700",
    question: "¿A qué hora es el check-in y el check-out? ¿Cuáles son las normas principales?",
  },
  {
    title: "Electrodomésticos",
    sub: "Guías en 3D",
    Icon: Box,
    bg: "bg-violet-50",
    iconColor: "text-violet-700",
    question: "¿Qué electrodomésticos hay en el apartamento y cómo funcionan?",
  },
  {
    title: "Emergencias",
    sub: "Teléfonos urgentes",
    Icon: Phone,
    bg: "bg-red-50",
    iconColor: "text-red-600",
    question: "¿Cuál es el teléfono de emergencias y cómo contacto con el anfitrión?",
  },
];

const I18N: Record<string, { questions: string[] }> = {
  es: {
    questions: [
      "¿Cuál es el WiFi?",
      "¿A qué hora el check-out?",
      "¿Cómo funciona la lavadora?",
      "¿Dónde tiro la basura?",
      "¿Hay parking?",
      "¿Cómo funciona la calefacción?",
    ],
  },
  en: {
    questions: [
      "What's the WiFi?",
      "What time is check-out?",
      "How does the washing machine work?",
      "Where do I put the rubbish?",
      "Is there parking?",
      "How does the heating work?",
    ],
  },
  fr: {
    questions: [
      "Quel est le WiFi ?",
      "À quelle heure le check-out ?",
      "Comment marche le lave-linge ?",
      "Où jeter les ordures ?",
      "Y a-t-il un parking ?",
    ],
  },
  de: {
    questions: [
      "Was ist das WLAN?",
      "Wann ist Check-out?",
      "Wie funktioniert die Waschmaschine?",
      "Wohin mit dem Müll?",
      "Gibt es Parkplätze?",
    ],
  },
  it: {
    questions: [
      "Qual è il WiFi?",
      "A che ora il check-out?",
      "Come funziona la lavatrice?",
      "Dove butto la spazzatura?",
      "C'è parcheggio?",
    ],
  },
  pt: {
    questions: [
      "Qual é o WiFi?",
      "A que horas o check-out?",
      "Como funciona a máquina de lavar?",
      "Onde coloco o lixo?",
      "Há estacionamento?",
    ],
  },
  nl: {
    questions: [
      "Wat is het WiFi?",
      "Hoe laat is check-out?",
      "Hoe werkt de wasmachine?",
      "Waar gooi ik het afval?",
      "Is er parkeren?",
    ],
  },
};

function detectLang(): string {
  if (typeof window === "undefined") return "es";
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  return I18N[lang] ? lang : "en";
}

const INCIDENT_MARKER = "__INCIDENT_CONFIRMED__";

export default function ChatInterface({
  propertyId,
  sessionId,
  onIncidentRequest,
  appliances = [],
  onOpenAppliance,
  incidentCreatedTrigger = 0,
  onViewIncidents,
}: Props) {
  const lang = detectLang();
  const { questions } = I18N[lang];

  const DAILY_LIMIT = 20;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [hasIncidents, setHasIncidents] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem(`hestia_incidents_${propertyId}`) ?? "[]");
    if (ids.length > 0) setHasIncidents(true);

    fetch(`/api/chat?sessionId=${sessionId}&propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages(data.messages);
        }
        if (data.remaining !== undefined) setRemaining(data.remaining);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inyectar mensaje de confirmación cuando se crea una incidencia
  useEffect(() => {
    if (incidentCreatedTrigger === 0) return;
    setHasIncidents(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: INCIDENT_MARKER },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentCreatedTrigger]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatStarted = messages.some((m) => m.role === "user");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          sessionId,
          messages: newMessages.filter((m) => m.role !== "system"),
        }),
      });

      const data = await res.json();
      if (data.remaining !== undefined && data.remaining !== null) setRemaining(data.remaining);
      if (res.status === 429 || data.error === "DAILY_LIMIT_REACHED") {
        setRemaining(0);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Has alcanzado el límite de 20 mensajes por día. Puedes seguir usando el asistente mañana. Si tienes una urgencia, usa el botón \"Reportar incidencia\"." },
        ]);
      } else if (res.status === 403 || data.error === "PROPERTY_INACTIVE") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "El asistente de este alojamiento no está disponible en este momento. Por favor, contacta directamente con el anfitrión." },
        ]);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        const errorMsg = res.status === 500
          ? "El asistente no está disponible en este momento. Por favor, inténtalo de nuevo en unos segundos."
          : "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errorMsg },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión. Comprueba tu internet e inténtalo de nuevo." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-off-white">
      {/* Welcome banner — fuera del recuadro, ancho completo */}
      {!chatStarted && historyLoaded && (
        <div className="bg-[#1B3022] flex-shrink-0">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hestia.png" alt="Hestia" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm text-white/90 leading-snug font-inter">
              Hola, soy <strong className="text-white">Hestia</strong>. Estoy aquí 24h para cualquier duda del apartamento.
            </p>
          </div>
        </div>
      )}

      {/* Recuadro principal — contiene cards, mensajes y controles */}
      <div className="flex-1 overflow-hidden flex flex-col p-3 min-h-0">
        <div className="max-w-2xl w-full mx-auto flex-1 overflow-hidden flex flex-col border border-gray-200 rounded-2xl shadow-sm bg-white min-h-0">

          {/* Área scrollable: cards arriba + mensajes */}
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            {!chatStarted && historyLoaded && (
              <div className="grid grid-cols-2 gap-3 p-3">
                {QUICK_CARDS.map((card) => (
                  <button
                    key={card.title}
                    onClick={() => sendMessage(card.question)}
                    className="p-5 text-left rounded-xl border border-gray-100 bg-gray-50/60 active:scale-95 transition-transform hover:bg-electric-mint/5 hover:border-electric-mint/30"
                  >
                    <div className={`w-7 h-7 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                    <p className="text-xs font-medium text-deep-forest leading-tight font-inter">{card.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-inter">{card.sub}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden",
                      msg.role === "user"
                        ? "bg-deep-forest text-electric-mint"
                        : "bg-electric-mint"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/hestia.png" alt="Hestia" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {msg.content === INCIDENT_MARKER ? (
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-3">
                        <p className="text-sm font-inter text-slate-body">
                          ✅ Incidencia enviada. El anfitrión ha sido notificado y la revisará lo antes posible.
                        </p>
                        {onViewIncidents && (
                          <button
                            onClick={onViewIncidents}
                            className="flex items-center gap-1.5 text-xs font-inter font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Ver estado de mi incidencia
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const { text, suggestions } = msg.role === "assistant"
                            ? parseSuggestions(msg.content)
                            : { text: msg.content, suggestions: [] };
                          return (
                            <>
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-3 text-sm font-inter leading-relaxed",
                                  msg.role === "user"
                                    ? "bg-deep-forest text-off-white rounded-tr-sm"
                                    : "bg-white border border-gray-100 text-slate-body rounded-tl-sm shadow-sm"
                                )}
                              >
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    code: ({ children }) => (
                                      <code className="bg-gray-100 rounded px-1 text-xs font-mono">{children}</code>
                                    ),
                                  }}
                                >
                                  {text}
                                </ReactMarkdown>
                                {suggestions.length > 0 && (
                                  <div className="mt-3 flex flex-col gap-1.5">
                                    {suggestions.map((s, si) => (
                                      <button
                                        key={si}
                                        onClick={() => sendMessage(s)}
                                        className="text-left text-xs font-inter font-medium text-[#0F6E56] bg-[#E1F5EE] hover:bg-[#c7ede0] border border-[#a7dfc8] px-3 py-2 rounded-xl transition-colors"
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {msg.role === "assistant" &&
                                onOpenAppliance &&
                                (() => {
                                  const found = detectAppliance(msg.content, appliances);
                                  return found ? (
                                    <button
                                      onClick={() => onOpenAppliance(found)}
                                      className="flex items-center gap-1.5 text-xs font-inter font-medium text-electric-mint bg-electric-mint/10 hover:bg-electric-mint/20 border border-electric-mint/30 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                      <Box className="w-3 h-3" />
                                      Ver {found.name} en 3D
                                    </button>
                                  ) : null;
                                })()}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hestia.png" alt="Hestia" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-electric-mint" />
                    <span className="text-sm text-gray-400 font-inter">Pensando...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Controles fijos en la parte inferior del recuadro */}
          <div className="border-t border-gray-100 flex-shrink-0 p-3 space-y-2">
            {/* Aviso límite diario — solo antes de empezar o cuando queden ≤5 */}
            {historyLoaded && remaining !== null && (
              !chatStarted ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-[10px] font-inter text-gray-400">
                    Dispones de <strong className="text-gray-600">{DAILY_LIMIT} preguntas</strong> diarias para este asistente.
                  </span>
                </div>
              ) : remaining <= 5 && remaining > 0 ? (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-inter text-amber-700">
                    Solo te quedan <strong>{remaining}</strong> {remaining === 1 ? "pregunta" : "preguntas"} hoy
                  </span>
                  <span className="text-[10px] font-inter font-semibold text-amber-600">{remaining}/{DAILY_LIMIT}</span>
                </div>
              ) : null
            )}
            {!chatStarted && historyLoaded && (
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 bg-white flex-shrink-0 active:bg-electric-mint/20 active:border-electric-mint active:text-deep-forest transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {hasIncidents && onViewIncidents && (
              <button
                onClick={onViewIncidents}
                className="w-full flex items-center justify-center gap-2 text-sm font-inter text-deep-forest bg-gray-50 border border-gray-200 rounded-xl py-2 hover:bg-gray-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Ver mis incidencias
              </button>
            )}
            <button
              onClick={onIncidentRequest}
              className="w-full flex items-center justify-center gap-2 text-sm font-inter text-orange-600 bg-orange-50 border border-orange-200 rounded-xl py-2.5 hover:bg-orange-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Reportar incidencia o avería
            </button>
            {/* Contador compacto junto al input — visible cuando el chat está activo */}
            {chatStarted && remaining !== null && remaining > 5 && (
              <div className="flex justify-end">
                <span className="text-[10px] font-inter text-gray-400">
                  {remaining}/{DAILY_LIMIT} preguntas restantes hoy
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
                className="input-field text-sm py-2.5 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-11 h-11 bg-deep-forest text-electric-mint rounded-xl flex items-center justify-center hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
