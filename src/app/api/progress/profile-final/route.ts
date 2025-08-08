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
      // User doesn't exist, return default profile
      return NextResponse.json({
        name: userEmail.split('@')[0],
        email: userEmail,
        bonsais: 0,
        totalFocusTimeMinutes: 0,
        completedTasks: 0,
        averageMood: 3
      });
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get focus sessions count (bonsais)
    const { data: focusSessions, error: focusError } = await supabase
      .from('FocusSession')
      .select('id')
      .eq('userId', user.id);

    if (focusError) {
      console.error('Error fetching focus sessions:', focusError);
      return NextResponse.json({ error: "Failed to fetch focus sessions" }, { status: 500 });
    }

    // Get total focus time from reflections
    const { data: reflections, error: reflectionsError } = await supabase
      .from('Reflection')
      .select('duration')
      .eq('userId', user.id);

    if (reflectionsError) {
      console.error('Error fetching reflections:', reflectionsError);
      return NextResponse.json({ error: "Failed to fetch reflections" }, { status: 500 });
    }

    // Get completed tasks count
    const { data: tasks, error: tasksError } = await supabase
      .from('Task')
      .select('id')
      .eq('userId', user.id)
      .eq('completed', true);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // Get moods for average
    const { data: moods, error: moodsError } = await supabase
      .from('Mood')
      .select('mood')
      .eq('userId', user.id);

    if (moodsError) {
      console.error('Error fetching moods:', moodsError);
      return NextResponse.json({ error: "Failed to fetch moods" }, { status: 500 });
    }

    // Calculate totals
    const bonsais = focusSessions?.length || 0;
    const totalFocusTimeMinutes = reflections?.reduce((sum, r) => sum + (r.duration || 0), 0) || 0;
    const completedTasks = tasks?.length || 0;
    
    // Calculate average mood
    const moodScoreMap: Record<string, number> = { 
      happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 
    };
    const totalMoodScore = moods?.reduce((sum: number, m: { mood: string }) => sum + (moodScoreMap[m.mood] || 3), 0) || 0;
    const averageMood = moods?.length ? totalMoodScore / moods.length : 3;

    return NextResponse.json({
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email,
      bonsais,
      totalFocusTimeMinutes,
      completedTasks,
      averageMood: Math.round(averageMood * 10) / 10 // Round to 1 decimal
    });

  } catch (error) {
    console.error('Error in progress profile-final:', error);
    return NextResponse.json({ 
      error: "Failed to fetch profile progress", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
