import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const moodScores: Record<string, number> = { happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 };

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const moods = await prisma.mood.findMany({
    where: { userId: user.id, createdAt: { gte: start } },
  });
  const result = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayMoods = moods.filter(m => m.createdAt.toISOString().slice(0, 10) === dateStr);
    const score = dayMoods.length ? Math.round(dayMoods.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / dayMoods.length) : 0;
    return { date: dateStr, score };
  });
  return NextResponse.json(result);
} 