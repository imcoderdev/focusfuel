'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function UserDebugPage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const [dbUser, setDbUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      setLoading(true)
      
      // Check auth user
      const { data: { user: authUserData }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        setError(`Auth error: ${authError.message}`)
        return
      }
      
      setAuthUser(authUserData)
      
      if (authUserData) {
        // Check database user
        const { data: dbUserData, error: dbError } = await supabase
          .from('User')
          .select('*')
          .eq('id', authUserData.id)
          .single()
        
        if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows returned
          setError(`Database error: ${dbError.message}`)
        } else {
          setDbUser(dbUserData)
        }
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async () => {
    if (!authUser) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('User')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || 
                authUser.user_metadata?.name || 
                authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || null
        })
        .select()
        .single()
      
      if (error) {
        setError(`Failed to create profile: ${error.message}`)
      } else {
        setDbUser(data)
        setError('')
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    setDbUser(null)
    setError('')
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/user-debug`
      }
    })
    if (error) setError(`OAuth error: ${error.message}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-xl">Loading user data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔍 User Profile Debug Page
        </h1>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          {authUser ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ Authenticated</p>
              <p><strong>ID:</strong> {authUser.id}</p>
              <p><strong>Email:</strong> {authUser.email}</p>
              <p><strong>Provider:</strong> {authUser.app_metadata?.provider}</p>
              <p><strong>Name from metadata:</strong> {
                authUser.user_metadata?.full_name || 
                authUser.user_metadata?.name || 
                'Not set'
              }</p>
              <p><strong>Avatar:</strong> {authUser.user_metadata?.avatar_url || 'Not set'}</p>
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600">❌ Not authenticated</p>
              <button
                onClick={signInWithGoogle}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Database Profile Status */}
        {authUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Database Profile Status</h2>
            {dbUser ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Profile exists in database</p>
                <p><strong>ID:</strong> {dbUser.id}</p>
                <p><strong>Email:</strong> {dbUser.email}</p>
                <p><strong>Name:</strong> {dbUser.name}</p>
                <p><strong>Avatar URL:</strong> {dbUser.avatar_url || 'Not set'}</p>
                <p><strong>Created:</strong> {new Date(dbUser.created_at).toLocaleString()}</p>
              </div>
            ) : (
              <div>
                <p className="text-red-600">❌ No profile in database</p>
                <p className="text-sm text-gray-600 mb-4">
                  This is why mood saving and other features don't work!
                </p>
                <button
                  onClick={createUserProfile}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  🔧 Create Profile Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={checkUserStatus}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
            >
              🔄 Refresh Data
            </button>
            {authUser && dbUser && (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                🎯 Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
