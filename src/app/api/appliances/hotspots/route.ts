import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const applianceId = new URL(req.url).searchParams.get("applianceId");
  if (!applianceId) return NextResponse.json({ error: "applianceId requerido." }, { status: 400 });

  const hotspots = await prisma.applianceHotspot.findMany({
    where: { applianceId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(hotspots);
}

export async function POST(req: NextRequest) {
  try {
    const { applianceId, label, positionX, positionY, positionZ } = await req.json();
    if (!applianceId || !label) {
      return NextResponse.json({ error: "applianceId y label son obligatorios." }, { status: 400 });
    }
    const hotspot = await prisma.applianceHotspot.create({
      data: { applianceId, label, positionX, positionY, positionZ },
    });
    return NextResponse.json(hotspot, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear el hotspot." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido." }, { status: 400 });
  await prisma.applianceHotspot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
