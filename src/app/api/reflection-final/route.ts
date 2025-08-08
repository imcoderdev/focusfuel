import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client to bypass RLS
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { stayedFocused, distractions, duration, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }
    
    if (typeof stayedFocused !== "boolean" || typeof duration !== "number") {
      return NextResponse.json({ 
        error: "stayedFocused (boolean) and duration (number) are required" 
      }, { status: 400 });
    }

    // Find or create user using Supabase directly (like mood and tasks)
    let { data: user, error: userError } = await supabaseServiceRole
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error("User lookup error:", userError);
      return NextResponse.json({ error: "Failed to lookup user" }, { status: 500 });
    }

    if (!user) {
      // Create user if doesn't exist
      const { randomUUID } = await import('crypto');
      const { data: newUser, error: createError } = await supabaseServiceRole
        .from('User')
        .insert({
          id: randomUUID(),
          email: userEmail,
          name: userEmail.split('@')[0]
        })
        .select()
        .single();

      if (createError) {
        console.error("User creation error:", createError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      user = newUser;
    }

    console.log("Creating reflection with data:", {
      userId: user.id,
      sessionDate: new Date().toISOString(),
      stayedFocused,
      distractions: distractions || "",
      duration,
    });
    
    // Create reflection using Supabase directly
    const { data: reflection, error: reflectionError } = await supabaseServiceRole
      .from('Reflection')
      .insert({
        userId: user.id,
        sessionDate: new Date().toISOString(),
        stayedFocused,
        distractions: distractions || "",
        duration,
      })
      .select()
      .single();

    if (reflectionError) {
      console.error("Reflection creation error:", reflectionError);
      return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 });
    }

    console.log("Reflection created successfully:", reflection);

    return NextResponse.json({ 
      success: true, 
      reflection,
      message: "Reflection saved successfully!" 
    });
    
  } catch (error) {
    console.error("Reflection API error:", error);
    return NextResponse.json({ 
      error: "Failed to save reflection" 
    }, { status: 500 });
  }
}
