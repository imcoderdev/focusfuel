"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BonsaiCanvasProps {
  growthStage: 'Seedling' | 'Sprout' | 'Mature' | 'Flowering' | 'Withered';
}

export default function BonsaiCanvas({ growthStage }: BonsaiCanvasProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animation variants for different stages
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 1.2,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.3
      }
    }
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        pathLength: { duration: 2, ease: [0.4, 0.0, 0.2, 1] },
        opacity: { duration: 0.5 }
      }
    }
  };

  const leafVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 1,
        ease: [0.4, 0.0, 0.2, 1],
        delay: 0.5
      }
    }
  };

  const flowerVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { 
        duration: 1.5,
        ease: [0.4, 0.0, 0.2, 1],
        delay: 1
      }
    }
  };

  // Determine which elements to show based on growth stage
  const showTrunk = growthStage !== 'Withered';
  const showBranches = ['Sprout', 'Mature', 'Flowering'].includes(growthStage);
  const showLeaves = ['Mature', 'Flowering'].includes(growthStage);
  const showFlowers = growthStage === 'Flowering';
  const isWithered = growthStage === 'Withered';

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-lg">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full blur-3xl opacity-20 ${
            isWithered 
              ? 'bg-red-500' 
              : growthStage === 'Flowering' 
                ? 'bg-pink-500' 
                : 'bg-emerald-500'
          }`}
          animate={isWithered ? {} : {
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Bonsai SVG */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="relative z-10"
      >
        <svg 
          viewBox="0 0 400 400" 
          className="drop-shadow-xl w-full h-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Pot */}
          <motion.ellipse 
            cx="200" 
            cy="350" 
            rx="80" 
            ry="20" 
            fill="url(#potGradient)"
            variants={pathVariants}
          />
          <motion.rect 
            x="120" 
            y="320" 
            width="160" 
            height="30" 
            rx="15" 
            fill="url(#potBodyGradient)"
            variants={pathVariants}
          />

          {/* Soil */}
          <motion.ellipse 
            cx="200" 
            cy="325" 
            rx="70" 
            ry="15" 
            fill="#8B4513"
            opacity="0.8"
            variants={pathVariants}
          />

          {/* Main Trunk */}
          {showTrunk && (
            <motion.path
              d="M200 320 Q195 280 200 240 Q205 200 195 160"
              stroke={isWithered ? "#8B7355" : "#4A5D23"}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              variants={pathVariants}
              style={{
                filter: isWithered ? "grayscale(1)" : "none"
              }}
            />
          )}

          {/* Secondary trunk curve */}
          {showTrunk && (
            <motion.path
              d="M195 160 Q190 140 200 120"
              stroke={isWithered ? "#8B7355" : "#4A5D23"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              variants={pathVariants}
              style={{
                filter: isWithered ? "grayscale(1)" : "none"
              }}
            />
          )}

          {/* Primary Branch - Left */}
          {showBranches && (
            <motion.path
              d="M195 180 Q150 170 120 160 Q100 155 90 150"
              stroke={isWithered ? "#8B7355" : "#4A5D23"}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              variants={pathVariants}
              style={{
                filter: isWithered ? "grayscale(1)" : "none"
              }}
            />
          )}

          {/* Primary Branch - Right */}
          {showBranches && (
            <motion.path
              d="M205 160 Q250 150 280 140 Q300 135 310 130"
              stroke={isWithered ? "#8B7355" : "#4A5D23"}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              variants={pathVariants}
              style={{
                filter: isWithered ? "grayscale(1)" : "none"
              }}
            />
          )}

          {/* Secondary Branches */}
          {showBranches && (
            <>
              <motion.path
                d="M200 200 Q170 190 150 185"
                stroke={isWithered ? "#8B7355" : "#4A5D23"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                variants={pathVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.path
                d="M200 140 Q230 135 250 130"
                stroke={isWithered ? "#8B7355" : "#4A5D23"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                variants={pathVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
            </>
          )}

          {/* Leaves - Left Side */}
          {showLeaves && (
            <>
              <motion.path
                d="M90 150 Q80 140 85 130 Q90 135 95 140 Q90 145 90 150"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.path
                d="M110 155 Q100 145 105 135 Q110 140 115 145 Q110 150 110 155"
                fill={isWithered ? "#8B7355" : "#16A34A"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.path
                d="M130 160 Q120 150 125 140 Q130 145 135 150 Q130 155 130 160"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
            </>
          )}

          {/* Leaves - Right Side */}
          {showLeaves && (
            <>
              <motion.path
                d="M310 130 Q320 120 315 110 Q310 115 305 120 Q310 125 310 130"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.path
                d="M290 135 Q300 125 295 115 Q290 120 285 125 Q290 130 290 135"
                fill={isWithered ? "#8B7355" : "#16A34A"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.path
                d="M270 140 Q280 130 275 120 Q270 125 265 130 Q270 135 270 140"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
            </>
          )}

          {/* Additional foliage clusters */}
          {showLeaves && (
            <>
              <motion.ellipse
                cx="150"
                cy="185"
                rx="25"
                ry="15"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                opacity="0.8"
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.ellipse
                cx="250"
                cy="130"
                rx="30"
                ry="18"
                fill={isWithered ? "#8B7355" : "#16A34A"}
                opacity="0.8"
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
              <motion.ellipse
                cx="200"
                cy="115"
                rx="20"
                ry="12"
                fill={isWithered ? "#8B7355" : "#22C55E"}
                opacity="0.8"
                variants={leafVariants}
                style={{
                  filter: isWithered ? "grayscale(1)" : "none"
                }}
              />
            </>
          )}

          {/* Flowers */}
          {showFlowers && (
            <>
              <motion.circle
                cx="85"
                cy="135"
                r="4"
                fill="#FF69B4"
                variants={flowerVariants}
              />
              <motion.circle
                cx="105"
                cy="140"
                r="3"
                fill="#FFB6C1"
                variants={flowerVariants}
              />
              <motion.circle
                cx="315"
                cy="115"
                r="4"
                fill="#FF1493"
                variants={flowerVariants}
              />
              <motion.circle
                cx="295"
                cy="120"
                r="3"
                fill="#FF69B4"
                variants={flowerVariants}
              />
              <motion.circle
                cx="275"
                cy="125"
                r="3"
                fill="#FFB6C1"
                variants={flowerVariants}
              />
              <motion.circle
                cx="205"
                cy="110"
                r="3"
                fill="#FF1493"
                variants={flowerVariants}
              />
            </>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="potGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B4513" />
              <stop offset="100%" stopColor="#654321" />
            </linearGradient>
            <linearGradient id="potBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D2691E" />
              <stop offset="50%" stopColor="#CD853F" />
              <stop offset="100%" stopColor="#8B4513" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Growth stage indicator */}
      <motion.div
        className="mt-1 sm:mt-2 md:mt-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <h3 className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${
          isWithered 
            ? 'text-red-400' 
            : growthStage === 'Flowering' 
              ? 'text-pink-400' 
              : 'text-emerald-400'
        }`}>
          {growthStage}
        </h3>
        <p className="text-slate-400 mt-0.5 sm:mt-1 md:mt-2 text-xs sm:text-xs md:text-sm lg:text-base">
          {isWithered && "Focus was broken..."}
          {growthStage === 'Seedling' && "Just beginning to grow"}
          {growthStage === 'Sprout' && "Taking shape and forming branches"}
          {growthStage === 'Mature' && "Strong and full of life"}
          {growthStage === 'Flowering' && "A masterpiece of focus and dedication"}
        </p>
      </motion.div>
    </div>
  );
}
