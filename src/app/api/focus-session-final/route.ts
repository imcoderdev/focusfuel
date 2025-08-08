import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { startTime, duration, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!startTime || typeof duration !== "number") {
      return NextResponse.json({ error: "startTime and duration are required" }, { status: 400 });
    }

    // Find or create user by email
    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create one
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: crypto.randomUUID(),
          email: userEmail,
          name: userEmail.split('@')[0], // Use email prefix as default name
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
      }
      user = newUser;
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Create focus session
    const { data: session, error: sessionError } = await supabase
      .from('FocusSession')
      .insert({
        userId: user.id,
        startTime: new Date(startTime).toISOString(),
        duration: duration,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating focus session:', sessionError);
      return NextResponse.json({ error: "Failed to save focus session" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      session,
      message: "Focus session saved successfully! 🎯"
    });

  } catch (error) {
    console.error('Error in focus-session-final:', error);
    return NextResponse.json({ 
      error: "Failed to save focus session", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
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

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, return empty sessions array
      return NextResponse.json([]);
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get focus sessions for this user
    const { data: sessions, error: sessionsError } = await supabase
      .from('FocusSession')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching focus sessions:', sessionsError);
      return NextResponse.json({ error: "Failed to fetch focus sessions" }, { status: 500 });
    }

    return NextResponse.json(sessions || []);

  } catch (error) {
    console.error('Error in focus-session-final GET:', error);
    return NextResponse.json({ 
      error: "Failed to fetch focus sessions", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
