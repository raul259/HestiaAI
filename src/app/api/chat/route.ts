import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";
import { findRelevantChunks } from "@/lib/rag";
import { ChatMessage } from "@/types";

function buildBasePrompt(property: {
  name: string;
  address: string;
  description?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
  checkoutInstructions?: string | null;
  wasteInstructions?: string | null;
  emergencyContact?: string | null;
  hostName: string;
}): string {
  return `Eres Hestia, el asistente virtual inteligente del alojamiento "${property.name}".
Tu misión es ayudar a los huéspedes a resolver cualquier duda o incidencia de forma inmediata, amable y precisa.

## DATOS DEL ALOJAMIENTO
- Nombre: ${property.name}
- Dirección: ${property.address}
${property.description ? `- Descripción: ${property.description}` : ""}
- Anfitrión: ${property.hostName}

## CONECTIVIDAD WiFi
- Red WiFi: ${property.wifiName ?? "No configurada"}
- Contraseña: ${property.wifiPassword ?? "No configurada"}

## INSTRUCCIONES DE CHECK-OUT
${property.checkoutInstructions ?? "Sin instrucciones especiales."}

## GESTIÓN DE RESIDUOS
${property.wasteInstructions ?? "Sin instrucciones especiales."}

## CONTACTOS DE EMERGENCIA
${property.emergencyContact ?? "Contactar al anfitrión."}

## NÚMEROS DE EMERGENCIA NACIONALES (España)
Cuando el huésped pregunte por emergencias o números de teléfono de urgencia, DEBES listar TODOS estos números tal cual, sin resumir:
- 🚨 Emergencias generales: **112**
- 🚑 Ambulancia / Urgencias médicas: **061**
- 👮 Policía Nacional: **091**
- 👮 Policía Local: **092**
- 🔥 Bomberos: **080**`;
}

function buildRules(): string {
  return `## ALCANCE ESTRICTO — QUÉ PUEDES Y NO PUEDES RESPONDER

Eres un asistente EXCLUSIVAMENTE para este alojamiento. Tu único propósito es ayudar al huésped con:
- Información y funcionamiento del alojamiento (WiFi, check-out, residuos, acceso)
- Uso e instrucciones de los electrodomésticos de la vivienda
- Incidencias o averías dentro del alojamiento
- Dudas logísticas relacionadas con la estancia

NUNCA responderás sobre:
- Matemáticas, ciencias, idiomas u otras materias académicas
- Noticias, política, guerras, sucesos de actualidad
- Fallecimientos, historia o biografías de personas
- Tecnología general (qué móvil comprar, comparativas, etc.)
- Entretenimiento, deportes, música, cine
- Cualquier tema personal, emocional o de salud mental
- Cualquier otra consulta no relacionada directamente con el alojamiento

## PROTOCOLO PARA CONSULTAS FUERA DE ALCANCE

Si el huésped pregunta algo fuera del alcance anterior, responde SIEMPRE con este formato (en su idioma):
"Solo puedo ayudarte con dudas sobre el alojamiento, los electrodomésticos o incidencias durante tu estancia. Para esta consulta, te recomiendo buscar en Google o contactar con un servicio especializado. ¿Hay algo del apartamento en lo que pueda ayudarte?"

## PROTOCOLO ESPECIAL — TEMAS SENSIBLES O EMOCIONALES

Si el huésped menciona que se siente mal emocionalmente, está deprimido, solo, o expresa pensamientos de hacerse daño:
1. Muestra empatía brevemente y con calidez humana.
2. Indícale que contacte con una línea de ayuda o con alguien de confianza.
3. No intentes hacer de terapeuta ni profundizar en el tema.
4. Ejemplo de respuesta: "Lamento que te sientas así. Te animo a hablar con alguien de confianza o a llamar a una línea de apoyo emocional en tu país. Si necesitas ayuda con el alojamiento, aquí estoy."

## TUS REGLAS DE COMPORTAMIENTO:
1. IDIOMA — Detecta automáticamente el idioma en que escribe el huésped y responde SIEMPRE en ese mismo idioma. Si escribe en inglés, responde en inglés. Si escribe en alemán, responde en alemán. Si escribe en francés, responde en francés. Nunca respondas en español si el huésped no escribe en español. El hecho de que el contexto del alojamiento esté en español NO debe influir en el idioma de tu respuesta.
2. Sé conciso, amable y estructurado. Usa listas numeradas para pasos de procedimientos.
3. Si el huésped tiene un problema que no puedes resolver con instrucciones (avería grave, fuga, emergencia), indícale claramente que genere un ticket de incidencia pulsando el botón "Reportar incidencia" que tiene disponible.
4. Para problemas de agua cortada, electricidad cortada o emergencias urgentes, da siempre el contacto de emergencia.
5. Cuando expliques cómo usar un electrodoméstico, basa tu respuesta ÚNICAMENTE en el manual proporcionado.
6. Si te preguntan algo sobre el alojamiento que no está cubierto por la información que tienes, sé honesto e indica que no tienes esa información y que contacten con el anfitrión.
7. Siempre que sea posible, termina con una frase que confirme si el problema ha quedado resuelto.
8. MODELO 3D — Cuando expliques cómo usar un electrodoméstico que tenga la etiqueta [TIENE MODELO 3D INTERACTIVO], menciona al final de tu respuesta que el huésped puede pulsar el botón "Ver en 3D" para ver el modelo interactivo del electrodoméstico y encontrar visualmente los botones o partes mencionadas.
9. PREGUNTAS CONCRETAS — Cuando el huésped haga una pregunta AMPLIA o GENÉRICA sobre un electrodoméstico (ejemplos: "¿cómo funciona el lavavajillas?", "cuéntame sobre la lavadora", "explícame el horno"), NO vuelques todo el manual de golpe. En su lugar:
   a) Escribe UNA frase breve de introducción (máx. 1-2 frases).
   b) Añade EXACTAMENTE en la última línea de tu respuesta, sin nada después, el marcador:
      [SUGERENCIAS:"pregunta corta 1","pregunta corta 2","pregunta corta 3"]
   Las preguntas deben ser concretas, cortas (máx. 40 caracteres), en el idioma del huésped, y cubrir los usos más frecuentes de ese electrodoméstico.
   Ejemplo para lavavajillas: [SUGERENCIAS:"¿Cómo poner el detergente?","¿Qué programa elegir?","¿Por qué no enciende?"]
   Este marcador será procesado por la interfaz — no es texto visible para el huésped.
   SOLO usa este marcador para preguntas amplias sobre electrodomésticos. Para preguntas específicas, responde directamente sin marcador.`;
}

