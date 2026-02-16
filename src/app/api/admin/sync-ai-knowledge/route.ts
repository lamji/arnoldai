import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { getEmbeddings } from "@/agent/lib/embeddings";
import { isAdmin } from "@/agent/lib/security";

/**
 * POST /api/admin/sync-ai-knowledge
 * 
 * Syncs 'knowledge_corrections' 
 * into a single searchable vector collection 'ai_knowledge_embeddings'.
 * (Can be expanded to include other collections like 'kaiser_knowledge' if needed)
 */
export async function POST(req: Request) {
  try {
    // 🛡️ Admin Guard: Only allow requests with a valid admin key
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized: Sync restricted to administrators." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    // 1. Fetch all rules, corrections and kaiser_knowledge
    const [rules, corrections, kaiserKnowledge] = await Promise.all([
      db.collection("airules").find({}).toArray(),
      db.collection("knowledge_corrections").find({}).toArray(),
      db.collection("kaiser_knowledge").find({}).toArray(),
    ]);

    const allDocs: any[] = [];

    // 2. Format Rules
    rules.forEach((r: any) => {
      allDocs.push({
        sourceId: r._id,
        sourceType: "rule",
        text: `🚨 PERMANENT SYSTEM RULE: ${r.rule}`,
        metadata: { importance: r.importance || "high" }
      });
    });

    // 3. Format Corrections
    corrections.forEach((c: any) => {
      allDocs.push({
        sourceId: c._id,
        sourceType: "correction",
        text: `USER CORRECTION (PRIORITY): The previous information was wrong. The correct fact is: ${c.correction}. Context: ${c.context || 'General knowledge'}`,
        metadata: { originalFact: c.originalFact, context: c.context }
      });
    });

    // 3. Format Kaiser Knowledge (Manual/Learned)
    kaiserKnowledge.forEach((k: any) => {
      allDocs.push({
        sourceId: k._id,
        sourceType: "knowledge",
        text: k.text,
        metadata: { source: k.source || "manual" }
      });
    });

    if (!allDocs.length) {
      return NextResponse.json({ success: true, message: "No AI knowledge found to sync." });
    }

    // 4. Clear existing embeddings
    await db.collection("ai_knowledge_embeddings").deleteMany({});

    // 5. Generate embeddings in batches
    const batchSize = 25;
    const finalVectorDocs: any[] = [];

    for (let i = 0; i < allDocs.length; i += batchSize) {
      const batch = allDocs.slice(i, i + batchSize);
      const textsToEmbed = batch.map(d => d.text);
      
      const embeddings = await getEmbeddings(textsToEmbed);
      
      if (!embeddings || embeddings.length !== batch.length) {
        throw new Error(`Failed to generate embeddings for batch starting at ${i}`);
      }

      batch.forEach((doc, idx) => {
        finalVectorDocs.push({
          ...doc,
          embedding: embeddings[idx],
          updatedAt: new Date()
        });
      });
    }

    // 6. Save to MongoDB
    if (finalVectorDocs.length > 0) {
      await db.collection("ai_knowledge_embeddings").insertMany(finalVectorDocs);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${finalVectorDocs.length} knowledge items to vector database.`,
      stats: {
        rules: rules.length,
        corrections: corrections.length,
        knowledge: kaiserKnowledge.length
      }
    });

  } catch (error: any) {
    console.error("Sync AI Knowledge Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
