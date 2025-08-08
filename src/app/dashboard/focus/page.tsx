"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import Confetti from "react-confetti";
import Link from "next/link";
import { useSupabaseAuth } from "@/components/AuthProvider";
import BonsaiCanvas from "@/components/BonsaiCanvas";
import FocusControls from "@/components/FocusControls";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function FocusPage() {
  const { user, loading } = useSupabaseAuth();
  const { isPlaying, toggleAudio } = useAmbientAudio();
  
  // State-driven UI architecture
  const [sessionState, setSessionState] = useState<'setup' | 'running'>('setup');
  const [duration, setDuration] = useState(1500); // 25 minutes default
  const [seconds, setSeconds] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [growthStage, setGrowthStage] = useState<'Seedling' | 'Sprout' | 'Mature' | 'Flowering' | 'Withered'>('Seedling');
  const [forest, setForest] = useState(0);
  const [customDurationInput, setCustomDurationInput] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState("");
  const [emergencyResponse, setEmergencyResponse] = useState<string | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Load forest count from localStorage on mount
  useEffect(() => {
    const savedForest = localStorage.getItem('bonsaiForest');
    console.log('🌳 Loading from localStorage:', savedForest);
    if (savedForest) {
      const count = parseInt(savedForest, 10);
      console.log('🌳 Loaded forest count from localStorage:', count);
      setForest(count);
    } else {
      console.log('🌳 No saved forest count found, starting at 0');
    }
  }, []);

  // Save forest count to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving forest count to localStorage:', forest);
    localStorage.setItem('bonsaiForest', forest.toString());
  }, [forest]);

  // Update seconds when duration changes (only if not running)
  useEffect(() => {
    if (!isRunning) setSeconds(duration);
  }, [duration]);

  // Timer logic
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  // Growth stage logic
  useEffect(() => {
    if (!isRunning || seconds === 0) return;
    const percent = 1 - seconds / duration;
    let newStage: 'Seedling' | 'Sprout' | 'Mature' | 'Flowering' | 'Withered' = 'Seedling';
    
    if (percent >= 0.75) newStage = 'Flowering';
    else if (percent >= 0.5) newStage = 'Mature';
    else if (percent >= 0.25) newStage = 'Sprout';
    else newStage = 'Seedling';
    
    console.log(`Progress: ${(percent * 100).toFixed(1)}%, Stage: ${newStage}, Seconds left: ${seconds}`);
    setGrowthStage(newStage);
  }, [seconds, duration, isRunning]);

  // Completion logic
  useEffect(() => {
    if (seconds === 0 && isRunning) {
      console.log("🌳 Focus session completed! Growing bonsai...");
      setIsRunning(false);
      setSessionState('setup'); // Return to setup after completion
      setGrowthStage('Flowering');
      setForest(f => {
        const newCount = f + 1;
        console.log(`🌳 Forest count updated: ${f} -> ${newCount}`);
        return newCount;
      });
      toast.success("Bonsai matured!");
      setShowReflection(true);
      
      // Save focus session to backend
      if (startTime) {
        saveFocusSession();
      }
      
      resetTimer(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isRunning]);

  // Wither on leave/interruption
  useEffect(() => {
    function handleUnload() {
      if (isRunning) {
        setGrowthStage('Withered');
        toast.error("Bonsai withered!");
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isRunning]);

  function startTimer() {
    if (seconds === 0 || !user?.email) {
      if (!user?.email) {
        toast.error("Please log in to start focus session");
      }
      return;
    }
    setIsRunning(true);
    setSessionState('running'); // Transition to running state
    setStartTime(new Date());
    setGrowthStage('Seedling');
    toast("Bonsai growing!", { icon: "🌱", style: { background: "#dcfce7", color: "#166534" } });
  }
  
  function pauseTimer() {
    setIsRunning(false);
    setGrowthStage('Withered');
    toast.error("Bonsai withered!");
  }
  
  function resetTimer(keepForest = false) {
    setIsRunning(false);
    setSessionState('setup'); // Return to setup state
    setSeconds(duration);
    setGrowthStage('Seedling');
    setStartTime(null);
    if (!keepForest) setForest(0);
  }
  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // Time preset handlers
  const timePresets = [
    { label: "5m", minutes: 5 },
    { label: "15m", minutes: 15 },
    { label: "25m", minutes: 25 },
    { label: "45m", minutes: 45 },
  ];

  const handlePresetTime = (minutes: number) => {
    setDuration(minutes * 60);
    setCustomDurationInput(false);
  };

  const handleCustomTimeSubmit = (customMinutes: number) => {
    if (customMinutes > 0 && customMinutes <= 300) { // Max 5 hours
      setDuration(customMinutes * 60);
      setCustomDurationInput(false);
    } else {
      toast.error("Please enter a valid duration (1-300 minutes)");
    }
  };

  async function saveFocusSession() {
    if (!startTime || !user?.email) return;
    
    try {
      const sessionDuration = duration;
      const res = await fetch("/api/focus-session-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          duration: sessionDuration,
          userEmail: user.email,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        console.log("Focus session saved successfully");
        toast.success("Focus session saved! 🎯");
      } else {
        console.error("Failed to save focus session:", data.error);
        toast.error("Failed to save session");
      }
    } catch (e) {
      console.error("Error saving focus session:", e);
      toast.error("Failed to save session");
    }
  }

  async function handleEmergencySupport() {
    if (!user?.email) {
      toast.error("Please log in to use emergency support");
      return;
    }
    
    setEmergencyLoading(true);
    setEmergencyResponse(null);
    try {
      const res = await fetch("/api/emergency-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          issue: emergencyInput, 
          userEmail: user.email 
        }),
      });
      const data = await res.json();
      if (data.aiResponse) {
        setEmergencyResponse(data.aiResponse);
        toast.success("AI support received! 💚");
      } else {
        toast.error(data.error || "Failed to get AI support");
      }
    } catch (e) {
      console.error("Emergency AI error:", e);
      toast.error("Failed to get AI support");
    }
    setEmergencyLoading(false);
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading focus session...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Atmospheric background effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-800 to-black opacity-90" />
        {/* Subtle animated background dots */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Audio Control */}
      <motion.button
        onClick={toggleAudio}
        className="fixed top-6 right-6 z-30 bg-black/20 backdrop-blur-md rounded-full p-3 border border-white/10 text-white hover:bg-black/30 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? (
          <HiOutlineSpeakerWave className="text-xl" />
        ) : (
          <HiOutlineSpeakerXMark className="text-xl" />
        )}
      </motion.button>

      {/* Forest Counter */}
      <motion.div
        className="fixed top-6 left-6 z-30 bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/dashboard/forest" className="block hover:scale-105 transition-transform duration-200">
          <div className="text-emerald-400 font-semibold text-lg">🌳 Bonsai Forest: {forest}</div>
          {forest > 0 && (
            <div className="text-white/70 text-sm mt-1">
              {forest} completed session{forest > 1 ? 's' : ''} • Click to explore
            </div>
          )}
          {forest === 0 && (
            <div className="text-white/50 text-xs mt-1">
              Complete sessions to grow your forest
            </div>
          )}
        </Link>
      </motion.div>

      {/* Main Layout */}
      <div className="flex flex-col items-center justify-center h-full p-8 relative z-10">
        
        {/* Setup State - Simplified Controls */}
        <AnimatePresence>
          {sessionState === 'setup' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center space-y-8"
            >
              {/* Main Time Display */}
              <motion.div
                className="text-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {customDurationInput ? (
                  <CustomTimeInput 
                    onSubmit={handleCustomTimeSubmit}
                    onCancel={() => setCustomDurationInput(false)}
                    initialMinutes={Math.floor(duration / 60)}
                  />
                ) : (
                  <motion.h1
                    onClick={() => setCustomDurationInput(true)}
                    className="text-8xl font-bold text-white cursor-pointer hover:text-emerald-400 transition-colors duration-300"
                    whileHover={{ scale: 1.1 }}
                  >
                    {formatTime(duration)}
                  </motion.h1>
                )}
                <p className="text-white/60 text-xl mt-4">
                  {customDurationInput ? "Enter custom duration" : "Click to customize"}
                </p>
              </motion.div>

              {/* Time Preset Buttons */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {timePresets.map((preset, index) => (
                  <motion.button
                    key={preset.label}
                    onClick={() => handlePresetTime(preset.minutes)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      duration === preset.minutes * 60
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </motion.div>

              {/* Start Focus Button */}
              <motion.button
                onClick={startTimer}
                disabled={!user?.email}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold px-12 py-4 rounded-2xl shadow-lg transition-all duration-200"
                whileHover={user?.email ? { scale: 1.05, boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)" } : {}}
                whileTap={user?.email ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {!user?.email ? "Please log in to start" : "Start Focus Session"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Running State - Immersive Experience */}
        <AnimatePresence>
          {sessionState === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full w-full p-4 overflow-y-auto"
            >
              {/* --- CONTAINER 1: THE TREE (FLEXIBLE) --- 
                This div contains ONLY the tree and its text. 
                The `flex-1` class is the key that makes it grow and shrink.
              */}
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <BonsaiCanvas growthStage={growthStage} /> 
              </div>

              {/* --- CONTAINER 2: THE CONTROLS (RIGID) --- 
                This div contains ONLY the timer and buttons.
                It is a SIBLING to the container above, not its parent or child.
              */}
              <div className="flex-shrink-0 mt-4">
                <FocusControls
                  duration={duration}
                  seconds={seconds}
                  isRunning={isRunning}
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onReset={() => resetTimer(false)}
                  onEmergency={() => setShowEmergency(true)}
                  onDurationChange={setDuration}
                  formatTime={formatTime}
                  disabled={!user?.email}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showReflection && (
          <ReflectionModal
            open={showReflection}
            onClose={() => setShowReflection(false)}
            duration={duration}
            userEmail={user?.email}
            onSaved={() => {
              setReflectionSaved(true);
              setTimeout(() => setReflectionSaved(false), 2000);
            }}
          />
        )}
      </AnimatePresence>
      {reflectionSaved && <Confetti width={typeof window !== "undefined" ? window.innerWidth : 300} height={typeof window !== "undefined" ? window.innerHeight : 300} recycle={false} numberOfPieces={80} colors={["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"]} />}
      <AnimatePresence>
        {showEmergency && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-8 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">AI Assist</h2>
              <div className="mb-4 w-full">
                <label className="block font-semibold text-slate-400 mb-2">How can I help?</label>
                <input
                  type="text"
                  value={emergencyInput}
                  onChange={e => setEmergencyInput(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-slate-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Describe your issue..."
                  disabled={emergencyLoading}
                />
              </div>
              <div className="mb-6 w-full min-h-[48px]">
                {emergencyResponse && (
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-slate-300 shadow text-sm">
                    <strong className="text-emerald-400">AI Suggestion:</strong> {emergencyResponse}
                  </div>
                )}
              </div>
              <div className="flex gap-4 w-full">
                <motion.button
                  onClick={handleEmergencySupport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-300 cursor-pointer"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  disabled={emergencyLoading || !emergencyInput.trim()}
                >
                  {emergencyLoading ? "Getting Help..." : "Get Help"}
                </motion.button>
                <motion.button
                  onClick={() => { setShowEmergency(false); setEmergencyInput(""); setEmergencyResponse(null); }}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-2 rounded-lg font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-300 cursor-pointer"
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(71, 85, 105, 0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  disabled={emergencyLoading}
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reflection Modal Component
function ReflectionModal({ 
  open, 
  onClose, 
  duration, 
  userEmail, 
  onSaved 
}: { 
  open: boolean; 
  onClose: () => void; 
  duration: number; 
  userEmail?: string; 
  onSaved: () => void 
}) {
  const [focused, setFocused] = useState<boolean | null>(null);
  const [distractions, setDistractions] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveReflection() {
    if (!userEmail) {
      toast.error("Please log in to save reflection");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/reflection-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          stayedFocused: focused, 
          distractions, 
          duration,
          userEmail 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reflection saved!", { 
          icon: "🍃", 
          style: { background: "#dcfce7", color: "#166534" } 
        });
        onSaved();
        onClose();
      } else {
        toast.error(data.error || "Failed to save reflection");
      }
    } catch {
      toast.error("Failed to save reflection");
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-md w-full bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 text-white"
      >
        <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">Session Reflection</h2>
        <div className="mb-4 w-full">
          <label className="block font-semibold text-white/90 mb-2">Did you stay focused?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white/80 font-medium cursor-pointer">
              <input 
                type="radio" 
                name="focused" 
                checked={focused === true} 
                onChange={() => setFocused(true)}
                className="accent-emerald-500"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-white/80 font-medium cursor-pointer">
              <input 
                type="radio" 
                name="focused" 
                checked={focused === false} 
                onChange={() => setFocused(false)}
                className="accent-emerald-500"
              />
              No
            </label>
          </div>
        </div>
        <div className="mb-6 w-full">
          <label className="block font-semibold text-white/90 mb-2">
            What distracted you? <span className="text-white/60 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={distractions}
            onChange={e => setDistractions(e.target.value)}
            className="w-full rounded-lg border border-white/30 bg-black/20 backdrop-blur-sm px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200 text-base"
            placeholder="e.g. phone, noise, thoughts..."
            disabled={loading}
          />
        </div>
        <div className="flex gap-4 w-full">
          <motion.button
            onClick={saveReflection}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || focused === null}
          >
            {loading ? "Saving..." : "Save Reflection"}
          </motion.button>
          <motion.button
            onClick={onClose}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Custom Time Input Component
function CustomTimeInput({ 
  onSubmit, 
  onCancel, 
  initialMinutes 
}: { 
  onSubmit: (minutes: number) => void; 
  onCancel: () => void; 
  initialMinutes: number;
}) {
  const [inputValue, setInputValue] = useState(initialMinutes.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(inputValue);
    if (!isNaN(minutes)) {
      onSubmit(minutes);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center space-y-4"
    >
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-6xl font-bold text-center bg-transparent text-white border-b-2 border-emerald-400 focus:outline-none focus:border-emerald-300 w-48"
        placeholder="25"
        min="1"
        max="300"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Set
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}  