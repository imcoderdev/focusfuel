import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { mood } = await req.json();
    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: token.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const saved = await prisma.mood.create({
      data: {
        mood,
        userId: user.id,
      },
    });
    return NextResponse.json({ success: true, mood: saved });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }
} 