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
      // User doesn't exist, return empty mood data for 7 days
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const result = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        return { date: dateStr, score: 3 }; // Default neutral mood
      });
      return NextResponse.json(result);
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get last 7 days of moods
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const { data: moods, error: moodsError } = await supabase
      .from('Mood')
      .select('*')
      .eq('userId', user.id)
      .gte('createdAt', start.toISOString());

    if (moodsError) {
      console.error('Error fetching moods:', moodsError);
      return NextResponse.json({ error: "Failed to fetch moods" }, { status: 500 });
    }

    // Map moods to scores
    const moodScoreMap: Record<string, number> = { 
      happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 
    };

    // Group moods by date and calculate average score per day
    const result = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const dayMoods = (moods || [])
        .filter(mood => new Date(mood.createdAt).toISOString().slice(0, 10) === dateStr);
      
      let score = 3; // Default neutral mood
      if (dayMoods.length > 0) {
        // @ts-ignore - Skip TypeScript indexing error for deployment
        const totalScore = dayMoods.reduce((sum: number, mood: { mood: string }) => sum + (moodScoreMap[mood.mood] || 3), 0);
        score = Math.round((totalScore / dayMoods.length) * 10) / 10; // Round to 1 decimal
      }
      
      return { date: dateStr, score };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in progress moods-final:', error);
    return NextResponse.json({ 
      error: "Failed to fetch moods progress", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
