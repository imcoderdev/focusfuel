import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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