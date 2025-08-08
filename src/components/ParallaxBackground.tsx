"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, RefObject } from "react";

interface ParallaxBackgroundProps {
  scrollRef?: RefObject<HTMLDivElement | null>;
  fullWidth?: number;
}

export default function ParallaxBackground({ scrollRef, fullWidth = 3000 }: ParallaxBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll tracking for parallax effect - horizontal scrolling
  const { scrollXProgress } = useScroll({
    container: isMounted && scrollRef ? scrollRef : undefined,
    axis: "x"
  });

  // Create different parallax speeds for each layer (deeper layers move slower)
  // Enhanced distances for more dramatic parallax effect
  const starsTransform = useTransform(scrollXProgress, [0, 1], [0, -200]);      // Slowest (deepest)
  const moonTransform = useTransform(scrollXProgress, [0, 1], [0, -400]);       // Slow
  const cloudsTransform = useTransform(scrollXProgress, [0, 1], [0, -600]);     // Medium
  const mountainsTransform = useTransform(scrollXProgress, [0, 1], [0, -800]);  // Fast
  const treesTransform = useTransform(scrollXProgress, [0, 1], [0, -1000]);     // Fastest (foreground)

  // Don't render complex animations until mounted
  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900" />
    );
  }

  return (
    <>
      {/* Deep Sky Layer with Stars */}
      <motion.div
        className="absolute inset-0"
        style={{ x: starsTransform }}
      >
        <div 
          className="h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900" 
          style={{ width: `${fullWidth}px` }}
        />
        
        {/* Twinkling Stars */}
        {Array.from({ length: 200 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${(Math.random() * fullWidth)}px`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      {/* Moon Layer */}
      <motion.div
        className="absolute inset-0"
        style={{ x: moonTransform }}
      >
        <div className="h-full" style={{ width: `${fullWidth}px` }}>
          <motion.div
            className="absolute top-20 right-1/4 w-32 h-32 bg-yellow-100 rounded-full shadow-2xl"
            animate={{
              filter: ["brightness(0.8)", "brightness(1.2)", "brightness(0.8)"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Moon Craters */}
            <div className="absolute top-6 left-8 w-4 h-4 bg-yellow-200 rounded-full opacity-60" />
            <div className="absolute top-12 right-6 w-3 h-3 bg-yellow-200 rounded-full opacity-40" />
            <div className="absolute bottom-8 left-6 w-2 h-2 bg-yellow-200 rounded-full opacity-50" />
          </motion.div>
        </div>
      </motion.div>

      {/* Cloud Layer */}
      <motion.div
        className="absolute inset-0"
        style={{ x: cloudsTransform }}
      >
        <div className="h-full" style={{ width: `${fullWidth}px` }}>
          {/* Floating Clouds */}
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white opacity-20 rounded-full"
              style={{
                left: `${(i * (fullWidth / 12) + Math.random() * (fullWidth / 20))}px`,
                top: `${20 + Math.random() * 40}%`,
                width: `${60 + Math.random() * 80}px`,
                height: `${30 + Math.random() * 40}px`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Mountain Layer */}
      <motion.div
        className="absolute inset-0"
        style={{ x: mountainsTransform }}
      >
        <div className="h-full" style={{ width: `${fullWidth}px` }}>
          {/* Mountain Silhouettes */}
          <svg
            viewBox={`0 0 ${fullWidth} 400`}
            className="absolute bottom-0 w-full h-2/3 fill-slate-800 opacity-60"
          >
            <polygon points={`0,400 ${fullWidth * 0.09375},200 ${fullWidth * 0.1875},280 ${fullWidth * 0.28125},150 ${fullWidth * 0.375},220 ${fullWidth * 0.46875},180 ${fullWidth * 0.5625},240 ${fullWidth * 0.65625},160 ${fullWidth * 0.75},200 ${fullWidth * 0.84375},180 ${fullWidth * 0.9375},160 ${fullWidth},400`} />
            <polygon points={`0,400 ${fullWidth * 0.0625},280 ${fullWidth * 0.15625},320 ${fullWidth * 0.25},240 ${fullWidth * 0.34375},300 ${fullWidth * 0.4375},250 ${fullWidth * 0.53125},290 ${fullWidth * 0.625},230 ${fullWidth * 0.71875},270 ${fullWidth * 0.8125},250 ${fullWidth * 0.90625},280 ${fullWidth},400`} />
          </svg>
        </div>
      </motion.div>

      {/* Foreground Tree Layer */}
      <motion.div
        className="absolute inset-0"
        style={{ x: treesTransform }}
      >
        <div className="h-full" style={{ width: `${fullWidth}px` }}>
          {/* Silhouette Trees */}
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 bg-slate-900 opacity-40"
              style={{
                left: `${(i * (fullWidth / 20) + Math.random() * (fullWidth / 40))}px`,
                width: `${20 + Math.random() * 30}px`,
                height: `${100 + Math.random() * 150}px`,
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
              animate={{
                filter: ["brightness(0.3)", "brightness(0.5)", "brightness(0.3)"],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Simplified Ambient Lights (no complex transforms) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full shadow-lg"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 30}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 50 - 25],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Shooting Stars */}
      {Array.from({ length: 3 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
          }}
          animate={{
            x: [0, 300],
            y: [0, 100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 8 + Math.random() * 5,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}
