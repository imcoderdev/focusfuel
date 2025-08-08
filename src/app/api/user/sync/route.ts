import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, email, name, avatar_url } = body;

    // Make sure the authenticated user matches the request
    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          id,
          email,
          name,
          avatar_url
        }
      });
    } else {
      // Update existing user
      dbUser = await prisma.user.update({
        where: { id },
        data: {
          email,
          name,
          avatar_url
        }
      });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
