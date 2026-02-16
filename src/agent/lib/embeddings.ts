const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

export async function getEmbeddings(text: string | string[]) {
  const apiKey = process.env.VOYAGE_AI_KEY;
  if (!apiKey) {
    console.warn("Missing VOYAGE_AI_KEY. Falling back to keyword search.");
    return null;
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: Array.isArray(text) ? text : [text],
        model: "voyage-3-lite",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Sentinel: Voyage AI Rate Limit Exceeded. Falling back to Keyword RAG.");
      } else {
        const errorText = await response.text();
        console.warn(`Sentinel: Voyage AI API Error (${response.status}):`, errorText);
      }
      return null;
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error("Error fetching embeddings from Voyage AI:", error);
    return null;
  }
}

/**
 * Basic Cosine Similarity for local vector search
 */
export function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}
