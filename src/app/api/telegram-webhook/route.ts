import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
    }

    const update = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update, null, 2));

    // Check if this is a test mode (local testing)
    const isTestMode = req.headers.get('user-agent')?.includes('node') || 
                      req.url.includes('localhost') || 
                      update.message?.from?.id === 123456789 ||
                      update.message?.from?.id === 1707155356; // Your real chat ID for testing

    // Extract message data
    const message = update?.message;
    const text = message?.text;
    const chatId = message?.chat?.id;
    const firstName = message?.from?.first_name || "there";

    if (!chatId || !text) {
      console.log("No chat ID or text found");
      return NextResponse.json({ ok: true });
    }

    console.log(`Processing message: "${text}" from chat ${chatId}`);

    let replyMessage = "";

    // Handle /start command
    if (text === "/start") {
      replyMessage = `🎓 <b>Welcome to FocusFuel Academic Coaching!</b>

Hello ${firstName}! I'm your child's personal academic coach and productivity mentor. 

🔑 <b>Your Chat ID:</b> <code>${chatId}</code>

<i>Please copy this number and paste it into the FocusFuel app under "Parent Reports" to connect your child's account.</i>

📚 <b>What I Can Help You With:</b>
As your child's academic coach, I have access to comprehensive learning analytics and can provide insights about:

🎯 <b>Academic Performance:</b>
• "How is my child doing with their studies?"
• "What tasks is my child working on?"
• "How much time did they spend studying today?"

📈 <b>Learning Patterns:</b>
• "What are their study habits like?"
• "When is their most productive time?"
• "How consistent are they with their work?"

😊 <b>Wellbeing & Motivation:</b>
• "How is their mood lately?"
• "Are they feeling stressed or confident?"
• "What challenges are they facing?"

📊 <b>Progress Tracking:</b>
• "Show me this week's progress"
• "How do they compare to last week?"
• "What areas need improvement?"

💡 <b>Coaching Strategies:</b>
• "How can I help them focus better?"
• "What study strategies work for them?"
• "Should I be concerned about anything?"

<b>🗣️ Just ask me naturally!</b> I understand questions like:
• "What did my child accomplish today?"
• "Is my child keeping up with their tasks?"
• "How can I support their learning better?"

I'll analyze their complete learning data and respond as their dedicated academic coach. Let's work together to support their success! 🌟

<i>Type any question about your child's learning journey to get started!</i>`;
    }
    // Handle help command
    else if (text.toLowerCase().includes('help') || text === '/help') {
      replyMessage = `🎓 <b>FocusFuel Academic Coach - Help Center</b>

Hi ${firstName}! I'm here to provide detailed insights about your child's learning journey. Here's how I can help:

🗣️ <b>Natural Conversation:</b>
Just ask me anything naturally! I understand questions like:

📚 <b>About Their Studies:</b>
• "What is my child working on today?"
• "How much time did they spend studying?"
• "Are they completing their tasks?"
• "What homework do they have?"

📈 <b>Progress & Performance:</b>
• "How is my child doing this week?"
• "Show me their progress report"
• "How do they compare to last week?"
• "What are their strengths and challenges?"

⏰ <b>Study Habits & Patterns:</b>
• "When does my child study best?"
• "How long are their focus sessions?"
• "Are they consistent with their studies?"
• "What's their daily routine like?"

😊 <b>Mood & Wellbeing:</b>
• "How is my child feeling lately?"
• "Are they stressed or motivated?"
• "What's affecting their mood?"

💡 <b>Coaching Advice:</b>
• "How can I help them focus better?"
• "What study strategies work for them?"
• "Should I be concerned about anything?"
• "How can I motivate them?"

🎯 <b>Specific Insights:</b>
• "What did they accomplish today?"
• "What tasks are pending?"
• "How much screen time vs study time?"

<b>💬 I analyze their complete data including:</b>
✅ All focus sessions and study time
✅ Task creation and completion patterns  
✅ Mood tracking and trends
✅ Study reflections and insights
✅ Learning challenges and breakthroughs

Just type your question naturally - I'm here to help you support your child's academic success! 🌟`;
    }
    // Handle any other message (natural language queries)
    else {
      console.log("Processing interactive query...");
      
      // Find user first to determine response
      const { data: user, error: userError } = await supabase
        .from("User")
        .select("*")
        .eq("parent_chat_id", chatId.toString())
        .eq("parent_reports_enabled", true)
        .single();

      console.log("User lookup result:", { user: user?.email, error: userError });

      if (userError || !user) {
        replyMessage = `❌ I couldn't find a student account linked to this chat ID: <b>${chatId}</b>

Please ask your child to:
1. Open FocusFuel app
2. Click "Parent Reports" 
3. Enter your Chat ID: <b>${chatId}</b>
4. Enable reports

Then you'll be able to get real-time updates! 🚀`;
      } else {
        // Generate response based on parent's question
        console.log("Generating response for user:", user.email);
        replyMessage = await generateParentResponse(text.toLowerCase(), user, firstName);
      }
    }

    console.log("Sending reply:", replyMessage.substring(0, 100) + "...");

    // Send reply back to user
    if (isTestMode) {
      console.log("TEST MODE: Would send reply:", replyMessage);
      return NextResponse.json({ 
        ok: true, 
        test_mode: true,
        message_sent: replyMessage,
        chat_id: chatId 
      });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyMessage,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send Telegram message:", errorText);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    console.log(`Successfully sent response to ${firstName} (Chat ID: ${chatId})`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function generateParentResponse(text: string, user: any, parentName: string): Promise<string> {
  const studentName = user.name || "Your child";
  console.log(`Generating AI coach response for query: "${text}" about student: ${studentName}`);

  try {
    // Gather comprehensive student data from ALL time periods for deep analysis
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fetch ALL available data for comprehensive analysis
    const [
      allFocusData, 
      allTaskData, 
      allMoodData, 
      todayFocusData, 
      todayTaskData,
      yesterdayTaskData,
      weeklyFocusData,
      monthlyFocusData,
      recentReflections,
      emergencyLogs
    ] = await Promise.all([
      // All focus sessions ever
      supabase.from("FocusSession").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      // All tasks ever
      supabase.from("Task").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      // All mood entries ever
      supabase.from("Mood").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      // Today's focus
      supabase.from("FocusSession").select("*").eq("userId", user.id).gte("createdAt", today),
      // Today's tasks
      supabase.from("Task").select("*").eq("userId", user.id).gte("createdAt", today),
      // Yesterday's completed tasks
      supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", yesterday).lt("completedAt", today),
      // Weekly focus
      supabase.from("FocusSession").select("*").eq("userId", user.id).gte("createdAt", weekAgo.toISOString()),
      // Monthly focus for trends
      supabase.from("FocusSession").select("*").eq("userId", user.id).gte("createdAt", monthAgo.toISOString()),
      // Recent reflections
      supabase.from("Reflection").select("*").eq("userId", user.id).order("createdAt", { ascending: false }).limit(5),
      // Recent emergency help requests
      supabase.from("EmergencyLog").select("*").eq("userId", user.id).order("createdAt", { ascending: false }).limit(3)
    ]);

    // Process comprehensive data for AI coach analysis
    const allFocus = allFocusData.data || [];
    const allTasks = allTaskData.data || [];
    const allMoods = allMoodData.data || [];
    const todayFocus = todayFocusData.data || [];
    const todayTasks = todayTaskData.data || [];
    const yesterdayTasks = yesterdayTaskData.data || [];
    const weeklyFocus = weeklyFocusData.data || [];
    const monthlyFocus = monthlyFocusData.data || [];
    const reflections = recentReflections.data || [];
    const emergencies = emergencyLogs.data || [];

    // Calculate comprehensive metrics
    const totalFocusTime = allFocus.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalFocusHours = Math.floor(totalFocusTime / 3600);
    const avgSessionLength = allFocus.length > 0 ? Math.floor(totalFocusTime / allFocus.length / 60) : 0;
    
    const weeklyFocusTime = weeklyFocus.reduce((sum, s) => sum + (s.duration || 0), 0);
    const monthlyFocusTime = monthlyFocus.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    const todayFocusTime = todayFocus.reduce((sum, s) => sum + (s.duration || 0), 0);
    const yesterdayFocusTime = allFocus
      .filter(s => new Date(s.createdAt).toISOString().split('T')[0] === yesterday)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    // Task analysis
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completed).length;
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const weeklyTasks = allTasks.filter(t => new Date(t.createdAt) >= weekAgo);
    const weeklyCompletedTasks = weeklyTasks.filter(t => t.completed);
    const weeklyCompletionRate = weeklyTasks.length > 0 ? Math.round((weeklyCompletedTasks.length / weeklyTasks.length) * 100) : 0;
    
    const pendingTasks = allTasks.filter(t => !t.completed).slice(0, 5);
    const recentCompletedTasks = allTasks.filter(t => t.completed).slice(0, 5);

    // Mood analysis
    const recentMoods = allMoods.slice(0, 7);
    const avgMood = recentMoods.length > 0 
      ? (recentMoods.reduce((sum, m) => {
          const moodValue = typeof m.mood === 'string' ? 
            ({ happy: 5, focused: 4, meh: 3, tired: 2, stressed: 2, sad: 1 }[m.mood] || 3) : 
            m.mood;
          return sum + moodValue;
        }, 0) / recentMoods.length).toFixed(1)
      : "No data";

    const todayMood = allMoods.find(m => new Date(m.createdAt).toISOString().split('T')[0] === today);
    const yesterdayMood = allMoods.find(m => new Date(m.createdAt).toISOString().split('T')[0] === yesterday);

    // Productivity patterns
    const focusByDay = {};
    allFocus.forEach(session => {
      const day = new Date(session.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      focusByDay[day] = (focusByDay[day] || 0) + (session.duration || 0);
    });
    const bestDay = Object.keys(focusByDay).reduce((a, b) => focusByDay[a] > focusByDay[b] ? a : b, 'Monday');

    // Recent activity patterns
    const last5Sessions = allFocus.slice(0, 5);
    const sessionTrend = last5Sessions.length >= 2 ? 
      (last5Sessions[0].duration > last5Sessions[1].duration ? "improving" : "declining") : "stable";

    // Study consistency (days with activity in last 7 days)
    const activeDaysThisWeek = new Set(
      [...weeklyFocus, ...weeklyTasks].map(item => 
        new Date(item.createdAt).toISOString().split('T')[0]
      )
    ).size;

    // Prepare comprehensive context for AI coach
    const studentDataContext = `
STUDENT PROFILE:
- Name: ${studentName}
- Email: ${user.email}
- Parent Asking: ${parentName}
- Account Activity: ${allFocus.length} total focus sessions, ${totalTasks} total tasks created
- Study Consistency: Active ${activeDaysThisWeek}/7 days this week

COMPREHENSIVE PERFORMANCE ANALYTICS:

FOCUS & PRODUCTIVITY:
- Total Focus Time (All Time): ${totalFocusHours} hours ${Math.floor((totalFocusTime % 3600) / 60)} minutes
- Average Session Length: ${avgSessionLength} minutes
- Total Sessions: ${allFocus.length}
- Weekly Focus: ${Math.floor(weeklyFocusTime / 3600)}h ${Math.floor((weeklyFocusTime % 3600) / 60)}m
- Monthly Focus: ${Math.floor(monthlyFocusTime / 3600)}h ${Math.floor((monthlyFocusTime % 3600) / 60)}m
- Today's Focus: ${Math.floor(todayFocusTime / 60)} minutes (${todayFocus.length} sessions)
- Yesterday's Focus: ${Math.floor(yesterdayFocusTime / 60)} minutes
- Focus Trend: ${sessionTrend}
- Best Study Day: ${bestDay}

TASK MANAGEMENT:
- Total Tasks Created: ${totalTasks}
- Tasks Completed: ${completedTasks} (${overallCompletionRate}% overall rate)
- Weekly Completion Rate: ${weeklyCompletionRate}%
- Today's Tasks: ${todayTasks.length} created
- Yesterday Completed: ${yesterdayTasks.length} tasks
- Current Pending Tasks: ${pendingTasks.map(t => `"${t.title}"`).join(', ') || 'None'}
- Recent Completions: ${recentCompletedTasks.map(t => `"${t.title}" (${new Date(t.completedAt || t.createdAt).toLocaleDateString()})`).join(', ') || 'None'}

MOOD & WELLBEING:
- Current Mood Trend: ${avgMood}/10 average (last 7 entries)
- Today's Mood: ${todayMood ? `${todayMood.mood}/10` : 'Not recorded yet'}
- Yesterday's Mood: ${yesterdayMood ? `${yesterdayMood.mood}/10` : 'Not recorded'}
- Recent Mood Pattern: ${recentMoods.slice(0, 3).map(m => `${m.mood}/10 on ${new Date(m.createdAt).toLocaleDateString()}`).join(', ') || 'Limited data'}

LEARNING INSIGHTS:
- Recent Study Reflections: ${reflections.map(r => `"${r.stayedFocused ? 'Stayed focused' : 'Got distracted'} for ${r.duration} min${r.distractions ? `, distracted by: ${r.distractions}` : ''}"`).join(' | ') || 'No reflections yet'}
- Recent Help Requests: ${emergencies.map(e => `"${e.issue}" on ${new Date(e.createdAt).toLocaleDateString()}`).join(' | ') || 'No emergency help needed'}

PRODUCTIVITY PATTERNS:
- Study Consistency: ${activeDaysThisWeek}/7 active days this week
- Peak Performance Day: ${bestDay}
- Session Quality: ${sessionTrend} trend in recent sessions
- Focus Stamina: ${avgSessionLength} min average per session
`;

    // Enhanced AI prompt for coach-like responses
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert educational coach and mentor with deep insights into student productivity and learning patterns. You are having a conversation with ${parentName}, the parent of ${studentName}, who is using the FocusFuel productivity app.

PARENT'S QUESTION: "${text}"

COMPREHENSIVE STUDENT DATA:
${studentDataContext}

COACHING INSTRUCTIONS:
1. Respond as a knowledgeable, caring educational coach who has been personally working with ${studentName}
2. Analyze the data deeply to provide meaningful insights about learning patterns, productivity trends, and growth areas
3. Address the parent's specific question with detailed, data-backed observations
4. Provide actionable recommendations based on the student's actual performance patterns
5. Highlight both strengths to celebrate and areas for strategic improvement
6. Use a warm, professional tone that shows you genuinely care about the student's success
7. Include specific metrics and examples from the data to support your insights
8. Suggest practical strategies that parents can implement to support their child
9. Keep response under 400 words but be comprehensive
10. Use HTML formatting for Telegram: <b>bold</b>, <i>italic</i>
11. Include relevant emojis to make the response engaging
12. Always end with encouragement and next steps

RESPONSE STYLE:
- Start with a warm greeting acknowledging the parent's question
- Provide specific data-driven insights about their child's learning journey
- Offer concrete, actionable advice
- End with encouragement and confidence in the student's potential

Generate a detailed, coach-like response that shows deep understanding of ${studentName}'s learning patterns and provides valuable guidance to ${parentName}.`
          }]
        }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      // Enhanced fallback with comprehensive data
      return `📚 <b>Academic Coach Report for ${studentName}</b>

Hello ${parentName}! Here's what I'm seeing in ${studentName}'s learning journey:

📊 <b>Current Progress:</b>
• Focus Time: ${Math.floor(weeklyFocusTime / 3600)}h this week (${Math.floor(totalFocusTime / 3600)}h total)
• Task Success: ${weeklyCompletionRate}% completion rate this week
• Study Pattern: Most productive on ${bestDay}
• Consistency: Active ${activeDaysThisWeek}/7 days this week

🎯 <b>Key Insights:</b>
${avgSessionLength > 25 ? "• Excellent focus stamina - sessions average " + avgSessionLength + " minutes" : "• Building focus stamina - encourage longer sessions"}
${weeklyCompletionRate >= 70 ? "• Strong task management skills" : "• Opportunity to improve task completion"}
${todayFocusTime > 0 ? "• Actively studying today (" + Math.floor(todayFocusTime / 60) + " min focused)" : "• Haven't started studying today yet"}

As their academic coach, I recommend: ${weeklyCompletionRate < 50 ? "breaking tasks into smaller chunks" : "maintaining current momentum"}. 

Happy to discuss specific strategies! 🌟`;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I'm analyzing your child's learning patterns. Please give me a moment to provide detailed insights!";

    return aiResponse;

  } catch (error) {
    console.error("Error generating AI coach response:", error);
    return `🔄 <b>Academic Coach for ${studentName}</b>

Hi ${parentName}! I'm having a brief technical moment while analyzing ${studentName}'s comprehensive learning data. 

I have access to all their focus sessions, task patterns, mood trends, and study reflections. Please try your question again in just a moment, and I'll provide you with detailed insights about their academic journey! 

I'm here to help you support ${studentName}'s success. 📚✨`;
  }
}

