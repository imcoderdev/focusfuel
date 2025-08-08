import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('🔍 BASIC CONNECTION TEST');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      url: supabaseUrl ? 'SET' : 'MISSING',
      key: supabaseKey ? `SET (${supabaseKey.substring(0, 20)}...)` : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: "Missing environment variables",
        url: !!supabaseUrl,
        key: !!supabaseKey
      }, { status: 500 });
    }
    
    // Try direct fetch to Supabase
    console.log('Testing direct fetch to Supabase...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('Direct fetch response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const text = await response.text();
    console.log('Response body:', text);
    
    return NextResponse.json({ 
      success: true,
      supabaseResponse: {
        status: response.status,
        statusText: response.statusText,
        body: text
      }
    });
    
  } catch (e) {
    console.error('💥 CONNECTION TEST FAILED:', e);
    return NextResponse.json({ 
      error: "Connection test failed", 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}
