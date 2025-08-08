import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
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

    const { name, email, image } = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });
    return NextResponse.json({ name: updated.name, email: updated.email, image: updated.image });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Failed to update profile", details: e?.message || e?.toString() }, { status: 500 });
  }
} 