async function generateWeeklyReport(user: any, studentName: string): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [focusData, taskData, moodData] = await Promise.all([
    supabase.from("FocusSession").select("duration").eq("userId", user.id).gte("createdAt", weekAgo.toISOString()),
    supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", weekAgo.toISOString()),
    supabase.from("Mood").select("mood").eq("userId", user.id).gte("createdAt", weekAgo.toISOString())
  ]);

  const totalFocus = focusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
  const focusHours = Math.floor(totalFocus / 3600);
  const focusMinutes = Math.floor((totalFocus % 3600) / 60);
  const tasksCompleted = taskData.data?.length || 0;
  const avgMood = moodData.data && moodData.data.length > 0 
    ? (moodData.data.reduce((sum, m) => sum + m.mood, 0) / moodData.data.length).toFixed(1)
    : "No data";

  return `📊 <b>${studentName}'s Weekly Report</b>
🗓️ Last 7 days

⏱️ <b>Focus Time:</b> ${focusHours}h ${focusMinutes}m
✅ <b>Tasks Completed:</b> ${tasksCompleted}
😊 <b>Average Mood:</b> ${avgMood}/10
🌳 <b>Trees Grown:</b> ${Math.floor(totalFocus / 1800)}

${totalFocus > 3600 ? "🎉 Excellent focus this week!" : "💪 Encourage more study sessions!"}
${tasksCompleted > 5 ? "✨ Great task completion!" : "📝 Help set daily goals!"}`;
}

