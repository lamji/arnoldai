import { NextResponse } from "next/server";
import clientPromise from "@/agent/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("arnold-ai");

    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ 
      success: true, 
      token,
      user: { username: user.username, role: user.role }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
