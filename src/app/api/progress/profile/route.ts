import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const bonsais = await prisma.focusSession.count({ where: { userId: user.id } });
  const totalFocusTimeMinutes = await prisma.reflection.aggregate({
    _sum: { duration: true },
    where: { userId: user.id },
  });
  const completedTasks = await prisma.task.count({ where: { userId: user.id, completed: true } });
  const moods = await prisma.mood.findMany({ where: { userId: user.id } });
  // Map moods to scores: happy=5, focused=4, meh=3, tired=2, stressed=2, sad=1
  const moodScoreMap = { happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 };
  const moodScores = moods.map(m => moodScoreMap[m.mood] || 3);
  const averageMoodScore = moodScores.length ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length) : null;
  return NextResponse.json({
    name: user.name,
    email: user.email,
    image: user.image,
    bonsais,
    totalFocusTime: totalFocusTimeMinutes._sum.duration ? totalFocusTimeMinutes._sum.duration / 60 : 0, // hours
    completedTasks,
    averageMoodScore,
  });
} 