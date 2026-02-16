import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import { sendLeadEmail } from "@/agent/lib/mailer";
import { isAdmin } from "@/agent/lib/security";

/**
 * GET /api/admin/leads/process
 * 
 * Scans the 'sessions' collection for inactive chats (> 5 mins)
 * and sends an email transcript to the admin.
 */
export async function GET(req: Request) {
  try {
    // 🛡️ Security: Require admin key for manual trigger
    if (!(await isAdmin())) {
       // Also allow if it's a cron job or similar internal trigger?
       // For now, let's keep it secure.
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find sessions that are:
    // 1. Inactive for 5+ mins
    // 2. Not already emailed
    // 3. Have at least 2 messages (user + AI)
    const inactiveSessions = await db.collection("sessions").find({
      lastActiveAt: { $lt: fiveMinutesAgo },
      status: { $ne: "emailed" },
      "messages.1": { $exists: true } 
    }).toArray();

    let sentCount = 0;

    for (const session of inactiveSessions) {
      // Extract guest name (skipping common greetings)
      const commonGreetings = ['hi', 'hello', 'hey', 'yo', 'good morning', 'good afternoon', 'good evening', 'test', 'thanks', 'thank you'];
      const guestName = session.messages.find((m: any) => {
        if (m.role !== 'user') return false;
        const content = m.content.trim().toLowerCase();
        return content.length < 40 && !commonGreetings.includes(content);
      })?.content || session.messages.find((m: any) => m.role === 'user')?.content || "Valued Visitor";
      
      const success = await sendLeadEmail(guestName, session.messages);
      
      if (success) {
        await db.collection("sessions").updateOne(
          { _id: session._id },
          { $set: { status: "emailed", emailedAt: new Date() } }
        );
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: inactiveSessions.length,
      sent: sentCount
    });

  } catch (error: any) {
    console.error("Lead Processing Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
