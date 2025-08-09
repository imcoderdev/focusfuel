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
      replyMessage = `🎯 Hello ${firstName}! 

Your unique Chat ID is: <b>${chatId}</b>

Please copy and paste this number into the FocusFuel app to enable weekly reports about your child's productivity progress.

You'll receive updates about:
📚 Study sessions completed
🌳 Digital trees grown
📈 Focus improvement trends
⏰ Time spent in productive activities

<b>💬 Interactive Commands:</b>
• Type "progress" or "report" - Get current week's progress
• Type "today" - Get today's activity
• Type "focus" - Get focus session stats
• Type "tasks" or "homework" - Get task completion status
• Type "mood" - Get recent mood updates
• Type "help" - See all available commands

Thank you for supporting your child's growth! 🌟`;
    }
    // Handle any other message (interactive queries)
    else {
      console.log("Processing interactive query...");
      
      // ALWAYS respond first, then try to find user data
      // This ensures the bot responds even if there are database issues
      let quickReply = `👋 Hi ${firstName}! I received your message: "${text}"

Let me check your child's data...`;

      // Send quick acknowledgment first
      const quickResponseUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      if (!isTestMode) {
        await fetch(quickResponseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: quickReply,
            parse_mode: "HTML",
          }),
        });
      } else {
        console.log("TEST MODE: Would send quick reply:", quickReply);
      }

      // Now try to find user and send detailed response
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
  console.log(`Generating AI response for query: "${text}" about student: ${studentName}`);

  try {
    // Gather all student data for AI analysis
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    const [focusData, taskData, moodData, todayFocusData, todayTaskData] = await Promise.all([
      supabase.from("FocusSession").select("duration, createdAt").eq("userId", user.id).gte("createdAt", weekAgo.toISOString()),
      supabase.from("Task").select("*").eq("userId", user.id).gte("createdAt", weekAgo.toISOString()),
      supabase.from("Mood").select("mood, createdAt").eq("userId", user.id).gte("createdAt", weekAgo.toISOString()),
      supabase.from("FocusSession").select("duration").eq("userId", user.id).gte("createdAt", today),
      supabase.from("Task").select("*").eq("userId", user.id).eq("completed", true).gte("completedAt", today)
    ]);

    // Process the data for AI context
    const weeklyFocusMinutes = focusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    const weeklyTasksTotal = taskData.data?.length || 0;
    const weeklyTasksCompleted = taskData.data?.filter(t => t.completed)?.length || 0;
    const weeklyMoods = moodData.data || [];
    const todayFocusMinutes = todayFocusData.data?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    const todayTasksCompleted = todayTaskData.data?.length || 0;
    
    const avgMood = weeklyMoods.length > 0 
      ? (weeklyMoods.reduce((sum, m) => sum + m.mood, 0) / weeklyMoods.length).toFixed(1)
      : "No data";

    // Prepare context for Gemini AI
    const studentDataContext = `
Student: ${studentName}
Email: ${user.email}
Parent: ${parentName}

WEEKLY DATA (Last 7 days):
- Total Focus Time: ${Math.floor(weeklyFocusMinutes / 60)} hours ${weeklyFocusMinutes % 60} minutes
- Focus Sessions: ${focusData.data?.length || 0}
- Tasks Created: ${weeklyTasksTotal}
- Tasks Completed: ${weeklyTasksCompleted}
- Completion Rate: ${weeklyTasksTotal > 0 ? Math.round((weeklyTasksCompleted / weeklyTasksTotal) * 100) : 0}%
- Average Mood: ${avgMood}/10
- Mood Entries: ${weeklyMoods.length}

TODAY'S DATA:
- Focus Time Today: ${Math.floor(todayFocusMinutes / 60)} hours ${todayFocusMinutes % 60} minutes
- Tasks Completed Today: ${todayTasksCompleted}

RECENT ACTIVITIES:
${focusData.data?.slice(-3).map(f => `- Focus session: ${Math.floor((f.duration || 0) / 60)} minutes on ${new Date(f.createdAt).toLocaleDateString()}`).join('\n') || '- No recent focus sessions'}
${taskData.data?.slice(-3).map(t => `- Task: "${t.title}" ${t.completed ? '✅ Completed' : '⏳ Pending'} on ${new Date(t.createdAt).toLocaleDateString()}`).join('\n') || '- No recent tasks'}
`;

    // Use Gemini AI to generate intelligent response
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant for parents to track their child's study progress through a productivity app called FocusFuel.

PARENT'S QUESTION: "${text}"

STUDENT DATA:
${studentDataContext}

INSTRUCTIONS:
1. Answer the parent's question naturally and conversationally
2. Use the student data to provide specific, accurate insights
3. Be encouraging and supportive in tone
4. Include relevant emoji and formatting for Telegram
5. Highlight positive achievements and gently suggest improvements where needed
6. Keep response under 300 words
7. Use HTML formatting: <b>bold</b>, <i>italic</i> for Telegram
8. If asking about homework/tasks, focus on completion rates and recent activity
9. If asking about progress, give a comprehensive weekly overview
10. If asking about today, focus on today's specific activities
11. Always end with an encouraging note or tip for the parent

Generate a personalized, intelligent response for this parent about their child ${studentName}.`
          }]
        }]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      // Fallback to simple response if AI fails
      return `📊 <b>${studentName}'s Progress Update</b>

⏱️ <b>This Week:</b> ${Math.floor(weeklyFocusMinutes / 60)}h ${weeklyFocusMinutes % 60}m focused
✅ <b>Tasks:</b> ${weeklyTasksCompleted}/${weeklyTasksTotal} completed (${weeklyTasksTotal > 0 ? Math.round((weeklyTasksCompleted / weeklyTasksTotal) * 100) : 0}%)
😊 <b>Mood:</b> ${avgMood}/10 average

${weeklyFocusMinutes > 3600 ? "🌟 Excellent focus this week!" : "💪 Encourage more study time!"}`;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Sorry, I couldn't generate a detailed report right now. Please try again!";

    return aiResponse;

  } catch (error) {
    console.error("Error generating AI response:", error);
    return `❌ Sorry ${parentName}, I had trouble analyzing ${studentName}'s data right now. Please try again in a moment! 🔄`;
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
