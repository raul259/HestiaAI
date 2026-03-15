import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Se requiere un archivo PDF." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El PDF no puede superar 10 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);

    const texto = data.text.trim();
    if (!texto) {
      return NextResponse.json(
        { error: "No se pudo extraer texto del PDF. Puede ser un PDF escaneado sin OCR." },
        { status: 422 }
      );
    }

    return NextResponse.json({ texto, paginas: data.numpages });
  } catch (error) {
    console.error("[UPLOAD MANUAL]", error);
    return NextResponse.json({ error: "Error al procesar el PDF." }, { status: 500 });
  }
}
