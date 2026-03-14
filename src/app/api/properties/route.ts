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
