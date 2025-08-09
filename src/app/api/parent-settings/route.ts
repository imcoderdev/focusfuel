import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { chatId, reportsEnabled } = await req.json();

    // Validate chat ID format (should be a number)
    if (reportsEnabled && (!chatId || isNaN(Number(chatId)))) {
      return NextResponse.json({ 
        error: "Valid Chat ID is required when enabling reports" 
      }, { status: 400 });
    }

    // Update user profile with parent settings
    const { data, error } = await supabase
      .from("User")
      .update({
        parent_chat_id: reportsEnabled ? chatId : null,
        parent_reports_enabled: reportsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    console.log(`Updated parent settings for user ${user.id}:`, {
      chatId: reportsEnabled ? chatId : null,
      reportsEnabled,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Parent settings updated successfully" 
    });

  } catch (error) {
    console.error("Parent settings API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current parent settings
    const { data, error } = await supabase
      .from("User")
      .select("parent_chat_id, parent_reports_enabled")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    return NextResponse.json({
      chatId: data?.parent_chat_id || "",
      reportsEnabled: data?.parent_reports_enabled || false,
    });

  } catch (error) {
    console.error("Parent settings GET error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
