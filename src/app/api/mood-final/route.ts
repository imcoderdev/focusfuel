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
  try {
    const { mood, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }

    // Find or create user by email
    let { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) {
      console.log('🔧 Creating user for:', userEmail);
      const { data: newUser } = await supabase
        .from('User')
        .insert({
          id: crypto.randomUUID(),
          email: userEmail,
          name: userEmail.split('@')[0]
        })
        .select()
        .single();
      user = newUser;
    }

    // Save mood
    const { data: moodData, error: moodError } = await supabase
      .from('Mood')
      .insert({
        mood: mood,
        userId: user.id
      })
      .select()
      .single();

    if (moodError) {
      console.error('Error saving mood:', moodError);
      return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      mood: moodData,
      message: "Mood saved successfully! 🌱"
    });

  } catch (error) {
    console.error('Error in mood-final:', error);
    return NextResponse.json({ 
      error: "Failed to save mood", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}