import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Get user from Supabase auth using request cookies
  const supabase = createServerSupabaseClientFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized - Please log in first" }, { status: 401 });
  }

  // Check if user profile exists in our database
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return NextResponse.json({ 
      error: "User profile not found. Please complete your profile setup." 
    }, { status: 404 });
  }

  const bonsais = await prisma.focusSession.count({ where: { userId: user.id } });
  const totalFocusTimeMinutes = await prisma.reflection.aggregate({
    _sum: { duration: true },
    where: { userId: user.id },
  });
  const completedTasks = await prisma.task.count({ where: { userId: user.id, completed: true } });
  const moods = await prisma.mood.findMany({ where: { userId: user.id } });
  // Map moods to scores: happy=5, focused=4, meh=3, tired=2, stressed=2, sad=1
  const moodScoreMap: Record<string, number> = { happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 };
  const moodScores = moods.map((m: any) => {
    const mood = m.mood as keyof typeof moodScoreMap;
    return moodScoreMap[mood] || 3;
  });
  const averageMoodScore = moodScores.length ? (moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length) : null;
  return NextResponse.json({
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    image: user.user_metadata?.avatar_url || null,
    bonsais,
    totalFocusTime: totalFocusTimeMinutes._sum.duration ? totalFocusTimeMinutes._sum.duration / 60 : 0, // hours
    completedTasks,
    averageMoodScore,
  });
} 