import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        appliances: { orderBy: { createdAt: "asc" } },
        incidents: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!property) {
      return NextResponse.json({ error: "Propiedad no encontrada." }, { status: 404 });
    }
    return NextResponse.json(property);
  } catch (error) {
    console.error("[PROPERTY GET]", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const propiedad = await prisma.property.findUnique({ where: { id: params.id } });
    if (!propiedad || propiedad.hostId !== user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await req.json();
    const property = await prisma.property.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(property);
  } catch (error) {
    console.error("[PROPERTY PUT]", error);
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const propiedad = await prisma.property.findUnique({ where: { id: params.id } });
    if (!propiedad || propiedad.hostId !== user.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    await prisma.property.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROPERTY DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 });
  }
}
