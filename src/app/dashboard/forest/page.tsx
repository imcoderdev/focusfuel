"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseAuth } from "@/components/AuthProvider";
import ParallaxBackground from "@/components/ParallaxBackground";
import BonsaiTree from "@/components/BonsaiTree";
import toast from "react-hot-toast";

interface Session {
  id: string;
  date: string;
  duration: number;
  taskName?: string;
  startTime: string;
  userEmail: string;
}

export default function MyForestPage() {
  const { user, loading } = useSupabaseAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track scroll position to hide button when near end
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
      
      // Hide button when user has scrolled 80% or more through the forest
      setShowScrollButton(scrollPercentage < 0.8);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sessions]); // Re-run when sessions change

  // Fetch all completed focus sessions
  useEffect(() => {
    async function fetchSessions() {
      if (!user?.email) return;
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/focus-session-final?userEmail=${encodeURIComponent(user.email)}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const sessionsData = await res.json();
        
        if (Array.isArray(sessionsData) && sessionsData.length > 0) {
          // Transform and sort sessions by date
          const transformedSessions = sessionsData.map((session: any, index: number) => ({
            id: session.id || `session-${index}`,
            date: session.startTime || session.createdAt || new Date().toISOString(),
            duration: Math.floor(session.duration / 60), // Convert to minutes
            taskName: session.taskName || 'Focus Session',
            startTime: session.startTime,
            userEmail: user.email || 'unknown'
          })).sort((a: Session, b: Session) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setSessions(transformedSessions);
          toast.success(`🌳 Found ${transformedSessions.length} trees in your forest!`);
        } else {
          console.log("No sessions found for user:", user.email);
          setSessions([]);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load your forest");
        setSessions([]);
      }
      setIsLoading(false);
    }

    if (user?.email) {
      fetchSessions();
    }
  }, [user?.email]);

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading your magical forest... 🌳
        </motion.div>
      </div>
    );
  }

  // Handle no sessions
  if (sessions.length === 0) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🌱</div>
          <h1 className="text-4xl font-bold text-white mb-4">Your Forest Awaits</h1>
          <p className="text-white/70 text-xl mb-8 max-w-md">
            Complete your first focus session to grow your first Bonsai tree and start building your magical forest.
          </p>
          <motion.button
            onClick={() => window.location.href = '/dashboard/focus'}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold px-8 py-4 rounded-2xl transition-all duration-200"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)" }}
            whileTap={{ scale: 0.95 }}
          >
            Start Growing 🌱
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Calculate forest width (250px per tree with some padding) - only on client side
  const forestWidth = isMounted ? Math.max(sessions.length * 250 + 500, window.innerWidth) : 1200;

  return (
    <div 
      ref={scrollContainerRef}
      className="w-screen h-screen bg-slate-900 overflow-x-auto overflow-y-hidden relative"
    >
      {/* NEW, CORRECTLY SIZED BACKGROUND CONTAINER */}
      <div 
        className="fixed top-0 left-0 h-screen z-0" 
        style={{ width: `${forestWidth}px` }}
      >
        <ParallaxBackground scrollRef={scrollContainerRef} fullWidth={forestWidth} />
      </div>
      
      {/* Forest Header */}
      <motion.div
        className="absolute top-6 left-6 z-30 bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">🌳 My Bonsai Forest</h1>
        <p className="text-white/70">
          {sessions.length} trees grown • {sessions.reduce((total, s) => total + s.duration, 0)} minutes focused
        </p>
      </motion.div>

      {/* Your Main Forest Content (Trees, Header, etc.) */}
      <div 
        className="relative z-10 h-full flex items-end" 
        style={{ width: `${forestWidth}px` }}
      >
        {/* Ground plane */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-900/60 via-green-800/30 to-transparent" />
        
        {/* Grass texture overlay */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-green-700/40 to-transparent" />
        
        {/* Trees */}
        <div className="flex items-end h-full w-full pb-16">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1, 
                duration: 0.8,
                type: "spring",
                bounce: 0.4
              }}
              className="flex-shrink-0"
            >
              <BonsaiTree sessionData={session} />
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {sessions.length > 4 && showScrollButton && (
            <motion.button
              onClick={() => {
                if (scrollContainerRef.current) {
                  const container = scrollContainerRef.current;
                  const scrollAmount = window.innerWidth * 0.8; // Scroll 80% of viewport width
                  container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                  });
                }
              }}
              className="fixed bottom-6 right-6 z-30 bg-black/20 backdrop-blur-md rounded-full p-3 border border-white/10 text-white hover:bg-black/30 transition-colors cursor-pointer"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: [0, 10, 0] 
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                x: { duration: 2, repeat: Infinity, repeatType: "loop" }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">Scroll to explore</span>
                <span className="text-lg">→</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
