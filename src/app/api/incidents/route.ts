import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailIncidencia, enviarEmailResolucion } from "@/lib/email";
import { ai } from "@/lib/gemini";

const VALID_CATEGORIES = ["electricity", "water", "wifi", "appliance", "access", "other"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

async function inferCategoryAndPriority(
  title: string,
  description: string
): Promise<{ category: string; priority: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Eres un clasificador de incidencias para alojamientos vacacionales.
Dado el título y descripción de una incidencia, devuelve ÚNICAMENTE un JSON con dos campos:
- "category": una de estas opciones exactas: electricity, water, wifi, appliance, access, other
- "priority": una de estas opciones exactas: low, medium, high, urgent

Criterios de prioridad:
- urgent: emergencias (inundación, incendio, sin luz en toda la casa, no pueden entrar)
- high: afecta al confort básico (aire acondicionado roto en verano, ducha sin agua caliente)
- medium: molestia notable pero manejable
- low: problema menor, no urgente

Responde SOLO con el JSON, sin explicaciones.`,
        temperature: 0,
        maxOutputTokens: 60,
      },
      contents: [{ role: "user", parts: [{ text: `Título: ${title}\nDescripción: ${description}` }] }],
    });

    const text = (response.text ?? "").trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "other",
      priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : "medium",
    };
  } catch {
    return { category: "other", priority: "medium" };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const ids = searchParams.get("ids");

    let where = {};
    if (ids) {
      where = { id: { in: ids.split(",").filter(Boolean) } };
    } else if (propertyId) {
      where = { propertyId };
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(incidents);
  } catch (error) {
    console.error("[INCIDENTS GET]", error);
    return NextResponse.json({ error: "Error al obtener incidencias." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      propertyId,
      sessionId,
      title,
      description,
      category,
      priority,
      guestName,
      guestEmail,
      photoUrl,
      scheduledAt,
    } = body;

    if (!propertyId || !title || !description) {
      return NextResponse.json(
        { error: "propertyId, título y descripción son obligatorios." },
        { status: 400 }
      );
    }

    // Inferir categoría y prioridad automáticamente con IA
    const inferred = await inferCategoryAndPriority(title, description);
    const finalCategory = inferred.category;
    const finalPriority = priority ?? inferred.priority;

    // Obtener datos de la propiedad para el email
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true, hostEmail: true, hostName: true },
    });

    const incident = await prisma.incident.create({
      data: {
        propertyId,
        title,
        description,
        category: finalCategory,
        priority: finalPriority,
        guestName,
        guestEmail,
        photoUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    // Bloquear la conversación del guest para preservación legal (prescripción 1-3 años)
    if (sessionId) {
      prisma.conversation.updateMany({
        where: { sessionId, propertyId },
        data: { isLocked: true, expiresAt: null },
      }).catch((err) => console.error("[RETENTION] Error bloqueando conversación:", err));
    }

    // Enviar email al anfitrión (sin bloquear la respuesta si falla)
    if (property?.hostEmail && process.env.RESEND_API_KEY) {
      enviarEmailIncidencia({
        hostEmail: property.hostEmail,
        hostName: property.hostName,
        propertyName: property.name,
        incidentTitle: title,
        incidentDescription: description,
        category: finalCategory,
        priority: finalPriority,
        guestName,
        guestEmail,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      }).catch((err) => console.error("[EMAIL]", err));
    }

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("[INCIDENTS POST]", error);
    return NextResponse.json({ error: "Error al crear incidencia." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    await prisma.incident.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[INCIDENTS DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar incidencia." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, scheduledAt } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
      include: { property: { select: { name: true, hostName: true } } },
    });

    // Notificar al huésped cuando la incidencia queda resuelta
    if (status === "resolved" && incident.guestEmail && process.env.RESEND_API_KEY) {
      enviarEmailResolucion({
        guestEmail: incident.guestEmail,
        guestName: incident.guestName ?? undefined,
        propertyName: incident.property.name,
        incidentTitle: incident.title,
        hostName: incident.property.hostName,
      }).catch((err) => console.error("[EMAIL RESOLUCIÓN]", err));
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error("[INCIDENTS PATCH]", error);
    return NextResponse.json({ error: "Error al actualizar incidencia." }, { status: 500 });
  }
}
