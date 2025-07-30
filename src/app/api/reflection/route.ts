import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { stayedFocused, distractions, duration } = await request.json();
  if (typeof stayedFocused !== "boolean" || typeof duration !== "number") {
    return NextResponse.json({ error: "stayedFocused (boolean) and duration (int) are required" }, { status: 400 });
  }
  try {
    const reflection = await prisma.reflection.create({
      data: {
        userId: user.id,
        sessionDate: new Date(),
        stayedFocused,
        distractions,
        duration,
      },
    });
    return NextResponse.json({ success: true, reflection });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 });
  }
} 