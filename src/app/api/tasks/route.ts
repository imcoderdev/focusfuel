import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, return empty tasks array
      return NextResponse.json([]);
    }

    if (userError) {
      console.error('❌ Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get tasks directly from Supabase
    const { data: tasks, error: tasksError } = await supabase
      .from('Task')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('❌ Unexpected error in GET /api/tasks:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, completed, completedAt, description, dueDate, priority } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create task directly in Supabase
    const { data: task, error: taskError } = await supabase
      .from('Task')
      .insert({
        title,
        userId: user.id,
        completed: completed ?? false,
        completedAt: completed ? (completedAt ? new Date(completedAt).toISOString() : new Date().toISOString()) : null,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority: priority || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (taskError) {
      console.error('❌ Error creating task:', taskError);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/tasks:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
