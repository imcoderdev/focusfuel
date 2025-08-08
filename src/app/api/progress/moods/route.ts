import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const moodScores: Record<string, number> = { happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 };

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
    const dayMoods = moods.filter((m: any) => m.createdAt.toISOString().slice(0, 10) === dateStr);
    const score = dayMoods.length ? Math.round(dayMoods.reduce((sum: any, m: any) => {
      const mood = m.mood as keyof typeof moodScores;
      return sum + (moodScores[mood] || 3);
    }, 0) / dayMoods.length) : 0;
    return { date: dateStr, score };
  });
  return NextResponse.json(result);
} 