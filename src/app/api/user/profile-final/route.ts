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
      // User doesn't exist, return default profile
      return NextResponse.json({
        name: userEmail.split('@')[0],
        email: userEmail,
        image: null,
        avatar_url: null,
        created_at: new Date().toISOString()
      });
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.avatar_url || null,
      avatar_url: user.avatar_url || null,
      created_at: user.created_at
    });

  } catch (error) {
    console.error('Error in user profile-final GET:', error);
    return NextResponse.json({ 
      error: "Failed to fetch user profile", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { name, email, image, userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Find or create user by email
    let { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create one
      const { randomUUID } = await import('crypto');
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: randomUUID(),
          email: userEmail,
          name: name || userEmail.split('@')[0],
          avatar_url: image || null
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

    // Update user profile
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.avatar_url = image;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
    }

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.avatar_url || null,
      avatar_url: updatedUser.avatar_url || null
    });

  } catch (error) {
    console.error('Error in user profile-final PATCH:', error);
    return NextResponse.json({ 
      error: "Failed to update user profile", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
