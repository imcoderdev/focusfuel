import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get all reflections to verify they exist
    const reflections = await prisma.reflection.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { sessionDate: 'desc' },
      take: 10 // Get last 10 reflections
    });

    console.log("Found reflections:", reflections);

    return NextResponse.json({ 
      success: true, 
      reflections,
      count: reflections.length,
      message: `Found ${reflections.length} reflections in database`
    });
    
  } catch (error) {
    console.error("Verify reflections API error:", error);
    return NextResponse.json({ 
      error: "Failed to verify reflections",
      details: error
    }, { status: 500 });
  }
}
