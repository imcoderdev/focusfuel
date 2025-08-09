import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
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

    const { isTest } = await req.json();

    // Get user's parent settings and profile
    const { data: profile, error: profileError } = await supabase
      .from("User")
      .select("parent_chat_id, parent_reports_enabled, name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    if (!profile.parent_reports_enabled || !profile.parent_chat_id) {
      return NextResponse.json({ 
        error: "Parent reports not enabled or chat ID not set" 
      }, { status: 400 });
    }

    let message: string;

    if (isTest) {
      // Generate comprehensive AI-powered test report
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const today = new Date().toISOString().split('T')[0];

      // Check if user is new (account created less than 7 days ago)
      const userCreatedDate = new Date(user.created_at || user.createdAt);
      const daysSinceCreation = Math.floor((Date.now() - userCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
      const isNewUser = daysSinceCreation < 7;

      // Fetch comprehensive student data with detailed information
      const [focusData, taskData, moodData, todayFocusData, todayTaskData, allFocusData] = await Promise.all([
        supabase.from("FocusSession").select("duration, createdAt").eq("userId", user.id).gte("createdAt", oneWeekAgo.toISOString()),
        supabase.from("Task").select("*").eq("userId", user.id).gte("createdAt", oneWeekAgo.toISOString()),
        supabase.from("Mood").select("mood, createdAt").eq("userId", user.id).gte("createdAt", oneWeekAgo.toISOString()),
        supabase.from("FocusSession").select("duration, createdAt").eq("userId", user.id).gte("createdAt", today),
        supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", today),
        supabase.from("FocusSession").select("duration, createdAt").eq("userId", user.id).order("createdAt", { ascending: false }).limit(10)
      ]);

      // Process comprehensive data
      const weeklyFocusMinutes = focusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      const weeklyFocusHours = Math.floor(weeklyFocusMinutes / 60);
      const weeklyFocusRemainingMinutes = weeklyFocusMinutes % 60;
      
      const focusSessionsCount = focusData.data?.length || 0;
      const weeklyTasksTotal = taskData.data?.length || 0;
      const weeklyTasksCompleted = taskData.data?.filter(t => t.completed)?.length || 0;
      const completionRate = weeklyTasksTotal > 0 ? Math.round((weeklyTasksCompleted / weeklyTasksTotal) * 100) : 0;
      
      const weeklyMoods = moodData.data || [];
      const moodEntries = weeklyMoods.length;
      
      const todayFocusMinutes = todayFocusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      const todayFocusHours = Math.floor(todayFocusMinutes / 60);
      const todayFocusRemainingMinutes = todayFocusMinutes % 60;
      const todayTasksCompleted = todayTaskData.data?.length || 0;
      
      // Calculate average mood
      const avgMood = weeklyMoods.length > 0 
        ? (weeklyMoods.reduce((sum, m) => {
            const moodValue = typeof m.mood === 'string' ? 
              ({ happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 }[m.mood] || 3) : 
              m.mood;
            return sum + moodValue;
          }, 0) / weeklyMoods.length).toFixed(1)
        : "Data unavailable";

      // Get recent activities with more detail
      const recentFocusActivities = allFocusData.data?.slice(0, 5).map(f => ({
        duration: Math.floor((f.duration || 0) / 60),
        date: new Date(f.createdAt).toLocaleDateString()
      })) || [];
      
      const recentTasks = taskData.data?.slice(-5).map(t => ({
        title: t.title,
        completed: t.completed,
        completedDate: t.completedAt ? new Date(t.completedAt).toLocaleDateString() : null,
        createdDate: new Date(t.createdAt).toLocaleDateString()
      })) || [];

      // Get current date range for report
      const reportStartDate = oneWeekAgo.toLocaleDateString();
      const reportEndDate = new Date().toLocaleDateString();

      // Prepare comprehensive context for Gemini AI
      const studentDataContext = `
STUDENT PROFILE:
- Name: ${profile.name || "Student"}
- Email: ${user.email}
- Account Age: ${daysSinceCreation} days old
- Report Period: ${reportStartDate} - ${reportEndDate}
- Is New User: ${isNewUser}

WEEKLY PERFORMANCE DATA (Last 7 days):
- Total Focus Time: ${weeklyFocusHours} hours ${weeklyFocusRemainingMinutes} minutes
- Focus Sessions: ${focusSessionsCount} sessions
- Tasks Created: ${weeklyTasksTotal}
- Tasks Completed: ${weeklyTasksCompleted}
- Completion Rate: ${completionRate}%
- Average Mood: ${avgMood}/10 (based on ${moodEntries} entries)
- Mood Entries: ${moodEntries} entries

TODAY'S DATA (${new Date().toLocaleDateString()}):
- Focus Time Today: ${todayFocusHours} hours ${todayFocusRemainingMinutes} minutes
- Tasks Completed Today: ${todayTasksCompleted}

RECENT FOCUS SESSIONS:
${recentFocusActivities.map(f => `- ${f.duration} minutes on ${f.date}`).join('\n')}

RECENT TASKS:
${recentTasks.map(t => `- "${t.title}" ${t.completed ? `✅ Completed on ${t.completedDate}` : `⏳ Created on ${t.createdDate}, still pending`}`).join('\n')}

MOOD BREAKDOWN:
${weeklyMoods.map(m => `- ${m.mood} on ${new Date(m.createdAt).toLocaleDateString()}`).join('\n')}
`;

      try {
        // Use Gemini AI to generate comprehensive detailed report
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert educational consultant creating a comprehensive TEST REPORT for parents about their child's productivity progress using FocusFuel app.

STUDENT DATA:
${studentDataContext}

Create a detailed, professional parent report following this EXACT format and style:

🧪 <b>TEST REPORT - FocusFuel Parent Updates</b>

Dear Parents of ${profile.name || "Your Child"},

This report summarizes ${profile.name || "your child"}'s progress using the FocusFuel app over the past week. We're excited to share the data and offer insights to support continued growth!

<b>Weekly Summary (${reportStartDate} - ${reportEndDate}):</b>

• <b>Total Focus Time:</b> ${weeklyFocusHours} hours ${weeklyFocusRemainingMinutes} minutes ${weeklyFocusMinutes > 1200 ? '🎉 That\'s a significant amount of dedicated focus time!' : weeklyFocusMinutes > 600 ? '👍 Good progress on building focus habits!' : '💪 Let\'s work on increasing focus time next week!'}
• <b>Focus Sessions:</b> ${focusSessionsCount} sessions ${focusSessionsCount > 20 ? '- Excellent consistency!' : focusSessionsCount > 10 ? '- Good effort!' : '- Let\'s aim for more frequent sessions!'}
• <b>Tasks Created:</b> ${weeklyTasksTotal} ${weeklyTasksTotal > 0 ? '👍 Great initiative in planning activities.' : '📝 Encourage creating daily tasks for better organization.'}
• <b>Tasks Completed:</b> ${weeklyTasksCompleted} ${completionRate >= 80 ? '🌟 Outstanding completion rate!' : completionRate >= 50 ? '✅ Good progress!' : 'While completion could improve, starting is half the battle!'}
• <b>Completion Rate:</b> ${completionRate}% ${completionRate < 50 ? 'Let\'s aim for a higher completion rate next week. We have strategies to help with this.' : 'Great job following through on commitments!'}
• <b>Average Mood:</b> ${avgMood === "Data unavailable" ? avgMood + '. Regular mood entries can help us understand what boosts focus and what might be hindering it.' : avgMood + '/10 - ' + (parseFloat(avgMood) >= 4 ? 'Positive mindset supporting productivity!' : 'Let\'s work on strategies to improve daily mood.')}
• <b>Mood Entries:</b> ${moodEntries} entries ${moodEntries >= 5 ? '- Good start! More data will provide valuable insights.' : '- Encourage regular mood tracking for better insights.'}

<b>Today's Summary (${new Date().toLocaleDateString()}):</b>

• <b>Focus Time Today:</b> ${todayFocusHours} hours ${todayFocusRemainingMinutes} minutes ${todayFocusMinutes === 0 ? '. Let\'s aim for even a short focused session today!' : '. Great work staying focused today!'}
• <b>Tasks Completed Today:</b> ${todayTasksCompleted}

<b>Recent Activities Highlights:</b>

${recentFocusActivities.length > 0 ? 
  `Recent focus sessions show ${recentFocusActivities.some(f => f.duration >= 25) ? 'excellent sustained focus periods' : 'multiple short sessions. While commendable for attempting to focus, longer sessions (25-30 minutes) can lead to greater productivity'}. ` : 
  'No recent focus sessions recorded. '}
${recentTasks.filter(t => t.completed).length > 0 ? 
  `Successfully completed tasks include: ${recentTasks.filter(t => t.completed).map(t => `"${t.title}"`).join(', ')}. Excellent job! ` : 
  ''}
${recentTasks.filter(t => !t.completed).length > 0 ? 
  `Pending tasks: ${recentTasks.filter(t => !t.completed).map(t => `"${t.title}"`).join(', ')}.` : 
  ''}

<b>Actionable Insights & Suggestions:</b>

• <b>Focus Session Length:</b> ${focusSessionsCount > 0 && recentFocusActivities.some(f => f.duration < 15) ? 'Encourage longer focus sessions. Even 25-30 minutes can make a big difference.' : 'Continue maintaining good focus session habits.'}
• <b>Task Prioritization:</b> ${completionRate < 70 ? 'Help prioritize tasks and break them into smaller, manageable chunks.' : 'Excellent task management! Keep up the systematic approach.'}
• <b>Mood Tracking:</b> ${moodEntries < 5 ? 'Consistent mood tracking will greatly benefit focus optimization.' : 'Great job with mood tracking! This helps identify productivity patterns.'}
• <b>Celebrate Small Wins:</b> Acknowledge and celebrate accomplishments, no matter how small.

${isNewUser ? 
  `<b>🆕 New User Progress:</b> As a new user (${daysSinceCreation} days), this is an excellent start! The data will become richer as usage continues, providing even more personalized insights.` : 
  `We believe ${profile.name || "your child"} has great potential, and with continued focus and strategy, can achieve even greater things.`}

We'll continue to monitor progress and offer support. We look forward to sharing next week's report!

<b>Sincerely,</b>

<b>The FocusFuel Team ❤️</b>

<i>Regular weekly reports will help track progress and celebrate achievements!</i>

IMPORTANT INSTRUCTIONS:
1. Use the EXACT format above with proper HTML formatting for Telegram
2. Keep the professional, encouraging tone throughout
3. Provide specific, actionable suggestions based on the actual data
4. Include emojis and formatting as shown
5. Make insights personal and relevant to the student's performance
6. Stay under 4096 characters total for Telegram limits
7. Use <b>bold</b> and <i>italic</i> HTML tags, not markdown
8. Be encouraging while providing constructive feedback

Generate this comprehensive report now:`
              }]
            }]
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          message = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
            "Test report generated successfully! Weekly AI reports will include detailed insights about your child's progress.";
        } else {
          // Enhanced fallback with detailed format
          message = `🧪 <b>TEST REPORT - FocusFuel Parent Updates</b>

Dear Parents of ${profile.name || "Your Child"},

This report summarizes ${profile.name || "your child"}'s progress using the FocusFuel app over the past week.

<b>Weekly Summary (${reportStartDate} - ${reportEndDate}):</b>

• <b>Total Focus Time:</b> ${weeklyFocusHours} hours ${weeklyFocusRemainingMinutes} minutes ${weeklyFocusMinutes > 600 ? '🎉' : '💪'}
• <b>Focus Sessions:</b> ${focusSessionsCount} sessions
• <b>Tasks Created:</b> ${weeklyTasksTotal}
• <b>Tasks Completed:</b> ${weeklyTasksCompleted}
• <b>Completion Rate:</b> ${completionRate}%
• <b>Average Mood:</b> ${avgMood}/10
• <b>Mood Entries:</b> ${moodEntries} entries

<b>Today's Summary (${new Date().toLocaleDateString()}):</b>

• <b>Focus Time Today:</b> ${todayFocusHours} hours ${todayFocusRemainingMinutes} minutes
• <b>Tasks Completed Today:</b> ${todayTasksCompleted}

<b>Actionable Insights:</b>
• Continue building consistent focus habits
• ${completionRate < 50 ? 'Work on task completion strategies' : 'Excellent task management!'}
• ${moodEntries < 5 ? 'Encourage regular mood tracking' : 'Great mood tracking consistency!'}

<b>The FocusFuel Team ❤️</b>

<i>Weekly reports help track progress and celebrate achievements!</i>`;
        }
      } catch (error) {
        console.error('Gemini AI error:', error);
        // Simple fallback
        message = `🧪 <b>TEST REPORT - FocusFuel Parent Updates</b>

Dear Parents of ${profile.name || "Your Child"},

<b>Weekly Summary:</b>
• Focus Time: ${weeklyFocusHours}h ${weeklyFocusRemainingMinutes}m
• Tasks: ${weeklyTasksCompleted}/${weeklyTasksTotal} completed
• Sessions: ${focusSessionsCount}
• Mood: ${avgMood}/10

Connection successful! Detailed AI reports will provide comprehensive insights.

<b>The FocusFuel Team ❤️</b>`;
      }
    } else {
      // Regular weekly report (non-test)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [focusSessions, tasks, moods] = await Promise.all([
        supabase.from("FocusSession").select("duration").eq("userId", user.id).gte("createdAt", oneWeekAgo.toISOString()),
        supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", oneWeekAgo.toISOString()),
        supabase.from("Mood").select("mood").eq("userId", user.id).gte("createdAt", oneWeekAgo.toISOString())
      ]);

      const totalFocusTime = focusSessions.data?.reduce((total, session) => total + (session.duration || 0), 0) || 0;
      const totalTasks = tasks.data?.length || 0;
      const averageMood = moods.data?.length > 0 
        ? (moods.data.reduce((sum, mood) => sum + mood.mood, 0) / moods.data.length).toFixed(1)
        : "N/A";

      const focusHours = Math.floor(totalFocusTime / 3600);
      const focusMinutes = Math.floor((totalFocusTime % 3600) / 60);
      const focusTimeStr = focusHours > 0 ? `${focusHours}h ${focusMinutes}m` : `${focusMinutes}m`;

      message = `📊 <b>Weekly Progress Report for ${profile.name || "Your Student"}</b>

🗓️ Week ending ${new Date().toLocaleDateString()}

📚 <b>Study Performance:</b>
• Focus time: ${focusTimeStr}
• Tasks completed: ${totalTasks}
• Average mood: ${averageMood}/10

🌳 Digital Trees Grown: ${Math.floor(totalFocusTime / 1800)} trees

${totalFocusTime > 0 ? "🎉 Great job staying focused this week!" : "💪 Encourage them to use the focus timer!"}

${totalTasks > 0 ? "✅ Excellent task completion!" : "📝 Help them set up daily tasks!"}

Keep up the great work! 🌟

<b>- FocusFuel Team</b>`;
    }

    // Send message via Telegram API
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: profile.parent_chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send Telegram message:", errorText);
      return NextResponse.json({ 
        error: "Failed to send message to Telegram" 
      }, { status: 500 });
    }

    console.log(`Sent ${isTest ? "test" : "weekly"} report to chat ${profile.parent_chat_id}`);

    return NextResponse.json({ 
      success: true,
      message: `${isTest ? "Test message" : "Weekly report"} sent successfully!`
    });

  } catch (error) {
    console.error("Send Telegram update error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
