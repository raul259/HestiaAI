import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailIncidencia, enviarEmailResolucion } from "@/lib/email";

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
      title,
      description,
      category,
      priority,
      guestName,
      guestEmail,
      scheduledAt,
    } = body;

    if (!propertyId || !title || !description || !category) {
      return NextResponse.json(
        { error: "propertyId, título, descripción y categoría son obligatorios." },
        { status: 400 }
      );
    }

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
        category,
        priority: priority ?? "medium",
        guestName,
        guestEmail,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    // Enviar email al anfitrión (sin bloquear la respuesta si falla)
    if (property?.hostEmail && process.env.RESEND_API_KEY) {
      enviarEmailIncidencia({
        hostEmail: property.hostEmail,
        hostName: property.hostName,
        propertyName: property.name,
        incidentTitle: title,
        incidentDescription: description,
        category,
        priority: priority ?? "medium",
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
