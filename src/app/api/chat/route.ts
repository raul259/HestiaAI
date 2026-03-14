import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/gemini";
import { ChatMessage } from "@/types";

function buildSystemPrompt(property: {
  name: string;
  address: string;
  description?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
  checkoutInstructions?: string | null;
  wasteInstructions?: string | null;
  emergencyContact?: string | null;
  hostName: string;
  appliances: { name: string; model?: string | null; category: string; manual: string; location?: string | null }[];
}): string {
  const applianceSection = property.appliances
    .map(
      (a) =>
        `## ${a.name}${a.model ? ` (${a.model})` : ""}${a.location ? ` — ubicación: ${a.location}` : ""}\n${a.manual}`
    )
    .join("\n\n---\n\n");

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

## MANUALES DE ELECTRODOMÉSTICOS

${applianceSection}

---

## TUS REGLAS DE COMPORTAMIENTO:
1. Responde siempre en el mismo idioma que el huésped.
2. Sé conciso, amable y estructurado. Usa listas numeradas para pasos de procedimientos.
3. Si el huésped tiene un problema que no puedes resolver con instrucciones (avería grave, fuga, emergencia), indícale claramente que genere un ticket de incidencia pulsando el botón "Reportar incidencia" que tiene disponible.
4. Para problemas de agua cortada, electricidad cortada o emergencias urgentes, da siempre el contacto de emergencia.
5. Cuando expliques cómo usar un electrodoméstico, basa tu respuesta ÚNICAMENTE en el manual proporcionado arriba.
6. Si te preguntan algo que no está cubierto por la información que tienes, sé honesto e indica que no tienes esa información y que contacten con el anfitrión.
7. Siempre que sea posible, termina con una frase que confirme si el problema ha quedado resuelto.`;
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

    const systemPrompt = buildSystemPrompt(property);

    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 800,
        temperature: 0.4,
      },
      contents: geminiContents,
    });

    const reply: string =
      response.text ?? "Lo siento, no he podido procesar tu consulta. Inténtalo de nuevo.";

    const existingConversation = await prisma.conversation.findFirst({
      where: { sessionId, propertyId },
    });

    const allMessages: ChatMessage[] = [
      ...(existingConversation
        ? (JSON.parse(existingConversation.messages) as ChatMessage[])
        : []),
      messages[messages.length - 1],
      { role: "assistant", content: reply },
    ];

    if (existingConversation) {
      await prisma.conversation.update({
        where: { id: existingConversation.id },
        data: { messages: JSON.stringify(allMessages) },
      });
    } else {
      await prisma.conversation.create({
        data: {
          propertyId,
          sessionId,
          messages: JSON.stringify(allMessages),
        },
      });
    }

    return NextResponse.json({ reply, sessionId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CHAT API]", msg);
    return NextResponse.json(
      { error: "Error interno del servidor.", detail: msg },
      { status: 500 }
    );
  }
}
