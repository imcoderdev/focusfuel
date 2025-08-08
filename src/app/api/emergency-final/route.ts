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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not set" }, { status: 500 });
  }

  try {
    const { issue, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!issue || typeof issue !== "string") {
      return NextResponse.json({ error: "Issue is required" }, { status: 400 });
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

    // Fetch recent emergency conversation history for context
    const { data: recentEmergencies, error: historyError } = await supabase
      .from('EmergencyLog')
      .select('issue, aiResponse, createdAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(5); // Get last 5 interactions for context

    if (historyError) {
      console.error('Error fetching emergency history:', historyError);
      // Continue without history if there's an error
    }

    // Build conversation context
    let conversationContext = "";
    if (recentEmergencies && recentEmergencies.length > 0) {
      conversationContext = "\n\nRecent conversation history:\n";
      recentEmergencies.reverse().forEach((emergency, index) => {
        const timeAgo = new Date(emergency.createdAt);
        conversationContext += `${index + 1}. Student said: "${emergency.issue}" → AI responded: "${emergency.aiResponse}"\n`;
      });
      conversationContext += "\nBased on this history, provide a more personalized and contextual response.\n";
    }

    // Compose supportive prompt with conversation history
    // Compose supportive prompt with conversation history
    const prompt = `Hey! Looks like something's throwing you off in your focus session. No stress—you're already winning by hitting this button! 

The student's current input: "${issue}"
${conversationContext}

Generate a short, supportive response (1-2 sentences) that's relatable, action-oriented, and concise. Be encouraging and offer a practical solution.

If there's conversation history, acknowledge patterns or progress, and build upon previous interactions. If it's a recurring issue, offer alternative strategies or escalate the support level.

Examples:
- Student: "noisy room" → "Noisy room? Try earplugs or a quieter spot. Feeling better? Let me know!"
- Student: "feeling stuck" → "Stuck, huh? Take a 2-min break and pick one small step. How's that feel?"
- With history of noise issues: "Noise again? Let's try a different approach - white noise app or library study room?"
- With history of focus issues: "I see focus has been tricky lately. You're making progress by recognizing it! Try the 2-minute rule?"

Keep it friendly, brief, actionable, and contextually aware.`;

    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you. Take a deep breath and let's refocus together.";

    // Log emergency event
    const { error: logError } = await supabase
      .from('EmergencyLog')
      .insert({
        userId: user.id,
        issue,
        aiResponse,
        createdAt: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging emergency event:', logError);
      // Don't fail the request if logging fails, just log the error
    }

    return NextResponse.json({ 
      success: true,
      aiResponse,
      message: "AI support response generated successfully! 💚"
    });

  } catch (error) {
    console.error('Error in emergency-final:', error);
    return NextResponse.json({ 
      error: "Failed to get AI support", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
