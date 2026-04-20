import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/cleanup
 * Limpieza automática de conversaciones expiradas.
 * - Elimina conversaciones donde expiresAt < ahora Y isLocked = false
 * - Las conversaciones bloqueadas (isLocked = true) nunca se borran aquí
 *   → son las asociadas a incidencias (retención legal 1-3 años)
 *
 * Protección: requiere el header Authorization: Bearer <CRON_SECRET>
 * Vercel inyecta este header automáticamente en los cron jobs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.conversation.deleteMany({
      where: {
        isLocked: false,
        expiresAt: { lt: now },
      },
    });

    console.log(`[CRON CLEANUP] Eliminadas ${result.count} conversaciones expiradas.`);

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CRON CLEANUP]", msg);
    return NextResponse.json({ error: "Error en limpieza.", detail: msg }, { status: 500 });
  }
}
