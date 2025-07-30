"use client";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function FocusPage() {
  const [duration, setDuration] = useState(25); // in minutes
  const [seconds, setSeconds] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [growthStage, setGrowthStage] = useState(0); // 0: seedling, 1: sapling, 2: young tree, 3: mature, -1: withered
  const [forest, setForest] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionData, setReflectionData] = useState<{ focused: boolean | null; distractions: string }>({ focused: null, distractions: "" });
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState("");
  const [emergencyResponse, setEmergencyResponse] = useState<string | null>(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Update seconds when duration changes (only if not running)
  useEffect(() => {
    if (!isRunning) setSeconds(duration * 60);
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
    const percent = 1 - seconds / (duration * 60);
    if (percent >= 0.75) setGrowthStage(3);
    else if (percent >= 0.5) setGrowthStage(2);
    else if (percent >= 0.25) setGrowthStage(1);
    else setGrowthStage(0);
  }, [seconds, duration, isRunning]);

  // Completion logic
  useEffect(() => {
    if (seconds === 0 && isRunning) {
      setIsRunning(false);
      setGrowthStage(3);
      setForest(f => f + 1);
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
        setGrowthStage(-1);
        toast.error("Bonsai withered!");
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isRunning]);

  function startTimer() {
    if (seconds === 0) return;
    setIsRunning(true);
    setStartTime(new Date());
    setGrowthStage(0);
    toast("Bonsai growing!", { icon: "🌱", style: { background: "#dcfce7", color: "#166534" } });
  }
  function pauseTimer() {
    setIsRunning(false);
    setGrowthStage(-1);
    toast.error("Bonsai withered!");
  }
  function resetTimer(keepForest = false) {
    setIsRunning(false);
    setSeconds(duration * 60);
    setGrowthStage(0);
    setStartTime(null);
    if (!keepForest) setForest(0);
  }
  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }
  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    if (isRunning) return;
    setDuration(Number(e.target.value));
  }
  function handleCustom(e: React.ChangeEvent<HTMLInputElement>) {
    if (isRunning) return;
    const val = Math.max(1, Math.min(60, Number(e.target.value)));
    setDuration(val);
  }

  async function saveFocusSession() {
    if (!startTime) return;
    
    try {
      const sessionDuration = duration * 60; // Convert minutes to seconds
      const res = await fetch("/api/focus-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          duration: sessionDuration,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        console.log("Focus session saved successfully");
      } else {
        console.error("Failed to save focus session:", data.error);
      }
    } catch (e) {
      console.error("Error saving focus session:", e);
    }
  }

  async function handleEmergencySupport() {
    setEmergencyLoading(true);
    setEmergencyResponse(null);
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: emergencyInput }),
      });
      const data = await res.json();
      if (data.aiResponse) {
        setEmergencyResponse(data.aiResponse);
      } else {
        toast.error(data.error || "Failed to get AI support");
      }
    } catch (e) {
      console.error("Emergency AI error:", e);
      toast.error("Failed to get AI support");
    }
    setEmergencyLoading(false);
  }

  return (
    <div className={inter.className + " flex flex-col items-center justify-center min-h-[60vh] p-4 w-full"} style={{ background: '#fff' }}>
      <Toaster position="top-center" />
      <div className="w-full max-w-md mx-auto rounded-2xl bg-white/70 backdrop-blur-md shadow-2xl p-8 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-green-800 mb-6 text-center">Focus Session</h1>
        <div className="flex flex-col items-center w-full mb-4">
          <motion.div
            initial={{ scale: 0.8, rotateY: 0, rotateX: 0 }}
            animate={{ scale: growthStage === -1 ? 0.9 : 1 + 0.1 * (growthStage + 1), boxShadow: growthStage > 0 ? "0 8px 32px 0 #22c55e55" : "0 2px 8px 0 #a7f3d0" }}
            whileHover={{ rotateY: 8, rotateX: -4, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            style={{ perspective: 800 }}
            className="mb-4"
          >
            <BonsaiSVG growthStage={growthStage} />
          </motion.div>
          <div className="mb-4 w-full flex flex-col items-center">
            <label className="mb-2 font-semibold text-green-900">Timer: {duration} min</label>
            <input
              type="range"
              min={1}
              max={60}
              value={duration}
              onChange={handleSlider}
              className="w-full mb-2 accent-green-600"
              disabled={isRunning}
            />
            <input
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={handleCustom}
              className="w-24 px-2 py-1 rounded-lg border border-green-300 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 text-base shadow-sm mb-2"
              disabled={isRunning}
            />
          </div>
          <span className="text-5xl font-mono text-green-900 mb-2">{formatTime(seconds)}</span>
          <div className="flex gap-2 mb-2">
            <motion.button
              onClick={startTimer}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 cursor-pointer"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #bbf7d0" }}
              whileTap={{ scale: 0.97 }}
              disabled={isRunning}
            >
              Start
            </motion.button>
            <motion.button
              onClick={pauseTimer}
              className="bg-yellow-500 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 cursor-pointer"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #fcd34d" }}
              whileTap={{ scale: 0.97 }}
              disabled={!isRunning}
            >
              Pause
            </motion.button>
            <motion.button
              onClick={() => resetTimer(false)}
              className="bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 cursor-pointer"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #d1d5db" }}
              whileTap={{ scale: 0.97 }}
            >
              Reset
            </motion.button>
            {isRunning && (
              <motion.button
                onClick={() => setShowEmergency(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 cursor-pointer"
                whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #fca5a5" }}
                whileTap={{ scale: 0.97 }}
              >
                Emergency
              </motion.button>
            )}
          </div>
        </div>
        <div className="text-green-700 font-semibold mt-2">Bonsais Grown: {forest}</div>
      </div>
      <AnimatePresence>
        {showReflection && (
          <ReflectionModal
            open={showReflection}
            onClose={() => setShowReflection(false)}
            duration={duration * 60}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          >
            <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-8 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-red-700 mb-4 text-center">Emergency Mode</h2>
              <div className="mb-4 w-full">
                <label className="block font-semibold text-red-900 mb-2">What’s wrong?</label>
                <input
                  type="text"
                  value={emergencyInput}
                  onChange={e => setEmergencyInput(e.target.value)}
                  className="w-full rounded-lg border border-red-300 bg-white/80 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 text-base shadow-sm"
                  placeholder="Describe your issue..."
                  disabled={emergencyLoading}
                />
              </div>
              <div className="mb-6 w-full min-h-[48px]">
                {emergencyResponse && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-900 shadow text-sm">
                    <strong>AI Support:</strong> {emergencyResponse}
                  </div>
                )}
              </div>
              <div className="flex gap-4 w-full">
                <motion.button
                  onClick={handleEmergencySupport}
                  className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 cursor-pointer"
                  whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #fca5a5" }}
                  whileTap={{ scale: 0.97 }}
                  disabled={emergencyLoading || !emergencyInput.trim()}
                >
                  {emergencyLoading ? "Getting Support..." : "Get AI Support"}
                </motion.button>
                <motion.button
                  onClick={() => { setShowEmergency(false); setEmergencyInput(""); setEmergencyResponse(null); }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 cursor-pointer"
                  whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #d1d5db" }}
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

function BonsaiSVG({ growthStage }: { growthStage: number }) {
  // -1: withered, 0: seedling, 1: sapling, 2: young tree, 3: mature
  if (growthStage === -1) {
    // Withered: gray, drooped
    return (
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="90" cy="160" rx="40" ry="12" fill="#a3a3a3" />
        <rect x="50" y="140" width="80" height="20" rx="10" fill="#e5e7eb" />
        <rect x="82" y="100" width="16" height="40" rx="8" fill="#9ca3af" />
        <path d="M90 120 Q70 130 90 100" stroke="#9ca3af" strokeWidth="8" fill="none" />
        <ellipse cx="90" cy="110" rx="18" ry="10" fill="#d1d5db" />
      </svg>
    );
  }
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <ellipse cx="90" cy="160" rx="40" ry="12" fill="#a3a3a3" />
      <rect x="50" y="140" width="80" height="20" rx="10" fill="#d1fae5" />
      {/* Trunk */}
      <rect x="88" y="110" width="8" height="30" rx="4" fill="#7c3f00" />
      {/* Growth stages */}
      {/* Seedling: small */}
      {growthStage >= 0 && <ellipse cx="92" cy="110" rx="8" ry="4" fill="#22c55e" />}
      {/* Sapling: add branch */}
      {growthStage >= 1 && <rect x="90" y="90" width="6" height="20" rx="3" fill="#7c3f00" />}
      {growthStage >= 1 && <ellipse cx="93" cy="90" rx="12" ry="6" fill="#16a34a" />}
      {/* Young tree: more leaves */}
      {growthStage >= 2 && <ellipse cx="105" cy="80" rx="10" ry="5" fill="#22c55e" />}
      {growthStage >= 2 && <ellipse cx="80" cy="80" rx="10" ry="5" fill="#22c55e" />}
      {/* Mature tree: flowers */}
      {growthStage >= 3 && <circle cx="100" cy="80" r="3" fill="#fbbf24" />}
      {growthStage >= 3 && <circle cx="85" cy="80" r="3" fill="#fbbf24" />}
    </svg>
  );
}

function ReflectionModal({ open, onClose, duration, onSaved }: { open: boolean; onClose: () => void; duration: number; onSaved: () => void }) {
  const [focused, setFocused] = useState<boolean | null>(null);
  const [distractions, setDistractions] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveReflection() {
    setLoading(true);
    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stayedFocused: focused, distractions, duration }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reflection saved!", { icon: "🍃", style: { background: "#dcfce7", color: "#166534" } });
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
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    >
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">Session Reflection</h2>
        <div className="mb-4 w-full">
          <label className="block font-semibold text-green-900 mb-2">Did you stay focused?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="focused" checked={focused === true} onChange={() => setFocused(true)} />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="focused" checked={focused === false} onChange={() => setFocused(false)} />
              No
            </label>
          </div>
        </div>
        <div className="mb-6 w-full">
          <label className="block font-semibold text-green-900 mb-2">What distracted you? <span className="text-gray-500 font-normal">(optional)</span></label>
          <input
            type="text"
            value={distractions}
            onChange={e => setDistractions(e.target.value)}
            className="w-full rounded-lg border border-green-300 bg-white/80 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 text-base shadow-sm"
            placeholder="e.g. phone, noise, thoughts..."
            disabled={loading}
          />
        </div>
        <div className="flex gap-4 w-full">
          <motion.button
            onClick={saveReflection}
            className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 cursor-pointer"
            whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #bbf7d0" }}
            whileTap={{ scale: 0.97 }}
            disabled={loading || focused === null}
          >
            {loading ? "Saving..." : "Save Reflection"}
          </motion.button>
          <motion.button
            onClick={onClose}
            className="bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300 cursor-pointer"
            whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #d1d5db" }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 