import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.NODE_ENV !== 'production') {
  console.warn('Missing Supabase environment variables, using placeholders')
}

// Server-side Supabase client with cookies support (for Server Components)
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component
        }
      },
    },
  })
}

// Server-side Supabase client for API routes with Request object
export const createServerSupabaseClientFromRequest = (request: Request) => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('cookie')
        if (!cookieHeader) {
          console.log('No cookie header found in request')
          return []
        }
        
        console.log('Raw cookie header:', cookieHeader)
        
        const cookies = cookieHeader.split(';').map(cookie => {
          const trimmedCookie = cookie.trim()
          const [name, ...rest] = trimmedCookie.split('=')
          return { 
            name: name.trim(), 
            value: rest.join('=').trim() 
          }
        }).filter(cookie => {
          // Only return Supabase-related cookies
          const isSupabaseCookie = cookie.name && cookie.value && 
            (cookie.name.startsWith('sb-') || cookie.name.includes('supabase'));
          
          if (isSupabaseCookie) {
            console.log('Found Supabase cookie:', cookie.name);
          } else if (cookie.name.startsWith('next-auth')) {
            console.log('Ignoring NextAuth cookie:', cookie.name);
          }
          
          return isSupabaseCookie;
        })
        
        console.log('Filtered Supabase cookies:', cookies)
        return cookies
      },
      setAll(cookiesToSet: any) {
        // API routes can't set cookies directly, this would need response handling
        // For now, we'll just read cookies for authentication
        console.log('Attempt to set cookies:', cookiesToSet)
      },
    },
  })
}

// Database types (to be updated after generating types from Supabase)
export type Database = {
  // Will be populated after Supabase setup
}
