import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { getEmbeddings } from "@/agent/lib/embeddings";
import { isSameOrigin, isAdmin } from "@/agent/lib/security";

/**
 * POST /api/admin/rules
 * 
 * Saves a new persona/behavior rule.
 * Automatically syncs to 'ai_knowledge_embeddings'.
 */
export async function POST(req: Request) {
  try {
    const sameOrigin = await isSameOrigin();
    const authorized = await isAdmin();

    if (!sameOrigin && !authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rule, importance } = await req.json();

    if (!rule) {
      return NextResponse.json({ error: "Rule text is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    const newRule = {
      rule,
      importance: importance || "high",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("airules").insertOne(newRule);
    const ruleId = result.insertedId;

    // Vectorize immediately for RAG
    const textToEmbed = `🚨 PERMANENT SYSTEM RULE: ${rule}`;
    const embedding = await getEmbeddings(textToEmbed);

    if (embedding && embedding[0]) {
      await db.collection("ai_knowledge_embeddings").insertOne({
        sourceId: ruleId,
        sourceType: "rule",
        text: textToEmbed,
        embedding: embedding[0],
        metadata: { importance: importance || "high" },
        updatedAt: new Date()
      });
    }

    console.log(`✅ System Rule Saved: ${rule}`);

    return NextResponse.json({
      success: true,
      message: "System rule saved and synced to brain successfully.",
      id: ruleId
    }, { status: 201 });

  } catch (error: any) {
    console.error("Rule Saving Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
