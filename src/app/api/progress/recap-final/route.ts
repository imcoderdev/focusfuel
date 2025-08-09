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
    const { userEmail } = await request.json();
    
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
      // User doesn't exist, return default recap
      return NextResponse.json({
        recap: "Welcome to FocusFuel! Start your journey by setting your mood, adding tasks, and beginning your first focus session. Great things await! 🌟"
      });
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get user's recent data for recap
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const [focusSessionsResult, tasksResult, moodsResult, reflectionsResult] = await Promise.all([
      supabase
        .from('FocusSession')
        .select('*')
        .eq('userId', user.id)
        .gte('startTime', weekAgo.toISOString()),
      
      supabase
        .from('Task')
        .select('*')
        .eq('userId', user.id)
        .eq('completed', true)
        .gte('createdAt', weekAgo.toISOString()),
      
      supabase
        .from('Mood')
        .select('*')
        .eq('userId', user.id)
        .gte('timestamp', weekAgo.toISOString()),
      
      supabase
        .from('Reflection')
        .select('*')
        .eq('userId', user.id)
        .gte('sessionDate', weekAgo.toISOString())
    ]);

    const focusSessions = focusSessionsResult.data || [];
    const completedTasks = tasksResult.data || [];
    const moods = moodsResult.data || [];
    const reflections = reflectionsResult.data || [];

    // Generate AI-like recap based on data
    let recap = `Hey ${user.user_metadata?.name || user.email?.split('@')[0] || 'User'}! Here's your week in review:\n\n`;

    // Focus sessions
    const focusCount = focusSessions.length;
    const totalFocusMinutes = reflections.reduce((sum, r) => sum + (r.duration || 0), 0);
    const focusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;

    if (focusCount > 0) {
      recap += `🎯 You completed ${focusCount} focus session${focusCount > 1 ? 's' : ''} totaling ${focusHours} hours! `;
      if (focusCount >= 5) {
        recap += "You're on fire! 🔥\n\n";
      } else if (focusCount >= 3) {
        recap += "Great consistency! 💪\n\n";
      } else {
        recap += "A good start! 🌱\n\n";
      }
    } else {
      recap += "🎯 No focus sessions this week - let's get that momentum going! 🚀\n\n";
    }

    // Tasks
    const taskCount = completedTasks.length;
    if (taskCount > 0) {
      recap += `✅ You knocked out ${taskCount} task${taskCount > 1 ? 's' : ''}! `;
      if (taskCount >= 10) {
        recap += "Productivity superstar! ⭐\n\n";
      } else if (taskCount >= 5) {
        recap += "Solid progress! 📈\n\n";
      } else {
        recap += "Every task counts! 💯\n\n";
      }
    } else {
      recap += "✅ Ready to tackle some tasks? Your to-do list is waiting! 📝\n\n";
    }

    // Mood analysis
    if (moods.length > 0) {
      const moodScoreMap: Record<string, number> = { 
        happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 
      };
      // @ts-ignore - Skip TypeScript indexing error for deployment
      const avgMood = moods.reduce((sum: number, m: { mood: string }) => sum + (moodScoreMap[m.mood] || 3), 0) / moods.length;
      
      if (avgMood >= 4) {
        recap += "😊 Your mood has been great this week! Keep that positive energy flowing.\n\n";
      } else if (avgMood >= 3) {
        recap += "😌 Your mood has been steady. Remember to take breaks and celebrate small wins!\n\n";
      } else {
        recap += "💙 It's been a challenging week mood-wise. Be kind to yourself and consider what might help boost your spirits.\n\n";
      }
    }

    // Distractions insight
    const distractedSessions = reflections.filter(r => !r.stayedFocused).length;
    if (distractedSessions > 0) {
      recap += `📱 ${distractedSessions} session${distractedSessions > 1 ? 's' : ''} had distractions. Try putting your phone in another room during focus time!\n\n`;
    }

    // Encouraging end
    if (focusCount === 0 && taskCount === 0) {
      recap += "🌟 This week is a fresh start! Set a small goal and let's make it happen together.";
    } else {
      recap += "🌟 Keep up the momentum! Small consistent steps lead to big achievements.";
    }

    return NextResponse.json({ recap });

  } catch (error) {
    console.error('Error in progress recap-final:', error);
    return NextResponse.json({ 
      error: "Failed to generate recap", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
