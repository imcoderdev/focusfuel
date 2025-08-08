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

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const reflections = await prisma.reflection.findMany({
    where: { userId: user.id, sessionDate: { gte: start } },
  });
  const counts: Record<string, number> = {};
  reflections.forEach((r: any) => {
    if (r.distractions) {
      r.distractions.split(/,|;/).forEach((d: any) => {
        const key = d.trim().toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const result = Object.entries(counts).map(([label, value]) => ({ label, value: Math.round((value / total) * 100) }));
  return NextResponse.json(result);
} 