import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();
    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }

    console.log('🎯 Attempting to save mood:', mood);

    // Create Supabase client with cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message || 'No user');
      return NextResponse.json({ error: "Unauthorized - Please log in first" }, { status: 401 });
    }

    console.log('✅ Authenticated user:', user.id, user.email);

    // Insert mood directly into Supabase (RLS will handle authorization)
    const { data: moodData, error: moodError } = await supabase
      .from('Mood')
      .insert({
        mood: mood,
        userId: user.id
      })
      .select()
      .single();

    if (moodError) {
      console.log('❌ Mood insert error:', moodError);
      return NextResponse.json({ error: "Failed to save mood: " + moodError.message }, { status: 500 });
    }

    console.log('✅ Mood saved successfully:', moodData);
    return NextResponse.json({ success: true, mood: moodData });
    
  } catch (e) {
    console.error('💥 Mood API exception:', e);
    return NextResponse.json({ 
      error: "Failed to save mood", 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
} 