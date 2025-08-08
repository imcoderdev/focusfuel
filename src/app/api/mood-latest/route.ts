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
      // User doesn't exist, return default mood
      return NextResponse.json({ mood: "Unknown", rawMood: null });
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get latest mood entry for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: moods, error: moodsError } = await supabase
      .from('Mood')
      .select('*')
      .eq('userId', user.id)
      .gte('createdAt', `${today}T00:00:00.000Z`)
      .order('createdAt', { ascending: false })
      .limit(1);

    if (moodsError) {
      console.error('Error fetching latest mood:', moodsError);
      return NextResponse.json({ error: "Failed to fetch latest mood" }, { status: 500 });
    }

    if (!moods || moods.length === 0) {
      return NextResponse.json({ mood: "Unknown", rawMood: null });
    }

    const latestMood = moods[0];
    
    // Capitalize the mood for display
    const displayMood = latestMood.mood.charAt(0).toUpperCase() + latestMood.mood.slice(1);

    return NextResponse.json({ 
      mood: displayMood, 
      rawMood: latestMood.mood,
      createdAt: latestMood.createdAt 
    });

  } catch (error) {
    console.error('Error in mood-latest:', error);
    return NextResponse.json({ 
      error: "Failed to fetch latest mood", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
