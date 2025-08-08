"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";
import { Inter } from "next/font/google";
import { useAuth } from "@/lib/auth-client";
import { useSupabaseAuth } from "@/components/AuthProvider";
import { FaGoogle, FaGithub } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const [confettiSize, setConfettiSize] = useState({ width: 300, height: 300 });
  const { signUp, signInWithGoogle, signInWithGitHub } = useAuth();
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
    
    try {
      const { data, error } = await signUp(
        form.email, 
        form.password, 
        form.firstName + " " + form.lastName
      );
      
      setLoading(false);
      
      if (error) {
        toast.error(error.message || "Registration failed");
      } else {
        setCodeSent(true);
        toast.success("Please check your email to verify your account!");
        // Note: With Supabase, user needs to verify email before they can login
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      setLoading(false);
      toast.error("Registration failed");
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    toast.dismiss();
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || "Google sign up failed");
        setGoogleLoading(false);
      }
      // If successful, user will be redirected by Supabase
    } catch (err) {
      setGoogleLoading(false);
      toast.error("Google sign up failed");
    }
  }

  async function handleGitHubSignUp() {
    setGithubLoading(true);
    toast.dismiss();
    
    try {
      const { error } = await signInWithGitHub();
      if (error) {
        toast.error(error.message || "GitHub sign up failed");
        setGithubLoading(false);
      }
      // If successful, user will be redirected by Supabase
    } catch (err) {
      setGithubLoading(false);
      toast.error("GitHub sign up failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <AnimatePresence>
        {codeSent && (
          <Confetti
            width={confettiSize.width}
            height={confettiSize.height}
            recycle={false}
            numberOfPieces={120}
            colors={["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"]}
          />
        )}
      </AnimatePresence>
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-1">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Your first name"
                value={form.firstName}
                onChange={handleChange}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500"
                required
                suppressHydrationWarning
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-1">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Your last name"
                value={form.lastName}
                onChange={handleChange}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500"
                required
                suppressHydrationWarning
              />
            </div>
          </div>
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
              placeholder="Create a password"
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
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
        
        <div className="flex items-center justify-center space-x-4 text-slate-400">
          <div className="flex-1 border-t border-slate-600"></div>
          <span className="px-2 text-sm font-medium">OR</span>
          <div className="flex-1 border-t border-slate-600"></div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            <FaGoogle className="text-lg text-blue-500" />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>
          <button 
            onClick={handleGitHubSignUp}
            disabled={loading || githubLoading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            <FaGithub className="text-lg" />
            {githubLoading ? "Connecting..." : "Continue with GitHub"}
          </button>
        </div>
        
        <div className="text-center text-slate-400 text-sm">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

// Bonsai loader animation (inline SVG, scales from 0 to 1)
function BonsaiLoader() {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="inline-block"
      style={{ willChange: "transform" }}
    >
      <ellipse cx="32" cy="56" rx="16" ry="4" fill="#a7f3d0" />
      <rect x="29" y="32" width="6" height="18" rx="3" fill="#4ade80" />
      <circle cx="32" cy="28" r="10" fill="#22c55e" />
      <ellipse cx="32" cy="22" rx="6" ry="3" fill="#16a34a" />
      <ellipse cx="38" cy="30" rx="4" ry="2" fill="#16a34a" />
      <ellipse cx="26" cy="30" rx="4" ry="2" fill="#16a34a" />
    </motion.svg>
  );
} 