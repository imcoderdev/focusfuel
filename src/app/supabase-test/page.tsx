'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function SupabaseTestPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/supabase-test`
        }
      })
      if (error) throw error
      setStatus('Redirecting to Google...')
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setStatus('Signed out successfully')
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testMoodSave = async () => {
    if (!user) {
      setStatus('Please sign in first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: 'happy' }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus(`✅ Mood saved successfully! ID: ${data.mood.id}`)
      } else {
        setStatus(`❌ Failed to save mood: ${data.error}`)
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testTaskCreate = async () => {
    if (!user) {
      setStatus('Please sign in first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title: `Test Task ${Date.now()}`,
          description: 'Testing Supabase integration',
          priority: 1
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus(`✅ Task created successfully! ID: ${data.id}`)
      } else {
        setStatus(`❌ Failed to create task: ${data.error}`)
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🚀 NEW Supabase Integration Test
        </h1>

        {/* Auth Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          {user ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ Signed in as: {user.email}</p>
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-600">Provider: {user.app_metadata?.provider}</p>
              <button
                onClick={signOut}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-600">❌ Not signed in</p>
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          )}
        </div>

        {/* Test Actions */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Database Operations</h2>
            <div className="space-y-4">
              <button
                onClick={testMoodSave}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mr-4"
              >
                {loading ? 'Testing...' : '😊 Test Mood Save'}
              </button>
              
              <button
                onClick={testTaskCreate}
                disabled={loading}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : '✅ Test Task Create'}
              </button>
            </div>
          </div>
        )}

        {/* Status Display */}
        {status && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <p className={`text-sm ${status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
              {status}
            </p>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h3 className="font-semibold mb-2">Environment Info</h3>
          <p className="text-sm text-gray-600">Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p className="text-sm text-gray-600">
            Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  )
}
