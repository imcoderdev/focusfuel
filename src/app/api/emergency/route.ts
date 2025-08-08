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

  const { issue } = await request.json();
  if (!issue || typeof issue !== "string") {
    return NextResponse.json({ error: "Issue is required" }, { status: 400 });
  }
  // Compose supportive prompt
  const prompt = `Hey! Looks like something's throwing you off in your focus session. No stress—you're already winning by hitting this button! 

The student's input: "${issue}"

Generate a short, supportive response (1-2 sentences) that's relatable, action-oriented, and concise. Be encouraging and offer a practical solution.

Examples:
- Student: "noisy room" → "Noisy room? Try earplugs or a quieter spot. Feeling better? Let me know!"
- Student: "feeling stuck" → "Stuck, huh? Take a 2-min break and pick one small step. How's that feel?"

Keep it friendly, brief, and actionable.`;
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
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you. Take a deep breath and let's refocus together.";
    // Log emergency event
    await prisma.emergencyLog.create({
      data: {
        userId: user.id,
        issue,
        aiResponse,
      },
    });
    return NextResponse.json({ aiResponse });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get AI support" }, { status: 500 });
  }
} 