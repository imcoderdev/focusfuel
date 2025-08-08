import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

// Service role client to bypass RLS
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('email');
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find user based on email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ 
        reflections: [],
        message: "No user found" 
      });
    }

    // Get all reflections for the user
    const reflections = await prisma.reflection.findMany({
      where: { userId: user.id },
      orderBy: { sessionDate: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      reflections,
      count: reflections.length,
      message: `Found ${reflections.length} reflections for ${userEmail}` 
    });
    
  } catch (error) {
    console.error("Get reflections API error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reflections" 
    }, { status: 500 });
  }
}
