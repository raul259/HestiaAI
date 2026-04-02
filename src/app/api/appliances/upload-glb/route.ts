import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGLBSignedUploadUrl, getGLBPublicUrl } from "@/lib/supabase/storage";

// GET → genera signed URL para subida directa cliente → Supabase
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const applianceId = searchParams.get("applianceId");
    const propertyId = searchParams.get("propertyId");

    if (!applianceId || !propertyId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const { signedUrl, path } = await createGLBSignedUploadUrl(propertyId, applianceId);
    return NextResponse.json({ signedUrl, path });
  } catch (error) {
    console.error("[UPLOAD GLB GET]", error);
    return NextResponse.json({ error: "Error generando URL de subida." }, { status: 500 });
  }
}

// PATCH → cliente confirma subida completada → actualizamos BD con URL pública
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { applianceId, propertyId } = body;

    if (!applianceId || !propertyId) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const glbUrl = getGLBPublicUrl(propertyId, applianceId);

    await prisma.appliance.update({
      where: { id: applianceId },
      data: { glbUrl },
    });

    return NextResponse.json({ glbUrl });
  } catch (error) {
    console.error("[UPLOAD GLB PATCH]", error);
    return NextResponse.json({ error: "Error actualizando modelo." }, { status: 500 });
  }
}