async function generateTodayReport(user: any, studentName: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  
  const [focusData, taskData, moodData] = await Promise.all([
    supabase.from("FocusSession").select("duration").eq("userId", user.id).gte("createdAt", today),
    supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", today),
    supabase.from("Mood").select("mood").eq("userId", user.id).gte("createdAt", today)
  ]);

  const todayFocus = focusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
  const focusMinutes = Math.floor(todayFocus / 60);
  const tasksToday = taskData.data?.length || 0;
  const todayMood = moodData.data?.[moodData.data.length - 1]?.mood || "Not recorded";

  return `📅 <b>${studentName}'s Today</b>
${new Date().toLocaleDateString()}

⏱️ <b>Study Time:</b> ${focusMinutes} minutes
✅ <b>Tasks Done:</b> ${tasksToday}
😊 <b>Mood:</b> ${todayMood}/10

${focusMinutes > 60 ? "🔥 Great focus today!" : "🎯 Still time to study more!"}`;
}

async function generateFocusReport(user: any, studentName: string): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: sessions } = await supabase
    .from("FocusSession")
    .select("duration, createdAt")
    .eq("userId", user.id)
    .gte("createdAt", weekAgo.toISOString())
    .order("createdAt", { ascending: false });

  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
  const sessionCount = sessions?.length || 0;
  const avgSession = sessionCount > 0 ? Math.floor(totalMinutes / sessionCount / 60) : 0;

  return `🎯 <b>${studentName}'s Focus Stats</b>

📊 <b>This Week:</b>
• Total Time: ${Math.floor(totalMinutes / 3600)}h ${Math.floor((totalMinutes % 3600) / 60)}m
• Sessions: ${sessionCount}
• Average Session: ${avgSession} minutes

${sessionCount > 10 ? "🌟 Excellent study consistency!" : "💪 Building great habits!"}`;
}

