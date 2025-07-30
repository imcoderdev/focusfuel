"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { FiSmile, FiFrown, FiMeh, FiZap, FiSun, FiCloud, FiPlayCircle, FiX } from "react-icons/fi";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

const moods = [
  { key: "happy", label: "Happy", icon: <FiSmile />, color: "bg-green-200 text-green-800" },
  { key: "stressed", label: "Stressed", icon: <FiZap />, color: "bg-yellow-200 text-yellow-800" },
  { key: "tired", label: "Tired", icon: <FiCloud />, color: "bg-blue-200 text-blue-800" },
  { key: "focused", label: "Focused", icon: <FiSun />, color: "bg-emerald-200 text-emerald-800" },
  { key: "meh", label: "Meh", icon: <FiMeh />, color: "bg-gray-200 text-gray-800" },
  { key: "sad", label: "Sad", icon: <FiFrown />, color: "bg-red-200 text-red-800" },
];

const moodMessages = {
  happy: "Great to see you happy! Let's channel that energy! 🌞",
  stressed: "It's okay to feel stressed. Let's break things down together. 🌱",
  tired: "Rest is important. Let's take it one step at a time. 😴",
  focused: "You're in the zone! Let's make the most of it. 🎯",
  meh: "Not every day is exciting, but progress is progress. 🌿",
  sad: "It's okay to feel down. We're here for you. 💚",
};

export default function MoodPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [showMsg, setShowMsg] = useState(false);
  const [loadingMood, setLoadingMood] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  async function handleSelect(mood: string) {
    setSelected(mood);
    setShowMsg(false);
    setLoadingMood(mood);
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });
      const data = await res.json();
      setLoadingMood(null);
      if (data.success) {
        setTimeout(() => {
          setShowMsg(true);
          setPopupOpen(true);
        }, 200);
        toast.success("Mood saved! 🌱", { style: { background: "#dcfce7", color: "#166534" } });
      } else {
        toast.error(data.error || "Failed to save mood", { style: { background: "#fee2e2", color: "#991b1b" } });
      }
    } catch {
      setLoadingMood(null);
      toast.error("Failed to save mood", { style: { background: "#fee2e2", color: "#991b1b" } });
    }
  }

  // Auto-dismiss popup after 3s
  useEffect(() => {
    if (popupOpen) {
      const timer = setTimeout(() => setPopupOpen(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [popupOpen]);

  // For demo: static mood impact bar
  const moodImpact = selected ? 80 : 0; // percent

  return (
    <div className={inter.className + " min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] text-base tracking-tight overflow-hidden"}>
      <Toaster position="top-center" />
      {/* Glowing Headline */}
      <motion.h2
        initial={{ opacity: 0, textShadow: "0 0 0px #14b8a6" }}
        animate={{ opacity: 1, textShadow: "0 0 16px #14b8a6, 0 0 32px #14b8a6" }}
        transition={{ duration: 1 }}
        className="text-4xl font-extrabold text-teal-800 mb-6 text-center"
        style={{ letterSpacing: '-0.01em' }}
      >
        Calibrate Mood Now
      </motion.h2>
      {/* Optional Bonsai visual */}
      <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
        {/* You can replace this with a real SVG or image if desired */}
      </div>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-xl w-full flex flex-col justify-center items-center">
        {/* Badge and Demo Mode */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="inline-block bg-[#60A5FA] text-white text-xs font-semibold rounded-full px-3 py-1">Wellbeing</span>
          <button
            className="flex items-center gap-2 bg-[#2DD4BF] hover:bg-[#14b8a6] text-white font-bold py-1.5 px-4 rounded-lg shadow transition-all duration-150 text-base"
            aria-label="Demo Mode"
          >
            <FiPlayCircle className="text-lg" /> Demo Mode
          </button>
        </div>
        <h1 className="text-3xl font-extrabold text-teal-800 mb-2 text-center">Mood Calibration</h1>
        <p className="text-gray-600 text-base mb-8 text-center">How are you feeling right now? Select your mood to get personalized encouragement and smarter task planning.</p>
        {/* Mood Buttons: Responsive Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl mb-10">
          {moods.map((mood) => {
            const isActive = selected === mood.key;
            return (
              <motion.button
                key={mood.key}
                onClick={() => handleSelect(mood.key)}
                className={`w-24 h-24 p-4 flex flex-col items-center justify-center rounded-full font-medium shadow-md border-2 border-transparent focus:outline-none transition-all duration-200 cursor-pointer text-sm text-center break-words max-w-full ${mood.color} ${isActive ? "ring-4 ring-teal-400" : ""} ${loadingMood === mood.key ? "opacity-60 pointer-events-none" : ""}`}
                whileHover={{ scale: 1.1, boxShadow: "0 4px 24px 0 #2DD4BF55" }}
                whileTap={isActive ? { scale: 1.2 } : { scale: 0.97 }}
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                aria-pressed={isActive}
                aria-label={`Select ${mood.label} Mood`}
                disabled={!!loadingMood}
              >
                <span className="text-3xl md:text-4xl mb-1">{mood.icon}</span>
                <span className="text-sm font-medium text-center break-words max-w-full" style={{ color: '#1F2937' }}>{mood.label}</span>
                {loadingMood === mood.key && <span className="mt-1 text-xs text-green-900 animate-pulse">Saving...</span>}
              </motion.button>
            );
          })}
        </div>
        {/* Animated Message Popup */}
        <AnimatePresence>
          {selected && showMsg && popupOpen && (
            <motion.div
              key={selected}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 p-6 rounded-xl shadow-lg max-w-md z-10"
              aria-live="polite"
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setPopupOpen(false)}
                aria-label="Close popup"
              >
                <FiX />
              </button>
              <div className="text-base italic text-[#1F2937] text-center font-semibold">
                {moodMessages[selected as keyof typeof moodMessages]}
              </div>
              {/* Mood Impact Mini-Chart below message */}
              <div className="w-full mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1F2937]">Mood Impact</span>
                  <span className="text-xs font-semibold text-[#2DD4BF]">+{moodImpact}% Focus</span>
                </div>
                <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-[#2DD4BF] rounded-full transition-all duration-500"
                    style={{ width: `${moodImpact}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 