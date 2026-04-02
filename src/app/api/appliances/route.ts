import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { indexAppliance } from "@/lib/rag";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const where = propertyId ? { propertyId } : {};
    const appliances = await prisma.appliance.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(appliances);
  } catch (error) {
    console.error("[APPLIANCES GET]", error);
    return NextResponse.json({ error: "Error al obtener electrodomésticos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, name, model, category, manual, location } = body;

    if (!propertyId || !name || !category) {
      return NextResponse.json(
        { error: "propertyId, nombre y categoría son obligatorios." },
        { status: 400 }
      );
    }

    const appliance = await prisma.appliance.create({
      data: { propertyId, name, model, category, manual: manual ?? "", location },
    });

    if (manual) {
      indexAppliance(appliance.id, name, manual).catch((err) =>
        console.error("[RAG] Error indexando manual:", err)
      );
    }

    return NextResponse.json(appliance, { status: 201 });
  } catch (error) {
    console.error("[APPLIANCES POST]", error);
    return NextResponse.json({ error: "Error al crear electrodoméstico." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, manual } = body;

    if (!id || !manual) {
      return NextResponse.json({ error: "id y manual son obligatorios." }, { status: 400 });
    }

    const appliance = await prisma.appliance.update({
      where: { id },
      data: { manual },
    });

    indexAppliance(appliance.id, appliance.name, manual).catch((err) =>
      console.error("[RAG] Error indexando manual:", err)
    );

    return NextResponse.json(appliance);
  } catch (error) {
    console.error("[APPLIANCES PATCH]", error);
    return NextResponse.json({ error: "Error al actualizar manual." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    }
    await prisma.appliance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[APPLIANCES DELETE]", error);
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 });
  }
}
