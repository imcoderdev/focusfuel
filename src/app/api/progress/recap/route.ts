import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini API key not set" }, { status: 500 });
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  // Fetch stats
  const sessions = await prisma.focusSession.findMany({ where: { userId: user.id, startTime: { gte: start } } });
  const tasks = await prisma.task.findMany({ where: { userId: user.id, createdAt: { gte: start } } });
  const reflections = await prisma.reflection.findMany({ where: { userId: user.id, sessionDate: { gte: start } } });
  const moods = await prisma.mood.findMany({ where: { userId: user.id, createdAt: { gte: start } } });
  // Summarize
  const focusMinutes = sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);
  const tasksDone = tasks.length;
  const distractions = reflections.map(r => r.distractions).filter(Boolean).join(", ");
  const moodCounts: Record<string, number> = {};
  moods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
  // Build prompt
  const prompt = `Summarize this user's week for a productivity dashboard:\n- Focused for ${focusMinutes} minutes\n- Completed ${tasksDone} tasks\n- Top distractions: ${distractions || "none"}\n- Mood breakdown: ${Object.entries(moodCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}\nGive a short, positive recap and one actionable suggestion.`;
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  try {
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await geminiRes.json();
    const recap = data.candidates?.[0]?.content?.parts?.[0]?.text || "Great job this week!";
    return NextResponse.json({ recap });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get AI recap" }, { status: 500 });
  }
} 