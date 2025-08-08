"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { forceClearCookiesAndReload } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth-client";
import { useSupabaseAuth } from "@/components/AuthProvider";

export default function DebugAuthPage() {
  const [cookies, setCookies] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("testpassword123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [envCheck, setEnvCheck] = useState<{url: string, key: string}>({url: '', key: ''});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { signUp, signIn } = useAuth();
  const { user, session } = useSupabaseAuth();

  useEffect(() => {
    // Show current cookies
    if (typeof window !== 'undefined') {
      const allCookies = document.cookie.split(';').filter(c => c.trim() !== '');
      setCookies(allCookies);
      
      // Check environment variables
      setEnvCheck({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
      });
    }
    
    // Get current user from Supabase
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Error getting user:', error);
      }
      setCurrentUser(data.user);
    });
  }, []);

  const handleClearEverything = () => {
    setMessage("Clearing all cookies and reloading...");
    
    // Clear all cookies more aggressively
    if (typeof window !== 'undefined') {
      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Also clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleTestSignUp = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('Attempting signup with:', { email: testEmail, password: testPassword });
      const { data, error } = await signUp(testEmail, testPassword, "Test User");
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        setMessage(`Signup Error: ${error.message} (Code: ${error.status || 'unknown'})`);
        console.error('Full signup error:', error);
      } else {
        setMessage(`Signup Success! User ID: ${data.user?.id}, Email: ${data.user?.email}, Email Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Update current user display
        setCurrentUser(data.user);
        
        // Also try to get the user from Supabase directly
        const supabase = createSupabaseClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('Current user after signup:', { userData, userError });
      }
    } catch (err) {
      console.error('Signup exception:', err);
      setMessage(`Unexpected Error: ${err}`);
    }
    
    setLoading(false);
  };

  const handleTestSignIn = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('Attempting signin with:', { email: testEmail, password: testPassword });
      const { data, error } = await signIn(testEmail, testPassword);
      
      console.log('Signin response:', { data, error });
      
      if (error) {
        setMessage(`Login Error: ${error.message} (Code: ${error.status || 'unknown'})`);
        console.error('Full signin error:', error);
      } else {
        setMessage(`Login Success! User ID: ${data.user?.id}, Email: ${data.user?.email}, Session: ${data.session ? 'Active' : 'None'}`);
        
        // Update current user display
        setCurrentUser(data.user);
        
        // Also check session
        const supabase = createSupabaseClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Current session after signin:', { sessionData, sessionError });
      }
    } catch (err) {
      console.error('Signin exception:', err);
      setMessage(`Unexpected Error: ${err}`);
    }
    
    setLoading(false);
  };

  const handleTestMoodAPI = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('Testing mood API with current authentication...');
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: 'test-mood' }),
      });
      
      const result = await response.json();
      console.log('Mood API response:', { status: response.status, result });
      
      if (response.ok) {
        setMessage(`Mood API Success! Mood saved: ${result.mood?.id}`);
      } else {
        setMessage(`Mood API Error: ${result.error} (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Mood API exception:', err);
      setMessage(`Mood API Exception: ${err}`);
    }
    
    setLoading(false);
  };

  const handleTestDirectMood = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('Testing DIRECT mood save - bypassing all auth...');
      const response = await fetch('/api/mood-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mood: 'happy-direct-' + Date.now() }),
      });
      
      const result = await response.json();
      console.log('Direct mood API response:', { status: response.status, result });
      
      if (response.ok) {
        setMessage(`🎉 DIRECT SAVE SUCCESS! Mood ID: ${result.mood?.id}, User: ${result.mood?.user_id}, Time: ${result.mood?.created_at}`);
      } else {
        setMessage(`Direct Save Error: ${result.error} (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Direct mood API exception:', err);
      setMessage(`Direct Mood Exception: ${err}`);
    }
    
    setLoading(false);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      console.log('Testing basic Supabase connection...');
      const response = await fetch('/api/test-connection');
      
      const result = await response.json();
      console.log('Connection test response:', { status: response.status, result });
      
      if (response.ok) {
        setMessage(`🔗 CONNECTION SUCCESS! Supabase responded with status ${result.supabaseResponse?.status}. Body: ${result.supabaseResponse?.body}`);
      } else {
        setMessage(`Connection Error: ${result.error} - ${result.details}`);
      }
    } catch (err) {
      console.error('Connection test exception:', err);
      setMessage(`Connection Exception: ${err}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🔧 Authentication Debug Center
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools for testing Supabase authentication, clearing cookies, and debugging login issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Environment Check */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                ⚙️ Environment Status
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Supabase URL:</span>
                  <span className={`px-2 py-1 rounded text-sm ${envCheck.url !== 'NOT_SET' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {envCheck.url !== 'NOT_SET' ? '✅ SET' : '❌ NOT SET'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Supabase Anon Key:</span>
                  <span className={`px-2 py-1 rounded text-sm ${envCheck.key === 'SET' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {envCheck.key === 'SET' ? '✅ SET' : '❌ NOT SET'}
                  </span>
                </div>
                {envCheck.url !== 'NOT_SET' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm font-mono break-all">
                      URL: {envCheck.url}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Authentication State */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                👤 Current Auth State
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700 mb-2">AuthProvider User:</p>
                  <div className={`px-3 py-2 rounded text-sm ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user ? `✅ Logged in: ${user.email} (ID: ${user.id})` : '❌ Not logged in'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700 mb-2">Direct Supabase User:</p>
                  <div className={`px-3 py-2 rounded text-sm ${currentUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {currentUser ? `✅ Found: ${currentUser.email} (ID: ${currentUser.id})` : '❌ No user found'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-700 mb-2">Session Status:</p>
                  <div className={`px-3 py-2 rounded text-sm ${session ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {session ? `✅ Active session: ${session.access_token ? 'Has token' : 'No token'}` : '❌ No active session'}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Cookies */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                🍪 Browser Cookies
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border max-h-48 overflow-y-auto">
                {cookies.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-semibold">✅ No cookies found - Perfect for a fresh start!</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {cookies.map((cookie, index) => (
                      <li key={index} className="text-sm font-mono text-gray-700 bg-white p-2 rounded border">
                        {cookie.trim()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Clear Everything */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                🧹 Reset Everything
              </h2>
              <button
                onClick={handleClearEverything}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-lg font-bold text-lg shadow-md transform transition-all duration-200 hover:scale-105"
              >
                🔄 Clear All Cookies & Reload Page
              </button>
              <p className="text-gray-600 text-sm mt-3 text-center">
                This will delete all browser cookies and reload the page for a completely fresh start.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Test Registration */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                🆕 Test Supabase Authentication
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Email:</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Enter test email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Password:</label>
                  <input
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Enter test password"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleTestSignUp}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "..." : "📝 Test Sign Up"}
                  </button>
                  <button
                    onClick={handleTestSignIn}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "..." : "🔐 Test Sign In"}
                  </button>
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleTestMoodAPI}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "..." : "🎭 Test Mood API"}
                  </button>
                  <p className="text-gray-600 text-xs text-center mt-2">
                    Test if mood saving works with current authentication
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleTestDirectMood}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "..." : "🚀 FORCE SAVE MOOD (No Auth)"}
                  </button>
                  <p className="text-gray-600 text-xs text-center mt-2">
                    Directly save mood to Supabase without any authentication
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                  >
                    {loading ? "..." : "🔍 TEST SUPABASE CONNECTION"}
                  </button>
                  <p className="text-gray-600 text-xs text-center mt-2">
                    Test basic Supabase connectivity and environment variables
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                🚀 Quick Navigation
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/login"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold text-center transform transition-all duration-200 hover:scale-105"
                >
                  🔐 Login Page
                </a>
                <a
                  href="/register"
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold text-center transform transition-all duration-200 hover:scale-105"
                >
                  📝 Register
                </a>
                <a
                  href="/dashboard"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-semibold text-center transform transition-all duration-200 hover:scale-105"
                >
                  📊 Dashboard
                </a>
                <a
                  href="/"
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold text-center transform transition-all duration-200 hover:scale-105"
                >
                  🏠 Home
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {message && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                📋 Test Results
              </h2>
              <div className={`p-4 rounded-lg border-2 ${
                message.includes('Success') ? 'bg-green-50 border-green-200 text-green-800' :
                message.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <p className="font-semibold">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
            📖 How to Use This Debug Center
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ol className="list-decimal list-inside text-blue-800 space-y-2">
              <li className="font-semibold">Clear all cookies for a fresh start</li>
              <li>Test user registration with Supabase</li>
              <li>Check email for confirmation (if enabled)</li>
              <li>Test login with the new account</li>
            </ol>
            <ol className="list-decimal list-inside text-blue-800 space-y-2" start={5}>
              <li>Navigate to normal login/register pages</li>
              <li>Verify mood tracking works properly</li>
              <li>Use dashboard tools for further testing</li>
              <li>Report any issues found during testing</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
