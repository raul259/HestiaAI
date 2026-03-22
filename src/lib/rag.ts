import { ai } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

// Divide el texto del manual en fragmentos de ~1000 caracteres respetando párrafos
export function chunkText(text: string, maxChars = 1000): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// Genera el embedding de un texto usando text-embedding-004 (768 dimensiones)
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: [text],
  });
  return response.embeddings?.[0]?.values ?? [];
}

// Similitud coseno entre dos vectores
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

// Indexa el manual de un electrodoméstico: divide en chunks y genera embeddings
export async function indexAppliance(
  applianceId: string,
  applianceName: string,
  manual: string
): Promise<void> {
  // Eliminar chunks anteriores
  await prisma.manualChunk.deleteMany({ where: { applianceId } });

  const chunks = chunkText(manual);

  for (let i = 0; i < chunks.length; i++) {
    // Incluir el nombre del electrodoméstico como contexto en el embedding
    const contextualText = `${applianceName}: ${chunks[i]}`;
    const embedding = await generateEmbedding(contextualText);

    await prisma.manualChunk.create({
      data: {
        applianceId,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: JSON.stringify(embedding),
      },
    });
  }
}

// Busca los chunks más relevantes para una consulta dentro de una propiedad
export async function findRelevantChunks(
  query: string,
  propertyId: string,
  topK = 5,
  minScore = 0.45
): Promise<{ applianceName: string; chunkText: string; score: number }[]> {
  const queryEmbedding = await generateEmbedding(query);

  const chunks = await prisma.manualChunk.findMany({
    where: { appliance: { propertyId } },
    include: {
      appliance: { select: { name: true, model: true, location: true } },
    },
  });

  if (chunks.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const name =
      chunk.appliance.name +
      (chunk.appliance.model ? ` (${chunk.appliance.model})` : "") +
      (chunk.appliance.location ? ` — ${chunk.appliance.location}` : "");
    return {
      applianceName: name,
      chunkText: chunk.chunkText,
      score: cosineSimilarity(
        queryEmbedding,
        JSON.parse(chunk.embedding) as number[]
      ),
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score >= minScore);
}
