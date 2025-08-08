import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single instance to avoid multiple clients
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Export the singleton instance
export const createSupabaseClient = () => {
  return supabaseClient
}

// Default client for general use (same instance)
export const supabase = supabaseClient

// Database types (to be updated after generating types from Supabase)
export type Database = {
  // Will be populated after Supabase setup
}
