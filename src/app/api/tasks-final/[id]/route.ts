import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { title, completed, completedAt, description, dueDate, priority, userEmail } = await request.json();
    const resolvedParams = await params;
    const taskId = resolvedParams.id;
    
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
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update task (only if it belongs to this user)
    const { data: task, error: taskError } = await supabase
      .from('Task')
      .update({
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt).toISOString() : null }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate).toISOString() : null }),
        ...(priority !== undefined && { priority }),
        updatedAt: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('userId', user.id)
      .select()
      .single();

    if (taskError) {
      console.error('Error updating task:', taskError);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const resolvedParams = await params;
    const taskId = resolvedParams.id;
    
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
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete task (only if it belongs to this user)
    const { error: deleteError } = await supabase
      .from('Task')
      .delete()
      .eq('id', taskId)
      .eq('userId', user.id);

    if (deleteError) {
      console.error('Error deleting task:', deleteError);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Task deleted successfully!"
    });

  } catch (error) {
    console.error('Error in tasks-final DELETE:', error);
    return NextResponse.json({ 
      error: "Failed to delete task", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
