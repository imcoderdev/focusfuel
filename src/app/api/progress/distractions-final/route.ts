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
      // User doesn't exist, return default empty distractions
      return NextResponse.json([
        { label: "phone", value: 0 },
        { label: "social", value: 0 },
        { label: "noise", value: 0 },
        { label: "other", value: 0 }
      ]);
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 });
    }

    // Get reflections with distractions
    const { data: reflections, error: reflectionsError } = await supabase
      .from('Reflection')
      .select('distractions')
      .eq('userId', user.id)
      .neq('distractions', '');

    if (reflectionsError) {
      console.error('Error fetching reflections:', reflectionsError);
      return NextResponse.json({ error: "Failed to fetch reflections" }, { status: 500 });
    }

    // Count distractions by type
    const distractionCounts: Record<string, number> = {
      phone: 0,
      social: 0,
      noise: 0,
      other: 0
    };

    reflections?.forEach(reflection => {
      const distraction = reflection.distractions?.toLowerCase() || '';
      if (distraction.includes('phone')) {
        distractionCounts.phone++;
      } else if (distraction.includes('social') || distraction.includes('instagram') || distraction.includes('facebook') || distraction.includes('twitter')) {
        distractionCounts.social++;
      } else if (distraction.includes('noise') || distraction.includes('sound')) {
        distractionCounts.noise++;
      } else if (distraction.trim()) {
        distractionCounts.other++;
      }
    });

    const result = [
      { label: "phone", value: distractionCounts.phone },
      { label: "social", value: distractionCounts.social },
      { label: "noise", value: distractionCounts.noise },
      { label: "other", value: distractionCounts.other }
    ];

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in progress distractions-final:', error);
    return NextResponse.json({ 
      error: "Failed to fetch distractions progress", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
