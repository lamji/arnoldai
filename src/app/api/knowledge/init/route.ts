import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("arnold-ai");

    // Check if we have a base knowledge document
    const baseKnowledge = await db.collection("metadata").findOne({ type: "base_knowledge" });

    // If no base knowledge found in DB, we'll signal the agent to use its fallback
    return NextResponse.json({
      success: true,
      status: "ready",
      database: "connected",
      hasCustomKnowledge: !!baseKnowledge,
      knowledge: baseKnowledge?.content || null,
      trainedMode: process.env.TRAINED_MODE === 'true'
    });

  } catch (error: any) {
    console.error("Initialization Error:", error);
    return NextResponse.json({ 
      success: false, 
      status: "error", 
      message: error.message 
    }, { status: 500 });
  }
}
