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
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get tasks for this user
    const { data: tasks, error: tasksError } = await supabase
      .from('Task')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    return NextResponse.json(tasks || []);

  } catch (error) {
    console.error('Error in tasks-final GET:', error);
    return NextResponse.json({ 
      error: "Failed to fetch tasks", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, completed, completedAt, description, dueDate, priority, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Find or create user by email
    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create one
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: crypto.randomUUID(),
          email: userEmail,
          name: userEmail.split('@')[0], // Use email prefix as default name
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
      }
      user = newUser;
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Create task
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
      console.error('Error creating task:', taskError);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      task,
      message: "Task created successfully!"
    });

  } catch (error) {
    console.error('Error in tasks-final POST:', error);
    return NextResponse.json({ 
      error: "Failed to create task", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { taskId, completed, completedAt, userEmail, title, description, priority } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Update task
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? (completedAt || new Date().toISOString()) : null;
    }

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;

    const { data: task, error: taskError } = await supabase
      .from('Task')
      .update(updateData)
      .eq('id', taskId)
      .eq('userId', user.id)
      .select()
      .single();

    if (taskError) {
      console.error('Error updating task:', taskError);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      task,
      message: "Task updated successfully!"
    });

  } catch (error) {
    console.error('Error in tasks-final PUT:', error);
    return NextResponse.json({ 
      error: "Failed to update task", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
