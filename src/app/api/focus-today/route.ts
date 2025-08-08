import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      // User doesn't exist, return 0
      return NextResponse.json({ totalSeconds: 0, totalMinutes: 0, totalHours: 0, displayTime: "0.0" });
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's focus sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('FocusSession')
      .select('*')
      .eq('userId', user.id)
      .gte('startTime', startOfDay.toISOString())
      .lte('startTime', endOfDay.toISOString());

    if (sessionsError) {
      console.error('Error fetching today\'s focus sessions:', sessionsError);
      return NextResponse.json({ error: "Failed to fetch today's focus sessions" }, { status: 500 });
    }

    // Calculate total focus time for today
    const totalSeconds = (sessions || []).reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalMinutes = totalSeconds / 60;
    const totalHours = totalMinutes / 60;

    // Format display time
    let displayTime;
    if (totalHours >= 1) {
      displayTime = totalHours.toFixed(1);
    } else if (totalMinutes >= 1) {
      displayTime = (totalMinutes / 60).toFixed(1);
    } else if (totalSeconds > 0) {
      displayTime = (totalSeconds / 3600).toFixed(1); // Convert seconds to hours for display
    } else {
      displayTime = "0.0";
    }

    return NextResponse.json({ 
      totalSeconds, 
      totalMinutes, 
      totalHours, 
      displayTime,
      sessionCount: sessions?.length || 0
    });

  } catch (error) {
    console.error('Error in focus-today:', error);
    return NextResponse.json({ 
      error: "Failed to fetch today's focus time", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
