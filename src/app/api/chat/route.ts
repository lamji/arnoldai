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

    // 2. Perform parallel Vector Searches
    const [kaiserResults, aiKnowledgeResults] = await Promise.all([
      // A. Standard Industry Knowledge
      db.collection("kaiser_knowledge").aggregate([
        {
          "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": queryVector[0],
            "numCandidates": 50,
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
      ]).toArray(),

      // B. System Rules & User Corrections (High Priority)
      db.collection("ai_knowledge_embeddings").aggregate([
        {
          "$vectorSearch": {
            "index": "ai_knowledge_index", // Note: USER must create this index
            "path": "embedding",
            "queryVector": queryVector[0],
            "numCandidates": 50,
            "limit": 3
          }
        },
        {
          "$project": {
            "_id": 0,
            "text": 1,
            "sourceType": 1,
            "score": { "$meta": "vectorSearchScore" }
          }
        }
      ]).toArray()
    ]);

    let combinedContext = "";

    if (aiKnowledgeResults.length > 0) {
      combinedContext += "🚨 SYSTEM RULES & RECENT CORRECTIONS:\n";
      combinedContext += aiKnowledgeResults.map(r => `- ${r.text}`).join("\n");
      combinedContext += "\n\n";
    }

    if (kaiserResults.length > 0) {
      combinedContext += "[DATABASE RETRIEVED]:\n";
      combinedContext += kaiserResults.map(r => r.text).join("\n\n");
      combinedContext += "\n\n";
    }

    // Combine with core base knowledge for maximum stability
    combinedContext += `[CORE RULES]:\n${retrieveKnowledge(query)}`;

    return combinedContext;
  } catch (err) {
    console.error("RAG Database Error:", err);
    return retrieveKnowledge(query);
  }
}

import { isSameOrigin } from '@/agent/lib/security';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 🛡️ Security Guard: Only allow same-origin requests (from the official website)
    if (!(await isSameOrigin())) {
      return NextResponse.json({ error: "Unauthorized: External AI requests are blocked." }, { status: 401 });
    }

    const { messages, sessionId, syncOnly } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content;

    // 1. Log Session to Database (For Lead Tracking)
    if (sessionId) {
      const client = await clientPromise;
      const db = client.db("arnold-ai");
      
      await db.collection("sessions").updateOne(
        { sessionId },
        { 
          $set: { 
            messages, 
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            status: 'active'
          }
        },
        { upsert: true }
      );

      // If this is just a background sync, we're done.
      if (syncOnly) {
        return NextResponse.json({ success: true, message: "Session synchronized." });
      }
    }

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
