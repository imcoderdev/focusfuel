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
      // User doesn't exist, return empty data for 7 days
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const result = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        return { date: dateStr, minutes: 0 };
      });
      return NextResponse.json(result);
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get last 7 days of focus sessions
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const { data: sessions, error: sessionsError } = await supabase
      .from('FocusSession')
      .select('*')
      .eq('userId', user.id)
      .gte('startTime', start.toISOString());

    if (sessionsError) {
      console.error('Error fetching focus sessions:', sessionsError);
      return NextResponse.json({ error: "Failed to fetch focus sessions" }, { status: 500 });
    }

    // Group sessions by date and calculate total minutes per day
    const result = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const minutes = (sessions || [])
        .filter(s => new Date(s.startTime).toISOString().slice(0, 10) === dateStr)
        .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);
      return { date: dateStr, minutes };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in progress focus-sessions-final:', error);
    return NextResponse.json({ 
      error: "Failed to fetch focus sessions progress", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
