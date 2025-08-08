import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientFromRequest } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not set" }, { status: 500 });
  }

  // Get user from Supabase auth using request cookies
  const supabase = createServerSupabaseClientFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized - Please log in first" }, { status: 401 });
  }

  // Check if user profile exists in our database
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return NextResponse.json({ 
      error: "User profile not found. Please complete your profile setup." 
    }, { status: 404 });
  }

  const { tasks } = await request.json();
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
  }

  // Fetch latest mood
  const latestMood = await prisma.mood.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const mood = latestMood?.mood || "neutral";

  // Build prompt for Gemini
  const prompt = `
The user is feeling '${mood}'. Here are their tasks:
${tasks.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}

Rearrange these tasks into the optimal order for productivity, considering the user's mood.
Return ONLY a JSON array of the reordered task titles, like:
["First task", "Second task", "Third task"]
Do NOT include any explanation, markdown, or code block formatting. Only return the JSON array, nothing else.
Do NOT wrap the array in triple backticks or any other formatting.
`;

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await geminiRes.json();
    return NextResponse.json({ plan: data });
  } catch (e) {
    return NextResponse.json({ error: "Failed to call Gemini API" }, { status: 500 });
  }
} 