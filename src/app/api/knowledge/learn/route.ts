import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { getEmbeddings } from "@/agent/lib/embeddings";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    // 1. Vectorize the new knowledge
    const embedding = await getEmbeddings(content);
    
    // 2. Store in the kaiser_knowledge collection for future RAG retrieval
    await db.collection("kaiser_knowledge").insertOne({
      text: content,
      embedding: embedding ? embedding[0] : null,
      source: "user_correction",
      timestamp: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: "Knowledge synchronized to sentinel database." 
    });

  } catch (error: any) {
    console.error("Learning Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
