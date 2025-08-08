"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useSupabaseAuth } from "@/components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";
import { Inter } from "next/font/google";
import { FaGoogle, FaGithub } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [confettiSize, setConfettiSize] = useState({ width: 300, height: 300 });
  const { signIn, signInWithGoogle, signInWithGitHub } = useAuth();
  const { user } = useSupabaseAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConfettiSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();
    
    const { data, error } = await signIn(form.email, form.password);
    
    setLoading(false);
    if (error) {
      toast.error(error.message || "Invalid email or password.");
    } else {
      setSuccess(true);
      toast.success("Login successful!");
      setTimeout(() => {
        setSuccess(false);
        router.push("/dashboard");
      }, 2000);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    toast.dismiss();
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || "Google sign in failed");
        setGoogleLoading(false);
      }
      // If successful, user will be redirected by Supabase
    } catch (err) {
      setGoogleLoading(false);
      toast.error("Google sign in failed");
    }
  }

  async function handleGitHubSignIn() {
    setGithubLoading(true);
    toast.dismiss();
    
    try {
      const { error } = await signInWithGitHub();
      if (error) {
        toast.error(error.message || "GitHub sign in failed");
        setGithubLoading(false);
      }
      // If successful, user will be redirected by Supabase
    } catch (err) {
      setGithubLoading(false);
      toast.error("GitHub sign in failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      {success && (
        <Confetti
          width={confettiSize.width}
          height={confettiSize.height}
          recycle={false}
          numberOfPieces={120}
          colors={["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"]}
        />
      )}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Your email address"
              value={form.email}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500"
              required
              suppressHydrationWarning
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="bg-slate-700 border border-slate-600 text-white rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500"
              required
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            suppressHydrationWarning
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <div className="flex items-center justify-center space-x-4 text-slate-400">
          <div className="flex-1 border-t border-slate-600"></div>
          <span className="px-2 text-sm font-medium">OR</span>
          <div className="flex-1 border-t border-slate-600"></div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            <FaGoogle className="text-lg text-blue-500" />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>
          <button 
            onClick={handleGitHubSignIn}
            disabled={loading || githubLoading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            <FaGithub className="text-lg" />
            {githubLoading ? "Connecting..." : "Continue with GitHub"}
          </button>
        </div>
        
        <div className="text-center text-slate-400 text-sm">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
} 