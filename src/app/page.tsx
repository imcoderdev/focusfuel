"use client";
import { motion } from "framer-motion";
import { FiPlayCircle } from "react-icons/fi";

export default function LandingPage() {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row items-center justify-center p-6 font-sans text-base tracking-tight text-[#1F2937]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Sidebar Sample */}
      <aside className="max-w-[200px] w-full bg-white shadow-md rounded-lg p-4 mr-0 md:mr-12 mb-8 md:mb-0 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#2DD4BF] flex items-center justify-center text-xl font-bold text-white mb-2">Y</div>
        <span className="font-semibold text-[#1F2937] mb-4">Yash</span>
        <button
          className="w-full bg-[#2DD4BF] hover:bg-[#22c5b3] text-white font-bold py-2 px-4 rounded-lg shadow transition-all duration-150 mb-4"
          aria-label="Add Task"
        >
          + Add Task
        </button>
        <span className="inline-block bg-[#60A5FA] text-white text-xs font-semibold rounded-full px-3 py-1 mb-2">Parent Update</span>
        <nav className="w-full mt-2">
          <ul className="space-y-2">
            <li><a href="#" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#1F2937]">Dashboard</a></li>
            <li><a href="#" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#1F2937]">Focus</a></li>
            <li><a href="#" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#1F2937]">Mood</a></li>
            <li><a href="#" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#1F2937]">Tasks</a></li>
          </ul>
        </nav>
      </aside>
      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-left relative flex flex-col items-center">
        {/* 3D Bonsai SVG with glow and scale on hover */}
        <motion.div
          whileHover={{ scale: 1.1, boxShadow: "0 0 32px 8px #2DD4BF" }}
          className="w-40 h-40 flex items-center justify-center mb-4 transition-all duration-200"
          style={{ filter: 'drop-shadow(0 0 16px #2DD4BF88)' }}
        >
          {/* Simple Bonsai SVG for demo */}
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="100" rx="40" ry="12" fill="#60A5FA" />
            <rect x="54" y="60" width="12" height="40" rx="6" fill="#A7F3D0" />
            <circle cx="60" cy="60" r="28" fill="#2DD4BF" />
            <circle cx="80" cy="50" r="12" fill="#2DD4BF" />
            <circle cx="45" cy="45" r="10" fill="#2DD4BF" />
          </svg>
        </motion.div>
        <h2 className="text-3xl font-semibold leading-tight text-[#1F2937] mb-2">Today's Focus</h2>
        <p className="text-[#1F2937] mb-4">Stay on track with your most important tasks. Log your mood and see your progress grow every day.</p>
        <button
          className="bg-[#2DD4BF] hover:bg-[#22c5b3] text-white font-bold py-2 px-6 rounded-lg shadow transition-all duration-150 text-base mb-3"
          aria-label="Start Focus Session"
        >
          Start Focus Session
        </button>
        <button
          className="flex items-center gap-2 bg-[#60A5FA] hover:bg-[#3B82F6] text-white font-bold py-2 px-6 rounded-lg shadow transition-all duration-150 text-base"
          aria-label="Demo Mode"
        >
          <FiPlayCircle className="text-xl" /> Demo Mode
        </button>
        {/* Urgency/Emergency Example */}
        <div className="absolute top-4 right-4">
          <span className="inline-block bg-[#F87171] text-white text-xs font-semibold rounded-full px-3 py-1">Emergency</span>
        </div>
      </div>
    </motion.div>
  );
}
