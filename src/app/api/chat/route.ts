import { Groq } from 'groq-sdk';
import { retrieveKnowledge } from '@/agent/knowledge/retriever';
import { getEmbeddings } from '@/agent/lib/embeddings';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const runtime = 'nodejs';

import clientPromise from '@/agent/lib/mongodb';

/**
 * Advanced Semantic Retrieval for RAG (Database-Driven)
 */
async function getEnhancedKnowledge(query: string) {
  try {
    const apiKey = process.env.VOYAGE_AI_KEY;
    if (!apiKey) return retrieveKnowledge(query);

    const queryVector = await getEmbeddings(query);
    if (!queryVector || !queryVector[0]) return retrieveKnowledge(query);

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    // Atlas Vector Search on the kaiser_knowledge collection
    const results = await db.collection("kaiser_knowledge").aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index", // Assumes a vector index named 'vector_index' exists
          "path": "embedding",
          "queryVector": queryVector[0],
          "numCandidates": 100,
          "limit": 3
        }
      },
      {
        "$project": {
          "_id": 0,
          "text": 1,
          "score": { "$meta": "vectorSearchScore" }
        }
      }
    ]).toArray();

    if (results.length > 0) {
      const dbKnowledge = results.map(r => r.text).join("\n\n");
      // Combine with core base knowledge for maximum stability
      return `[DATABASE RETRIEVED]: ${dbKnowledge}\n\n[CORE RULES]: ${retrieveKnowledge(query)}`;
    }

    return retrieveKnowledge(query);
  } catch (err) {
    console.error("RAG Database Error:", err);
    return retrieveKnowledge(query);
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content;

    // 1. Server-side RAG
    const knowledge = await getEnhancedKnowledge(lastUserMessage);

    // 2. Inject knowledge into the system prompt
    if (messages[0] && messages[0].role === 'system') {
      messages[0].content = messages[0].content.replace("Retrieving...", knowledge);
    }

    const chatCompletion: any = await groq.chat.completions.create({
      messages,
      model: "groq/compound-mini",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null,
      compound_custom: {
        tools: {
          enabled_tools: [
            "web_search",
            "code_interpreter",
            "visit_website"
          ]
        }
      }
    } as any); // Type cast as any since compound_custom might not be in official types yet

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Groq API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
