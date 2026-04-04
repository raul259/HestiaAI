import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutos — necesario para PDFs grandes

const MAX_CHARS = 150_000; // ~300 páginas de texto

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Se requiere un archivo PDF." }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { default: pdfParse } = await import("pdf-parse");
    const data = await pdfParse(buffer);

    let texto = data.text.trim();
    if (!texto) {
      return NextResponse.json(
        { error: "No se pudo extraer texto del PDF. Puede ser un PDF escaneado sin OCR." },
        { status: 422 }
      );
    }

    // Truncar si supera el límite para no sobrecargar la BD ni el contexto de la IA
    if (texto.length > MAX_CHARS) {
      texto = texto.slice(0, MAX_CHARS);
    }

    return NextResponse.json({ texto, paginas: data.numpages });
  } catch (error) {
    console.error("[UPLOAD MANUAL]", error);
    return NextResponse.json({ error: "Error al procesar el PDF." }, { status: 500 });
  }
}
