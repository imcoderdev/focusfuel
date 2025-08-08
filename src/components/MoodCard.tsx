"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineLightBulb, 
  HiOutlineClock,
  HiOutlineArrowLeft,
  HiOutlineSparkles 
} from "react-icons/hi2";
import { 
  FiSmile, 
  FiFrown, 
  FiMeh, 
  FiZap, 
  FiSun, 
  FiCloud 
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useSupabaseAuth } from "@/components/AuthProvider";
import Link from "next/link";

const moods = [
  { key: "happy", label: "Happy", icon: <FiSmile />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
  { key: "stressed", label: "Stressed", icon: <FiZap />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
  { key: "tired", label: "Tired", icon: <FiCloud />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
  { key: "focused", label: "Focused", icon: <FiSun />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
  { key: "meh", label: "Meh", icon: <FiMeh />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
  { key: "sad", label: "Sad", icon: <FiFrown />, color: "bg-slate-700 border-slate-600 hover:border-emerald-500 text-slate-300" },
];

export default function MoodCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [loadingMood, setLoadingMood] = useState<string>("");
  const { user } = useSupabaseAuth();

  const handleMoodSelect = async (mood: string) => {
    if (!user?.email) {
      toast.error("Please log in to save your mood");
      return;
    }

    setSelectedMood(mood);
    setLoadingMood(mood);
    setIsLoading(true);

    // Add a slight delay to show the selection animation
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const response = await fetch("/api/mood/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mood,
          userEmail: user.email 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiResponse(data.coachingMessage);
        // Add a delay after receiving the response to show completion
        setTimeout(() => {
          setIsFlipped(true);
        }, 400);
        toast.success("Daily check-in complete! 🌱", { 
          style: { background: "#065f46", color: "#d1fae5", border: "1px solid #10b981" } 
        });
      } else {
        toast.error(data.error || "Failed to get coaching");
      }
    } catch (error) {
      console.error("Error getting mood coaching:", error);
      toast.error("Failed to get coaching");
    } finally {
      setIsLoading(false);
      setLoadingMood("");
    }
  };

  const handleGoBack = () => {
    // Add a slight delay before flipping back to allow user to see the button press
    setTimeout(() => {
      setIsFlipped(false);
    }, 200);
    
    // Reset state after the flip animation completes
    setTimeout(() => {
      setAiResponse("");
      setSelectedMood("");
      setLoadingMood("");
    }, 1000); // Wait for flip animation to complete (800ms + buffer)
  };

  return (
    <div style={{ perspective: "1000px" }} className="w-full max-w-md">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: isFlipped ? 0.8 : 1.0, // Slightly slower when going back
          ease: isFlipped ? [0.23, 1, 0.32, 1] : [0.25, 0.46, 0.45, 0.94] // Different easing for each direction
        }}
        style={{ 
          transformStyle: "preserve-3d",
          width: "100%",
          height: "500px",
          position: "relative"
        }}
      >
        {/* Front Side - Mood Selection */}
        <motion.div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center"
          animate={isLoading ? {
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              "0 25px 50px -12px rgba(16, 185, 129, 0.3)",
              "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            ]
          } : {}}
          transition={{ 
            duration: 2,
            repeat: isLoading ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              animate={isLoading ? { 
                rotate: 360,
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <HiOutlineSparkles className={`text-2xl transition-colors duration-300 ${
                isLoading ? 'text-emerald-400' : 'text-emerald-500'
              }`} />
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold text-white"
              animate={isLoading ? {
                color: ["#ffffff", "#10b981", "#ffffff"]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isLoading ? "Processing your mood..." : "How are you feeling?"}
            </motion.h2>
          </div>
          
          <p className="text-slate-400 text-center mb-8 max-w-sm leading-relaxed">
            Select your current mood and get personalized coaching to help you make the most of this moment.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            {moods.map((mood, index) => {
              const isSelected = selectedMood === mood.key;
              const isLoadingThis = loadingMood === mood.key;
              const isOtherLoading = isLoading && !isLoadingThis;
              
              return (
                <motion.button
                  key={mood.key}
                  onClick={() => handleMoodSelect(mood.key)}
                  disabled={isLoading}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-300 
                    flex flex-col items-center gap-2 font-medium text-sm relative overflow-hidden
                    ${mood.color}
                    ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg' : ''}
                    ${isOtherLoading ? 'opacity-30 scale-95' : ''}
                    ${isLoading ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
                  `}
                  whileHover={!isLoading ? { 
                    scale: 1.05, 
                    y: -4,
                    boxShadow: "0 8px 25px rgba(0,0,0,0.3)"
                  } : {}}
                  whileTap={!isLoading ? { scale: 0.95 } : {}}
                  animate={{ 
                    scale: isSelected ? 1.1 : (isOtherLoading ? 0.95 : 1),
                    opacity: isOtherLoading ? 0.3 : 1,
                    rotateY: isSelected ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ 
                    duration: isSelected ? 0.6 : 0.3,
                    rotateY: { duration: 0.6, ease: "easeInOut" }
                  }}
                >
                  {isLoadingThis && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-slate-700/30 flex items-center justify-center backdrop-blur-sm rounded-lg"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div 
                        className="w-6 h-6 border-3 border-emerald-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  )}
                  
                  <motion.span 
                    className="text-2xl"
                    animate={isSelected ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    {mood.icon}
                  </motion.span>
                  
                  <motion.span
                    animate={isSelected ? {
                      fontWeight: [400, 600, 400],
                      color: ["", "#059669", ""]
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    {mood.label}
                  </motion.span>

                  {/* Ripple effect on selection */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-emerald-400"
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Back Side - AI Response */}
        <motion.div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: "rotateY(180deg)"
          }}
          className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center"
        >
          <motion.div 
            className="flex items-center gap-3 mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isFlipped ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ 
              delay: isFlipped ? 0.5 : 0,
              duration: isFlipped ? 0.3 : 0.2
            }}
          >
            <HiOutlineLightBulb className="text-3xl text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Your AI Coach Says:</h3>
          </motion.div>

          <motion.div 
            className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-sm border border-slate-600"
            initial={{ y: 20, opacity: 0 }}
            animate={isFlipped ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ 
              delay: isFlipped ? 0.6 : 0,
              duration: isFlipped ? 0.3 : 0.2
            }}
          >
            <p className="text-slate-300 leading-relaxed text-center">
              {aiResponse}
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-col gap-3 w-full"
            initial={{ y: 20, opacity: 0 }}
            animate={isFlipped ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ 
              delay: isFlipped ? 0.7 : 0,
              duration: isFlipped ? 0.3 : 0.2
            }}
          >
            <Link 
              href="/dashboard/focus"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              <HiOutlineClock className="text-lg" />
              Start Focus Session
            </Link>

            <button
              onClick={handleGoBack}
              className="text-slate-400 hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <HiOutlineArrowLeft className="text-lg" />
              Go Back
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
