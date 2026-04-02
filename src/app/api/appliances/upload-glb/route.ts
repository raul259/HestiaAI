import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadGLB } from "@/lib/supabase/storage";

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("glb") as File | null;
    const applianceId = formData.get("applianceId") as string | null;
    const propertyId = formData.get("propertyId") as string | null;

    if (!file || !applianceId || !propertyId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "El archivo supera el límite de 50 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      return NextResponse.json({ error: "Solo se admiten archivos .glb o .gltf." }, { status: 400 });
    }

    const publicUrl = await uploadGLB(file, propertyId, applianceId);

    await prisma.appliance.update({
      where: { id: applianceId },
      data: { glbUrl: publicUrl },
    });

    return NextResponse.json({ glbUrl: publicUrl });
  } catch (error) {
    console.error("[UPLOAD GLB]", error);
    return NextResponse.json({ error: "Error al subir el modelo 3D." }, { status: 500 });
  }
}
