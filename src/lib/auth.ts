import { createServerSupabaseClient } from './supabase'
import { redirect } from 'next/navigation'

// Server-side auth helpers only
export const getServerUser = async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Auth error:', error)
    return null
  }
  return user
}

export const requireAuth = async () => {
  const user = await getServerUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export const getUserSession = async () => {
  const supabase = await createServerSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Session error:', error)
    return null
  }
  return session
}
