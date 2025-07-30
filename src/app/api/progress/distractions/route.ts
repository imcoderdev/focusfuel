import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const reflections = await prisma.reflection.findMany({
    where: { userId: user.id, sessionDate: { gte: start } },
  });
  const counts: Record<string, number> = {};
  reflections.forEach(r => {
    if (r.distractions) {
      r.distractions.split(/,|;/).forEach(d => {
        const key = d.trim().toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const result = Object.entries(counts).map(([label, value]) => ({ label, value: Math.round((value / total) * 100) }));
  return NextResponse.json(result);
} 