async function buildSystemPrompt(
  property: {
    id: string;
    name: string;
    address: string;
    description?: string | null;
    wifiName?: string | null;
    wifiPassword?: string | null;
    checkoutInstructions?: string | null;
    wasteInstructions?: string | null;
    emergencyContact?: string | null;
    hostName: string;
    appliances: { name: string; model?: string | null; category: string; manual: string; location?: string | null; glbUrl?: string | null }[];
  },
  userQuery: string
): Promise<string> {
  const base = buildBasePrompt(property);
  const rules = buildRules();

  // Intentar RAG: buscar los chunks más relevantes para la consulta
  // Si falla (sin chunks indexados, error de API, etc.) → fallback automático a todos los manuales
  let relevantChunks: { applianceName: string; chunkText: string; score: number }[] = [];
  if (userQuery.trim().length > 0) {
    try {
      relevantChunks = await findRelevantChunks(userQuery, property.id, 5);
    } catch (ragErr) {
      console.warn("[RAG] Búsqueda semántica fallida, usando fallback:", ragErr);
    }
  }

  if (relevantChunks.length > 0) {
    // RAG: solo los fragmentos más relevantes del manual
    const contextSection = relevantChunks
      .map((c) => {
        const appliance = property.appliances.find((a) => a.name === c.applianceName);
        const has3D = appliance?.glbUrl ? ` [TIENE MODELO 3D INTERACTIVO]` : "";
        return `## ${c.applianceName}${has3D}\n${c.chunkText}`;
      })
      .join("\n\n---\n\n");

    return `${base}

## INFORMACIÓN RELEVANTE DE ELECTRODOMÉSTICOS
(Fragmentos seleccionados por relevancia para esta consulta)

${contextSection}

---

${rules}`;
  }

  // Fallback: pasar todos los manuales si no hay chunks indexados
  const applianceSection = property.appliances
    .map(
      (a) =>
        `## ${a.name}${a.model ? ` (${a.model})` : ""}${a.location ? ` — ubicación: ${a.location}` : ""}${a.glbUrl ? ` [TIENE MODELO 3D INTERACTIVO]` : ""}\n${a.manual}`
    )
    .join("\n\n---\n\n");

  return `${base}

## MANUALES DE ELECTRODOMÉSTICOS

${applianceSection}

---

${rules}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const propertyId = searchParams.get("propertyId");

  if (!sessionId || !propertyId) {
    return NextResponse.json({ messages: [] });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { sessionId, propertyId },
  });

  if (!conversation) return NextResponse.json({ messages: [], remaining: 20 });

  const messages = JSON.parse(conversation.messages as string) as ChatMessage[];
  const isHostTest = sessionId.startsWith("host_test_");
  const userMsgCount = messages.filter((m) => m.role === "user").length;
  const remaining = isHostTest ? null : Math.max(0, 20 - userMsgCount);
  return NextResponse.json({ messages, remaining });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, sessionId, messages } = body as {
      propertyId: string;
      sessionId: string;
      messages: ChatMessage[];
    };

    if (!propertyId || !sessionId || !messages?.length) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos." },
        { status: 400 }
      );
    }

    // Rate limit: máximo 20 mensajes de usuario por sesión al día
    // Las sesiones de test del host (host_test_*) no tienen límite
    const isHostTest = sessionId.startsWith("host_test_");
    if (!isHostTest) {
      const DAILY_LIMIT = 20;
      const existingConv = await prisma.conversation.findFirst({
        where: { sessionId, propertyId },
      });
      if (existingConv) {
        const allMsgs = JSON.parse(existingConv.messages) as ChatMessage[];
        const userMsgCount = allMsgs.filter((m) => m.role === "user").length;
        if (userMsgCount >= DAILY_LIMIT) {
          return NextResponse.json(
            { error: "DAILY_LIMIT_REACHED" },
            { status: 429 }
          );
        }
      }
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { appliances: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    if (property.status === "inactive") {
      return NextResponse.json(
        { error: "PROPERTY_INACTIVE" },
        { status: 403 }
      );
    }

    // Tomar la última pregunta del usuario como consulta para RAG
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const systemPrompt = await buildSystemPrompt(property, lastUserMessage);

    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiConfig = {
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        temperature: 0.4,
      },
      contents: geminiContents,
    };

    let response;
    const FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
    try {
      response = await ai.models.generateContent({ model: "gemini-2.5-flash", ...geminiConfig });
    } catch (primaryErr) {
      const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      const isTransient = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      if (isTransient) {
        let lastErr = primaryErr;
        for (const fallback of FALLBACK_MODELS) {
          try {
            console.warn(`[CHAT] gemini-2.5-flash no disponible, probando ${fallback}`);
            response = await ai.models.generateContent({ model: fallback, ...geminiConfig });
            break;
          } catch (fallbackErr) {
            lastErr = fallbackErr;
          }
        }
        if (!response) throw lastErr;
      } else {
        throw primaryErr;
      }
    }

    let reply: string;
    try {
      reply = response.text ?? "Lo siento, no he podido procesar tu consulta. Inténtalo de nuevo.";
    } catch {
      // response.text lanza si la respuesta fue bloqueada o filtrada por seguridad
      reply = "Lo siento, no puedo responder a esa pregunta en este momento. Inténtalo de nuevo o reformula tu consulta.";
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: { sessionId, propertyId },
      select: { id: true, messages: true, isLocked: true },
    });

    const allMessages: ChatMessage[] = [
      ...(existingConversation
        ? (JSON.parse(existingConversation.messages) as ChatMessage[])
        : []),
      messages[messages.length - 1],
      { role: "assistant", content: reply },
    ];

    // Retención referenciada: expiresAt se recalcula en cada mensaje (referenciado a la última actividad)
    // host_test → 24 h | guest → 60 días desde el último mensaje
    const convType = isHostTest ? "host_test" : "guest";
    const retentionDays = isHostTest ? 1 : 60;
    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

    if (existingConversation) {
      // Solo actualizar expiresAt si la conversación no está bloqueada (incidencia)
      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          messages: JSON.stringify(allMessages),
          ...(!existingConversation.isLocked && { expiresAt }),
        },
      });
    } else {
      await prisma.conversation.create({
        data: {
          propertyId,
          sessionId,
          messages: JSON.stringify(allMessages),
          type: convType,
          expiresAt,
        },
      });
    }

    const finalUserCount = allMessages.filter((m) => m.role === "user").length;
    const remaining = isHostTest ? null : Math.max(0, 20 - finalUserCount);
    return NextResponse.json({ reply, sessionId, remaining });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CHAT API]", msg);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: msg },
      { status: 500 }
    );
  }
}
