import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email is required" },
        { status: 400 }
      );
    }

    console.log(`🌳 Fetching forest data for user: ${userEmail}`);

    // First find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all completed focus sessions for the user
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        // Only get completed sessions (you might want to add a 'completed' field to your schema)
      },
      orderBy: {
        startTime: 'asc' // Show trees in chronological order
      }
    });

    console.log(`🌳 Found ${sessions.length} sessions for user ${userEmail}`);

    return NextResponse.json({
      success: true,
      sessions: sessions,
      count: sessions.length
    });

  } catch (error) {
    console.error("🌳 Error fetching forest sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forest data" },
      { status: 500 }
    );
  }
}
