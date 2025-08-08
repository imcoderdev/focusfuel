"use client";

import { motion } from "framer-motion";
import { 
  HiOutlinePlay, 
  HiOutlinePause, 
  HiOutlineStop,
  HiOutlineExclamationTriangle
} from "react-icons/hi2";

interface FocusControlsProps {
  duration: number;
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEmergency: () => void;
  onDurationChange: (duration: number) => void;
  formatTime: (seconds: number) => string;
  disabled?: boolean;
}

export default function FocusControls({
  duration,
  seconds,
  isRunning,
  onStart,
  onPause,
  onReset,
  onEmergency,
  onDurationChange,
  formatTime,
  disabled = false
}: FocusControlsProps) {
  
  const progress = ((duration - seconds) / duration) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isRunning) {
      onDurationChange(Number(e.target.value));
    }
  };

  const handleCustomDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isRunning) {
      const value = Math.max(10, Math.min(3600, Number(e.target.value))); // 10 seconds to 1 hour
      onDurationChange(value);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="z-20"
    >
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center space-y-6 min-w-[400px]">
          
          {/* Timer Display */}
          <div className="text-center">
            <motion.div
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono font-bold text-white mb-2"
              animate={{
                scale: isRunning ? [1, 1.02, 1] : 1,
                textShadow: isRunning 
                  ? ["0 0 10px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.8)", "0 0 10px rgba(255,255,255,0.5)"]
                  : "0 0 10px rgba(255,255,255,0.3)"
              }}
              transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
            >
              {formatTime(seconds)}
            </motion.div>
            
            {/* Progress Bar */}
            <div className="w-48 sm:w-56 md:w-64 lg:w-80 xl:w-96 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full shadow-lg"
                style={{ width: `${progress}%` }}
                animate={{
                  boxShadow: isRunning 
                    ? ["0 0 10px rgba(16, 185, 129, 0.5)", "0 0 20px rgba(16, 185, 129, 0.8)", "0 0 10px rgba(16, 185, 129, 0.5)"]
                    : "0 0 5px rgba(16, 185, 129, 0.3)"
                }}
                transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
              />
            </div>
            
            <div className="text-white/70 text-xs sm:text-sm mt-2">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Duration Controls */}
          {!isRunning && (
            <motion.div 
              className="flex flex-col items-center space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="text-white/80 font-medium">
                Focus Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </label>
              
              {/* Preset buttons */}
              <div className="flex space-x-2">
                {[
                  { label: "5m", value: 300 },
                  { label: "15m", value: 900 },
                  { label: "25m", value: 1500 },
                  { label: "45m", value: 2700 }
                ].map((preset) => (
                  <motion.button
                    key={preset.label}
                    onClick={() => onDurationChange(preset.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      duration === preset.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>

              {/* Custom duration input */}
              <div className="flex items-center space-x-2">
                <label className="text-white/70 text-sm">Custom (minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={Math.round(duration / 60)}
                  onChange={(e) => onDurationChange(Number(e.target.value) * 60)}
                  className="w-16 px-2 py-1 rounded-lg bg-white/20 border border-white/30 text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isRunning ? (
              <motion.button
                onClick={onStart}
                disabled={disabled}
                className="flex items-center space-x-1 sm:space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
                whileHover={!disabled ? { scale: 1.05, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)" } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
              >
                <HiOutlinePlay className="text-lg sm:text-xl" />
                <span>Start Focus</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={onPause}
                className="flex items-center space-x-1 sm:space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(245, 158, 11, 0.4)" }}
                whileTap={{ scale: 0.95 }}
              >
                <HiOutlinePause className="text-lg sm:text-xl" />
                <span>Pause</span>
              </motion.button>
            )}

            <motion.button
              onClick={onReset}
              className="flex items-center space-x-1 sm:space-x-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(71, 85, 105, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              <HiOutlineStop className="text-lg sm:text-xl" />
              <span>Reset</span>
            </motion.button>

            {isRunning && (
              <motion.button
                onClick={onEmergency}
                className="flex items-center space-x-1 sm:space-x-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all duration-200 text-sm sm:text-base"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(71, 85, 105, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <HiOutlineExclamationTriangle className="text-lg sm:text-xl" />
                <span>AI Assist</span>
              </motion.button>
            )}
          </div>

          {/* Session Stats */}
          <motion.div
            className="text-center text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Focus deeply and watch your bonsai grow 🌱
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
