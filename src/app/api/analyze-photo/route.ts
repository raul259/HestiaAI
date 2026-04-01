import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Eres un asistente técnico para alojamientos vacacionales.
Analiza la imagen y describe el problema o avería que se muestra de forma clara y concisa en español.
Devuelve solo la descripción del problema, sin saludos ni explicaciones adicionales.
Máximo 3 frases. Sé específico sobre qué está roto, dañado o mal.`,
        maxOutputTokens: 200,
        temperature: 0.2,
      },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: "Describe el problema o avería que ves en esta imagen." },
          ],
        },
      ],
    });

    const description = response.text?.trim() ?? "No se pudo analizar la imagen.";
    return NextResponse.json({ description });
  } catch (error) {
    console.error("[ANALYZE PHOTO]", error);
    return NextResponse.json({ error: "Error al analizar la imagen." }, { status: 500 });
  }
}
