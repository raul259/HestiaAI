import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailRespuesta } from "@/lib/email";

export async function GET(req: NextRequest) {
  const incidentId = req.nextUrl.searchParams.get("incidentId");
  if (!incidentId) return NextResponse.json({ error: "Falta incidentId" }, { status: 400 });

  const notes = await prisma.incidentNote.findMany({
    where: { incidentId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const { incidentId, content, type } = await req.json();

  if (!incidentId || !content) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const noteType = type === "reply" ? "reply" : "internal";

  const note = await prisma.incidentNote.create({
    data: { incidentId, content, type: noteType },
  });

  if (noteType === "reply") {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { property: { select: { name: true, hostName: true } } },
    });

    if (incident?.guestEmail) {
      await enviarEmailRespuesta({
        guestEmail: incident.guestEmail,
        guestName: incident.guestName ?? undefined,
        propertyName: incident.property.name,
        incidentTitle: incident.title,
        hostName: incident.property.hostName,
        message: content,
      }).catch((err) => console.warn("[EMAIL]", err));
    }
  }

  return NextResponse.json(note);
}
