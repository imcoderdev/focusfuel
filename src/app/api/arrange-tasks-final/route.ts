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
    const { tasks, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
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

    // Fetch latest mood for the user
    const { data: latestMood } = await supabase
      .from('Mood')
      .select('mood')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    const mood = latestMood?.mood || "neutral";

    // Build prompt for Gemini with more context
    const prompt = `
The user is currently feeling '${mood}'. Here are their tasks:
${tasks.map((t, i) => `${i + 1}. ${t.title} (Priority: ${t.priority || 'medium'}, Deadline: ${t.deadline || 'none'})`).join("\n")}

Based on their current mood and task details, rearrange these tasks into the optimal order for maximum productivity and wellbeing.

Mood-based optimization:
- If happy/focused: Start with challenging tasks to leverage high energy
- If stressed: Begin with easier wins to build momentum  
- If tired: Prioritize urgent items first, defer complex work
- If sad: Include enjoyable/meaningful tasks early to boost motivation

Return ONLY a JSON array of the reordered task titles in optimal sequence:
["First task title", "Second task title", "Third task title"]

Do NOT include explanations, markdown, or code blocks. Only return the JSON array.
`;

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
    
    // Extract the text content from Gemini's response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("No response from Gemini API");
    }

    // Try to parse the JSON response
    let arrangedTasks;
    try {
      // Clean the response (remove any potential markdown formatting)
      const cleanedText = generatedText.replace(/```json\s*|\s*```/g, '').trim();
      arrangedTasks = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      return NextResponse.json({ 
        error: "Failed to parse AI response", 
        rawResponse: generatedText 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      arrangedTasks,
      mood,
      message: `Tasks optimized for your ${mood} mood!`
    });

  } catch (error) {
    console.error('Error in arrange-tasks-final:', error);
    return NextResponse.json({ 
      error: "Failed to arrange tasks", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