async function generateTaskReport(user: any, studentName: string): Promise<string> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [completedData, allTasksData] = await Promise.all([
    supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", weekAgo.toISOString()),
    supabase.from("Task").select("*").eq("userId", user.id).gte("createdAt", weekAgo.toISOString())
  ]);

  const completed = completedData.data?.length || 0;
  const total = allTasksData.data?.length || 0;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return `📝 <b>${studentName}'s Task Progress</b>

✅ <b>Completed:</b> ${completed}
⏳ <b>Pending:</b> ${pending}
📊 <b>Completion Rate:</b> ${completionRate}%

${completionRate > 80 ? "🎉 Amazing productivity!" : "📋 Room for improvement!"}`;
}

async function generateMoodReport(user: any, studentName: string): Promise<string> {
  const { data: moods } = await supabase
    .from("Mood")
    .select("mood, createdAt")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(7);

  if (!moods || moods.length === 0) {
    return `😊 <b>${studentName}'s Mood</b>

No mood data recorded yet. Encourage them to track their daily mood in the app! 💫`;
  }

  const latestMood = moods[0].mood;
  const avgMood = (moods.reduce((sum, m) => sum + m.mood, 0) / moods.length).toFixed(1);

  return `😊 <b>${studentName}'s Mood Update</b>

🎭 <b>Latest:</b> ${latestMood}/10
📊 <b>Recent Average:</b> ${avgMood}/10
📈 <b>Entries:</b> ${moods.length} recent

${latestMood >= 7 ? "🌟 They're feeling great!" : latestMood >= 5 ? "😌 Doing okay" : "💙 Might need some support"}`;
}

async function generateSmartResponse(text: string, user: any, studentName: string): Promise<string> {
  // Smart routing based on question content
  if (text.includes("doing") || text.includes("progress")) {
    return await generateWeeklyReport(user, studentName);
  } else if (text.includes("today") || text.includes("accomplish")) {
    return await generateTodayReport(user, studentName);
  } else if (text.includes("study") || text.includes("focus")) {
    return await generateFocusReport(user, studentName);
  } else {
    return `🤖 I understand you're asking about ${studentName}! 

Try asking more specifically:
• "How is their progress this week?"
• "What did they do today?"
• "How much did they study?"
• "Are they completing tasks?"

Or type "help" for all commands! 😊`;
  }
}
