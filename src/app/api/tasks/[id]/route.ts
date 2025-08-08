import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { title, completed, description, dueDate, priority } = await request.json();
    
    if (!title && typeof completed !== "boolean" && !description && !dueDate && !priority) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
    }

    const data: any = { updatedAt: new Date().toISOString() };
    if (title) data.title = title;
    if (typeof completed === "boolean") {
      data.completed = completed;
      data.completedAt = completed ? new Date().toISOString() : null;
    }
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
    if (priority !== undefined) data.priority = priority;

    const { data: updatedTask, error: updateError } = await supabase
      .from('Task')
      .update(data)
      .eq('id', parseInt(params.id))
      .eq('userId', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating task:', updateError);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found or not yours" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('❌ Unexpected error in PUT /api/tasks/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: deletedTask, error: deleteError } = await supabase
      .from('Task')
      .delete()
      .eq('id', parseInt(params.id))
      .eq('userId', user.id)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ Error deleting task:', deleteError);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found or not yours" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/tasks/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 