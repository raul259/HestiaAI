import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      where: { hostId: user.id },
      include: {
        _count: {
          select: { appliances: true, incidents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(properties);
  } catch (error) {
    console.error("[PROPERTIES GET]", error);
    return NextResponse.json({ error: "Error al obtener propiedades." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      address,
      description,
      wifiName,
      wifiPassword,
      checkoutInstructions,
      wasteInstructions,
      emergencyContact,
      hostName,
      hostEmail,
      accessCode,
    } = body;

    if (!name || !address || !hostName || !hostEmail) {
      return NextResponse.json(
        { error: "Nombre, dirección, nombre del anfitrión y email son obligatorios." },
        { status: 400 }
      );
    }

    const existing = await prisma.property.findFirst({
      where: {
        hostId: user.id,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya tienes una propiedad con ese nombre. Usa un nombre diferente para distinguirlas." },
        { status: 409 }
      );
    }

    const property = await prisma.property.create({
      data: {
        hostId: user.id,
        name,
        address,
        description,
        wifiName,
        wifiPassword,
        checkoutInstructions,
        wasteInstructions,
        emergencyContact,
        hostName,
        hostEmail,
        accessCode,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("[PROPERTIES POST]", error);
    return NextResponse.json({ error: "Error al crear propiedad." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const { id, status } = await req.json();
    const VALID_STATUSES = ["active", "occupied", "inactive"];
    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    const property = await prisma.property.updateMany({
      where: { id, hostId: user.id },
      data: { status },
    });

    return NextResponse.json(property);
  } catch (error) {
    console.error("[PROPERTIES PATCH]", error);
    return NextResponse.json({ error: "Error al actualizar propiedad." }, { status: 500 });
  }
}
