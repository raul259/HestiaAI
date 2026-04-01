"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertTriangle, Box } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, Appliance } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  sessionId: string;
  onIncidentRequest: () => void;
  appliances?: Appliance[];
  onOpenAppliance?: (appliance: Appliance) => void;
}

function detectAppliance(text: string, appliances: Appliance[]): Appliance | null {
  const lower = text.toLowerCase();
  return appliances.find((a) => lower.includes(a.name.toLowerCase())) ?? null;
}

const I18N: Record<string, { greeting: string; questions: string[] }> = {
  es: {
    greeting: "¡Hola! Soy **Hestia**, tu asistente virtual para este alojamiento. Estoy aquí para ayudarte con cualquier duda sobre el apartamento, los electrodomésticos o cualquier incidencia. ¿En qué puedo ayudarte?",
    questions: ["¿Cuál es la contraseña del WiFi?", "¿Cómo enciendo el aire acondicionado?", "¿A qué hora es el check-out?", "¿Dónde tiro la basura?"],
  },
  en: {
    greeting: "Hi! I'm **Hestia**, your virtual assistant for this accommodation. I'm here to help with any questions about the apartment, appliances or any issue you may have. How can I help you?",
    questions: ["What's the WiFi password?", "How do I turn on the air conditioning?", "What time is check-out?", "Where do I put the rubbish?"],
  },
  fr: {
    greeting: "Bonjour ! Je suis **Hestia**, votre assistant virtuel pour ce logement. Je suis là pour vous aider avec toute question sur l'appartement, les appareils ou tout incident. Comment puis-je vous aider ?",
    questions: ["Quel est le mot de passe WiFi ?", "Comment allumer la climatisation ?", "À quelle heure est le check-out ?", "Où jeter les ordures ?"],
  },
  de: {
    greeting: "Hallo! Ich bin **Hestia**, Ihr virtueller Assistent für diese Unterkunft. Ich helfe Ihnen gerne bei Fragen zur Wohnung, den Geräten oder bei Problemen. Wie kann ich Ihnen helfen?",
    questions: ["Was ist das WLAN-Passwort?", "Wie schalte ich die Klimaanlage ein?", "Wann ist der Check-out?", "Wo kommt der Müll hin?"],
  },
  it: {
    greeting: "Ciao! Sono **Hestia**, il tuo assistente virtuale per questo alloggio. Sono qui per aiutarti con qualsiasi domanda sull'appartamento, gli elettrodomestici o qualsiasi problema. Come posso aiutarti?",
    questions: ["Qual è la password del WiFi?", "Come accendo l'aria condizionata?", "A che ora è il check-out?", "Dove butto la spazzatura?"],
  },
  pt: {
    greeting: "Olá! Sou a **Hestia**, sua assistente virtual para este alojamento. Estou aqui para ajudá-lo com qualquer dúvida sobre o apartamento, eletrodomésticos ou qualquer incidente. Como posso ajudar?",
    questions: ["Qual é a senha do WiFi?", "Como ligo o ar condicionado?", "A que horas é o check-out?", "Onde coloco o lixo?"],
  },
  nl: {
    greeting: "Hallo! Ik ben **Hestia**, uw virtuele assistent voor dit verblijf. Ik help u graag met vragen over het appartement, apparaten of problemen. Hoe kan ik u helpen?",
    questions: ["Wat is het WiFi-wachtwoord?", "Hoe zet ik de airconditioning aan?", "Hoe laat is de check-out?", "Waar gooi ik het afval?"],
  },
};

function detectLang(): string {
  if (typeof window === "undefined") return "es";
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  return I18N[lang] ? lang : "en";
}

export default function ChatInterface({ propertyId, sessionId, onIncidentRequest, appliances = [], onOpenAppliance }: Props) {
  const lang = detectLang();
  const { greeting, questions } = I18N[lang];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting },
  ]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Recuperar conversación guardada al montar
  useEffect(() => {
    fetch(`/api/chat?sessionId=${sessionId}&propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages([{ role: "assistant", content: greeting }, ...data.messages]);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error de conexión. Comprueba tu internet e inténtalo de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
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
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-deep-forest text-electric-mint"
                  : "bg-electric-mint text-deep-forest"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className="space-y-2">
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
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === "assistant" && onOpenAppliance && (() => {
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
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-xl bg-electric-mint text-deep-forest flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-electric-mint" />
              <span className="text-sm text-gray-400 font-inter">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && historyLoaded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              className="text-xs font-inter bg-electric-mint/10 text-deep-forest border border-electric-mint/30 rounded-full px-3 py-1.5 hover:bg-electric-mint/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 p-4 space-y-3">
        <button
          onClick={onIncidentRequest}
          className="w-full flex items-center justify-center gap-2 text-sm font-inter text-orange-600 bg-orange-50 border border-orange-200 rounded-xl py-2.5 hover:bg-orange-100 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Reportar incidencia o avería
        </button>

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
  );
}
