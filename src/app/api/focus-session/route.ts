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
  const { startTime, duration } = await request.json();
  if (!startTime || typeof duration !== "number") {
    return NextResponse.json({ error: "startTime and duration are required" }, { status: 400 });
  }
  try {
    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        startTime: new Date(startTime),
        duration,
      },
    });
    return NextResponse.json({ success: true, session });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
} 