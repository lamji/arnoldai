import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { getEmbeddings } from "@/agent/lib/embeddings";
import { isSameOrigin, isAdmin, isTrainedModeEnabled } from "@/agent/lib/security";

/**
 * POST /api/admin/corrections
 * 
 * Saves a new knowledge correction. 
 * Automatically re-embeds and updates the 'ai_knowledge_embeddings' collection.
 * 
 * Body: { originalFact?: string, correction: string, context?: string }
 */
export async function POST(req: Request) {
  try {
    // 🛡️ Mode Guard: Block if TRAINED_MODE is disabled
    if (!(await isTrainedModeEnabled())) {
      return NextResponse.json({ error: "Unauthorized: Learning mode is currently disabled." }, { status: 403 });
    }

    // 🛡️ Security Guard: Only allow same-origin requests (from the chat UI)
    // or requests with a valid admin key
    const sameOrigin = await isSameOrigin();
    const authorized = await isAdmin();

    if (!sameOrigin && !authorized) {
      return NextResponse.json({ error: "Unauthorized: Request rejected by security sentinel." }, { status: 401 });
    }

    const { originalFact, correction, context } = await req.json();

    if (!correction) {
      return NextResponse.json({ error: "Correction text is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    // 1. Save to master corrections collection
    const newCorrection = {
      originalFact: originalFact || "Previous system knowledge",
      correction,
      context: context || "General",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("knowledge_corrections").insertOne(newCorrection);
    const correctionId = result.insertedId;

    // 2. Generate embedding for RAG immediately
    // Note: In kaiserAgent, content is the field name often used, but here we'll use 'text' for consistency with retriever
    const textToEmbed = `USER CORRECTION (PRIORITY): The previous information was wrong. The correct fact is: ${correction}. Context: ${context || 'General knowledge'}`;
    const embedding = await getEmbeddings(textToEmbed);

    if (embedding && embedding[0]) {
      // 3. Save to the vector collection (ai_knowledge_embeddings)
      await db.collection("ai_knowledge_embeddings").insertOne({
        sourceId: correctionId,
        sourceType: "correction",
        text: textToEmbed,
        embedding: embedding[0],
        metadata: { originalFact, context },
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: "Correction saved and synced to RAG successfully.",
      id: correctionId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Knowledge Correction Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/corrections
 * Returns all corrections.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("arnold-ai");

    const corrections = await db
      .collection("knowledge_corrections")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, corrections });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
