import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { mood } = await req.json();
    
    if (!mood) {
      return NextResponse.json({ error: "Mood is required" }, { status: 400 });
    }

    console.log('🚀 DIRECT MOOD SAVE ATTEMPT:', mood);
    
    // Use service role key to bypass RLS (if available)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Try service role first (bypasses RLS), fallback to anon key
    const supabase = createClient(
      supabaseUrl!,
      serviceKey && serviceKey !== 'your_actual_service_role_key_here' ? serviceKey : anonKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Using key type:', serviceKey && serviceKey !== 'your_actual_service_role_key_here' ? 'SERVICE_ROLE' : 'ANON');
    
    // Create a unique user ID
    const testUserId = 'test-user-' + Date.now();
    
    console.log('Step 1: Creating test user with correct schema...');
    
    // Create user with snake_case columns (from API schema)
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (userError) {
      console.error('❌ USER CREATION FAILED:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code,
        full: userError
      });
      
      // If user creation fails, try a more comprehensive error message
      return NextResponse.json({ 
        error: "Failed to create test user", 
        details: userError.message,
        code: userError.code,
        hint: userError.hint,
        solution: "This is likely a Row Level Security (RLS) issue. Please run the SQL commands in supabase-fix.sql in your Supabase dashboard."
      }, { status: 500 });
    }
    
    console.log('✅ User created successfully:', userData[0]);
    
    console.log('Step 2: Creating mood entry with correct schema...');
    
    // Create mood with camelCase columns (from API schema)
    const { data: moodData, error: moodError } = await supabase
      .from('Mood')
      .insert({
        mood: mood,
        userId: testUserId,
        createdAt: new Date().toISOString()
      })
      .select();
    
    if (moodError) {
      console.error('❌ MOOD CREATION FAILED:', {
        message: moodError.message,
        details: moodError.details,
        hint: moodError.hint,
        code: moodError.code,
        full: moodError
      });
      return NextResponse.json({ 
        error: "Failed to create mood", 
        details: moodError.message,
        code: moodError.code,
        hint: moodError.hint,
        solution: "This is likely a Row Level Security (RLS) issue. Please run the SQL commands in supabase-fix.sql in your Supabase dashboard."
      }, { status: 500 });
    }
    
    console.log('✅ MOOD CREATED SUCCESSFULLY:', moodData[0]);
    
    return NextResponse.json({ 
      success: true, 
      mood: moodData[0],
      user: userData[0],
      message: '🎉 Mood saved successfully with new test user!' 
    });
    
  } catch (e) {
    console.error('💥 EXCEPTION:', e);
    return NextResponse.json({ 
      error: "Exception occurred", 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}
