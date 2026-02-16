import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { sendLeadEmail } from "@/agent/lib/mailer";

/**
 * POST /api/admin/leads/send
 * 
 * Force sends a specific lead transcript immediately.
 * Primarily used by sendBeacon when a user leaves the page.
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const sessionId = data.sessionId;

    if (!sessionId) return NextResponse.json({ error: "No sessionId provided" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    const session = await db.collection("sessions").findOne({ sessionId });
    
    // Only send if the session exists, isn't already emailed, and has content
    if (!session || session.status === "emailed" || !session.messages || session.messages.length < 2) {
      console.log(`ℹ️ Mailer: Skipping session ${sessionId} (Status: ${session?.status || 'NotFound'}, Messages: ${session?.messages?.length || 0})`);
      return NextResponse.json({ success: false, message: "Session ignored (empty or already sent)" });
    }

    // Identify guest name from messages (skipping common greetings)
    const commonGreetings = ['hi', 'hello', 'hey', 'yo', 'good morning', 'good afternoon', 'good evening', 'test', 'thanks', 'thank you'];
    const guestName = session.messages.find((m: any) => {
      if (m.role !== 'user') return false;
      const content = m.content.trim().toLowerCase();
      return content.length < 40 && !commonGreetings.includes(content);
    })?.content || session.messages.find((m: any) => m.role === 'user')?.content || "Valued Visitor";
    
    console.log(`🛫 Mailer: Dispatching immediate lead for ${guestName}...`);
    const success = await sendLeadEmail(guestName, session.messages);

    if (success) {
      await db.collection("sessions").updateOne(
        { sessionId },
        { $set: { status: "emailed", emailedAt: new Date() } }
      );
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("Immediate Lead Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
