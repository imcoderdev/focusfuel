"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, RefObject } from "react";

interface ParallaxBackgroundProps {
  scrollRef?: RefObject<HTMLDivElement>;
}

export default function ParallaxBackground({ scrollRef }: ParallaxBackgroundProps) {
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Deep Sky Layer with Stars */}
      <motion.div
        className="absolute inset-0"
        style={{ x: starsTransform }}
      >
        <div className="w-[400%] h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900" />
        
        {/* Twinkling Stars */}
        {Array.from({ length: 200 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 400}%`,
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
        <div className="w-[400%] h-full">
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
        <div className="w-[400%] h-full">
          {/* Floating Clouds */}
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white opacity-20 rounded-full"
              style={{
                left: `${(i * 30 + Math.random() * 25)}%`,
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
        <div className="w-[400%] h-full">
          {/* Mountain Silhouettes */}
          <svg
            viewBox="0 0 1600 400"
            className="absolute bottom-0 w-full h-2/3 fill-slate-800 opacity-60"
          >
            <polygon points="0,400 150,200 300,280 450,150 600,220 750,180 900,240 1050,160 1200,200 1350,180 1500,160 1600,400" />
            <polygon points="0,400 100,280 250,320 400,240 550,300 700,250 850,290 1000,230 1150,270 1300,250 1450,280 1600,400" />
          </svg>
        </div>
      </motion.div>

      {/* Foreground Tree Layer */}
      <motion.div
        className="absolute inset-0"
        style={{ x: treesTransform }}
      >
        <div className="w-[400%] h-full">
          {/* Silhouette Trees */}
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 bg-slate-900 opacity-40"
              style={{
                left: `${i * 20 + Math.random() * 15}%`,
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
    </div>
  );
}
