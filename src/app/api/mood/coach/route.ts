import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { mood, userEmail } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }

    let coachingMessage = "";

    // Get user's highest priority uncompleted task for context-aware coaching
    let userTask = null;
    if (userEmail) {
      try {
        const { data: tasks } = await supabase
          .from('Task')
          .select('title, priority')
          .eq('userEmail', userEmail)
          .eq('completed', false)
          .order('priority', { ascending: true })
          .limit(1);

        if (tasks && tasks.length > 0) {
          userTask = tasks[0];
        }
      } catch (error) {
        console.log("Could not fetch user tasks for coaching context");
      }
    }

    // Context-aware coaching messages based on mood and user's tasks
    switch (mood.toLowerCase()) {
      case "stressed":
        if (userTask) {
          coachingMessage = `Feeling stressed is completely normal. How about we tackle just one thing? Your task "${userTask.title}" looks important. Let's try a short 20-minute focus session to get started and build some momentum.`;
        } else {
          coachingMessage = "Stress is your mind's way of saying you care. Let's break things down into smaller, manageable steps. Try a 15-minute focus session to create some calm momentum.";
        }
        break;

      case "tired":
        if (userTask) {
          coachingMessage = `Rest is just as important as productivity. Your task "${userTask.title}" will still be there after you recharge. Consider a gentle 10-minute session or maybe it's time for a proper break.`;
        } else {
          coachingMessage = "Tiredness is your body's wisdom speaking. Listen to it. Maybe start with just organizing your thoughts or do some light planning before diving into heavy work.";
        }
        break;

      case "happy":
        if (userTask) {
          coachingMessage = `Your positive energy is powerful! This is perfect timing to tackle "${userTask.title}". When we're happy, we're more creative and productive. Let's ride this wave!`;
        } else {
          coachingMessage = "Happiness is your superpower today! This positive energy makes everything easier. Perfect time to tackle challenging tasks or start something new.";
        }
        break;

      case "focused":
        if (userTask) {
          coachingMessage = `You're in the zone! This focused state is gold for productivity. "${userTask.title}" doesn't stand a chance. Let's harness this focus with a longer session - maybe 45 minutes?`;
        } else {
          coachingMessage = "You're in the flow state - this is precious! This is when your best work happens. Consider tackling your most challenging or important task right now.";
        }
        break;

      case "sad":
        if (userTask) {
          coachingMessage = `It's okay to feel down - emotions are temporary but self-care isn't optional. Maybe "${userTask.title}" can wait. How about we focus on small wins or something that brings you joy?`;
        } else {
          coachingMessage = "Sadness is part of being human. Be gentle with yourself today. Small progress is still progress. Maybe focus on self-care or connecting with someone you care about.";
        }
        break;

      case "meh":
        if (userTask) {
          coachingMessage = `Feeling 'meh' is totally valid. Sometimes momentum starts with just showing up. What if we tackle "${userTask.title}" for just 15 minutes? No pressure - just see what happens.`;
        } else {
          coachingMessage = "Not every day feels inspiring, and that's perfectly human. Sometimes the best thing is to start small. Even tiny actions can shift your energy.";
        }
        break;

      default:
        coachingMessage = "Every feeling is valid and temporary. You're here, you're trying, and that matters. Let's take things one small step at a time.";
    }

    // Save the coaching interaction for analytics (optional)
    if (userEmail) {
      try {
        await supabase
          .from('Mood')
          .insert({
            userEmail,
            mood: mood.toLowerCase(),
            createdAt: new Date().toISOString(),
          });
      } catch (error) {
        // Don't fail the request if mood saving fails
        console.log("Could not save mood entry");
      }
    }

    return NextResponse.json({ 
      coachingMessage,
      success: true 
    });

  } catch (error) {
    console.error("Error in mood coaching:", error);
    return NextResponse.json(
      { error: "Failed to generate coaching message" }, 
      { status: 500 }
    );
  }
}
