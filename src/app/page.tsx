"use client";
import { motion } from "framer-motion";
import { FiPlay, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-white"
        >
          FocusFuel
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link
            href="/login"
            className="px-6 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-700"
          >
            Log In
          </Link>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6"
        >
          Master Your Focus, Win Your Day.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-4 max-w-2xl mx-auto text-center text-lg text-slate-400 mb-8"
        >
          FocusFuel is the intelligent productivity coach that helps you build unbreakable focus, 
          track your mood, and cultivate a digital forest of your achievements.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link
            href="/register"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
          >
            Sign Up for Free
            <FiArrowRight className="inline ml-2" />
          </Link>
          <button
            onClick={() => {
              // For now, we'll scroll to the demo section
              document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full py-4 px-8 font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiPlay className="w-5 h-5" />
            View Demo
          </button>
        </motion.div>

        {/* Visual Showcase */}
        <motion.div
          id="demo-section"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="relative">
            {/* Glass morphism container */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-1 shadow-2xl">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 relative overflow-hidden">
                {/* Demo Preview Content */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">Your Digital Forest Awaits</h3>
                  <p className="text-slate-400">Watch your productivity grow into a beautiful forest of achievements</p>
                </div>
                
                {/* Simulated Forest Preview */}
                <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                  <div className="flex items-end justify-center space-x-8 h-32">
                    {/* Animated Bonsai Trees */}
                    {[1, 2, 3, 4].map((tree, index) => (
                      <motion.div
                        key={tree}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.8, 
                          delay: 1.2 + (index * 0.2),
                          type: "spring",
                          bounce: 0.4 
                        }}
                        className="relative group cursor-pointer"
                      >
                        {/* Tree SVG */}
                        <svg 
                          width={40 + (index * 5)} 
                          height={50 + (index * 8)} 
                          viewBox="0 0 64 64" 
                          className="hover:scale-110 transition-transform duration-200"
                        >
                          <ellipse cx="32" cy="56" rx="18" ry="4" fill="#10b981" opacity="0.3" />
                          <rect x="28" y="36" width="8" height="20" rx="4" fill="#78350f" />
                          <circle cx="32" cy="28" r="14" fill="#10b981" />
                          <circle cx="40" cy="20" r="7" fill="#059669" />
                          <circle cx="24" cy="18" r="6" fill="#34d399" />
                        </svg>
                        
                        {/* Tooltip */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileHover={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg border border-slate-600 whitespace-nowrap pointer-events-none"
                        >
                          Focus Session #{tree}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Floating stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="mt-6 text-center text-slate-400 text-sm"
                  >
                    🌳 4 trees grown • ⏱️ 12.5 hours focused • 🎯 15 tasks completed
                  </motion.div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>
            
            {/* Subtle glow around the container */}
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl -z-10 opacity-50"></div>
          </div>
        </motion.div>
      </main>

      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
            