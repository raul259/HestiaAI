import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { uploadIncidentPhoto } from "@/lib/supabase/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
    }

    const propertyId = formData.get("propertyId") as string | null;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const moderationResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Eres un sistema de moderación de contenido para una app de alojamientos turísticos.
Tu única tarea es determinar si la imagen es apropiada para reportar una avería o problema en un alojamiento.
Responde SOLO con un JSON con este formato exacto:
{"apropiada": true, "motivo": ""}
{"apropiada": false, "motivo": "Descripción breve del problema"}

Una imagen es NO apropiada si contiene: desnudos, contenido sexual, violencia explícita o contenido ofensivo.
Una imagen ES apropiada si muestra: electrodomésticos, habitaciones, averías, daños, instalaciones o cualquier elemento de un alojamiento.`,
        maxOutputTokens: 100,
        temperature: 0,
      },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: "¿Es esta imagen apropiada para reportar una avería?" },
          ],
        },
      ],
    });

    let moderationResult = { apropiada: true, motivo: "" };
    try {
      const raw = moderationResponse.text?.trim() ?? "{}";
      const jsonMatch = raw.match(/\{.*\}/s);
      if (jsonMatch) moderationResult = JSON.parse(jsonMatch[0]);
    } catch {
      // Si falla el parseo, dejamos pasar la imagen
    }

    if (!moderationResult.apropiada) {
      return NextResponse.json(
        { error: "La imagen no es apropiada para este uso. Por favor sube una foto de la avería." },
        { status: 400 }
      );
    }

    const [response, photoUrl] = await Promise.all([
      ai.models.generateContent({
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
      }),
      propertyId
        ? uploadIncidentPhoto(propertyId, buffer, mimeType).catch(() => null)
        : Promise.resolve(null),
    ]);

    const description = response.text?.trim() ?? "No se pudo analizar la imagen.";
    return NextResponse.json({ description, photoUrl });
  } catch (error) {
    console.error("[ANALYZE PHOTO]", error);
    return NextResponse.json({ error: "Error al analizar la imagen." }, { status: 500 });
  }
}
