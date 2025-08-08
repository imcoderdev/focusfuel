"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Session {
  id: string;
  date: string;
  duration: number;
  taskName?: string;
  startTime: string;
  userEmail: string;
}

interface BonsaiTreeProps {
  sessionData: Session;
}

export default function BonsaiTree({ sessionData }: BonsaiTreeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Choose tree variant based on session data for variety
  // Safely convert id to string and create a hash for consistent variety
  const idString = String(sessionData.id || sessionData.date || 'default');
  const treeVariant = Math.abs(idString.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 5;

  // Format date for tooltip
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Tree size based on duration (longer sessions = bigger trees)
  const treeSize = Math.min(Math.max(sessionData.duration / 30, 0.7), 1.3);

  const renderTreeSVG = () => {
    const baseProps = {
      viewBox: "0 0 200 240",
      className: "w-24 h-32 drop-shadow-2xl transition-transform duration-300",
      style: { transform: `scale(${treeSize}) ${isHovered ? 'scale(1.1)' : ''}` }
    };

    switch (treeVariant) {
      case 0: // Classic Elegant Bonsai
        return (
          <svg {...baseProps}>
            <defs>
              <linearGradient id="elegantPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B7355" />
                <stop offset="50%" stopColor="#6B5B47" />
                <stop offset="100%" stopColor="#4A3F35" />
              </linearGradient>
              <radialGradient id="leafGradient1" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#7CFC00" />
                <stop offset="70%" stopColor="#32CD32" />
                <stop offset="100%" stopColor="#228B22" />
              </radialGradient>
            </defs>
            
            <rect x="55" y="200" width="90" height="30" rx="12" fill="url(#elegantPot)" />
            <rect x="58" y="203" width="84" height="5" rx="2" fill="#A0956B" opacity="0.7" />
            
            {/* Main trunk with gentle curves */}
            <path d="M100 200 Q95 180 98 160 Q102 140 96 120 Q90 100 95 80" 
                  stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
            
            {/* Primary branch - elegant sweep */}
            <path d="M95 120 Q110 115 125 110 Q140 105 155 100" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            
            {/* Secondary branch - counterbalance */}
            <path d="M98 160 Q85 155 75 150 Q65 145 55 140" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Delicate leaf clusters */}
            <ellipse cx="155" cy="95" rx="25" ry="15" fill="url(#leafGradient1)" opacity="0.9" />
            <ellipse cx="145" cy="105" rx="20" ry="12" fill="url(#leafGradient1)" opacity="0.8" />
            <ellipse cx="55" cy="135" rx="18" ry="10" fill="url(#leafGradient1)" opacity="0.9" />
            <ellipse cx="45" cy="145" rx="15" ry="8" fill="url(#leafGradient1)" opacity="0.8" />
            
            {/* Crown foliage */}
            <ellipse cx="95" cy="75" rx="22" ry="18" fill="url(#leafGradient1)" opacity="0.9" />
            
            {/* Subtle flowers */}
            <circle cx="150" cy="90" r="3" fill="#FFB6C1" opacity="0.8" />
            <circle cx="52" cy="140" r="2" fill="#FFB6C1" opacity="0.7" />
          </svg>
        );

      case 1: // Windswept Mountain Style
        return (
          <svg {...baseProps}>
            <defs>
              <linearGradient id="mountainPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#696969" />
                <stop offset="100%" stopColor="#2F4F4F" />
              </linearGradient>
              <radialGradient id="pineGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#90EE90" />
                <stop offset="100%" stopColor="#006400" />
              </radialGradient>
            </defs>
            
            {/* Rugged stone pot */}
            <rect x="50" y="200" width="100" height="30" rx="8" fill="url(#mountainPot)" />
            <rect x="53" y="210" width="94" height="8" rx="3" fill="#A9A9A9" opacity="0.5" />
            
            {/* Dramatic angled trunk */}
            <path d="M100 200 Q85 170 75 140 Q70 110 65 80 Q60 60 55 40" 
                  stroke="#8B4513" strokeWidth="10" fill="none" strokeLinecap="round" />
            
            {/* Wind-swept branches */}
            <path d="M75 140 Q90 135 105 132 Q120 130 135 125" 
                  stroke="#A0522D" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M65 80 Q50 75 35 70" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Dense needle clusters */}
            <ellipse cx="135" cy="120" rx="30" ry="8" fill="url(#pineGradient)" opacity="0.9" />
            <ellipse cx="125" cy="130" rx="25" ry="6" fill="url(#pineGradient)" opacity="0.8" />
            <ellipse cx="35" cy="65" rx="20" ry="6" fill="url(#pineGradient)" opacity="0.9" />
            <ellipse cx="55" cy="35" rx="18" ry="8" fill="url(#pineGradient)" opacity="0.9" />
          </svg>
        );

      case 2: // Cascade Weeping Style
        return (
          <svg {...baseProps}>
            <defs>
              <linearGradient id="cascadePot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DEB887" />
                <stop offset="100%" stopColor="#8B7D6B" />
              </linearGradient>
              <radialGradient id="willowGradient" cx="50%" cy="20%" r="80%">
                <stop offset="0%" stopColor="#ADFF2F" />
                <stop offset="100%" stopColor="#9ACD32" />
              </radialGradient>
            </defs>
            
            {/* Shallow wide pot */}
            <ellipse cx="100" cy="215" rx="55" ry="15" fill="url(#cascadePot)" />
            <ellipse cx="100" cy="210" rx="50" ry="12" fill="#F5DEB3" opacity="0.6" />
            
            {/* Graceful upright trunk */}
            <path d="M100 200 Q102 160 100 120 Q98 80 100 50" 
                  stroke="#8B4513" strokeWidth="9" fill="none" strokeLinecap="round" />
            
            {/* Cascading branches */}
            <path d="M100 120 Q120 125 140 135 Q160 145 175 160" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 100 Q80 105 60 115 Q40 125 25 140" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 80 Q115 85 130 95 Q145 105 155 120" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Weeping foliage */}
            <ellipse cx="175" cy="155" rx="15" ry="25" fill="url(#willowGradient)" opacity="0.9" />
            <ellipse cx="25" cy="135" rx="12" ry="20" fill="url(#willowGradient)" opacity="0.9" />
            <ellipse cx="155" cy="115" rx="10" ry="18" fill="url(#willowGradient)" opacity="0.8" />
            <ellipse cx="100" cy="45" rx="20" ry="15" fill="url(#willowGradient)" opacity="0.9" />
            
            {/* Delicate flowers */}
            <circle cx="170" cy="150" r="2" fill="#FF69B4" opacity="0.8" />
            <circle cx="30" cy="130" r="2" fill="#FF69B4" opacity="0.8" />
            <circle cx="105" cy="40" r="2" fill="#FF69B4" opacity="0.8" />
          </svg>
        );

      case 3: // Forest Canopy Style
        return (
          <svg {...baseProps}>
            <defs>
              <linearGradient id="forestPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8FBC8F" />
                <stop offset="100%" stopColor="#556B2F" />
              </linearGradient>
              <radialGradient id="canopyGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#98FB98" />
                <stop offset="100%" stopColor="#228B22" />
              </radialGradient>
            </defs>
            
            {/* Natural earthen pot */}
            <rect x="45" y="200" width="110" height="25" rx="15" fill="url(#forestPot)" />
            <rect x="48" y="205" width="104" height="8" rx="4" fill="#9ACD32" opacity="0.4" />
            
            {/* Sturdy central trunk */}
            <path d="M100 200 Q98 170 100 140 Q102 110 98 80 Q96 50 100 30" 
                  stroke="#8B4513" strokeWidth="12" fill="none" strokeLinecap="round" />
            
            {/* Multiple spreading branches */}
            <path d="M98 80 Q85 75 70 70 Q55 65 40 60" 
                  stroke="#A0522D" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M102 80 Q115 75 130 70 Q145 65 160 60" 
                  stroke="#A0522D" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M100 140 Q120 135 140 130" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 140 Q80 135 60 130" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            
            {/* Dense canopy foliage */}
            <ellipse cx="40" cy="55" rx="25" ry="20" fill="url(#canopyGradient)" opacity="0.9" />
            <ellipse cx="160" cy="55" rx="25" ry="20" fill="url(#canopyGradient)" opacity="0.9" />
            <ellipse cx="140" cy="125" rx="20" ry="15" fill="url(#canopyGradient)" opacity="0.8" />
            <ellipse cx="60" cy="125" rx="20" ry="15" fill="url(#canopyGradient)" opacity="0.8" />
            <ellipse cx="100" cy="25" rx="30" ry="25" fill="url(#canopyGradient)" opacity="0.9" />
            
            {/* Forest flowers */}
            <circle cx="45" cy="50" r="3" fill="#FF6347" opacity="0.9" />
            <circle cx="155" cy="50" r="3" fill="#FF6347" opacity="0.9" />
            <circle cx="105" cy="20" r="3" fill="#FF6347" opacity="0.9" />
          </svg>
        );

      case 4: // Formal Upright Style
        return (
          <svg {...baseProps}>
            <defs>
              <linearGradient id="formalPot" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2F4F4F" />
                <stop offset="100%" stopColor="#191970" />
              </linearGradient>
              <radialGradient id="formalGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#00FF7F" />
                <stop offset="100%" stopColor="#008B8B" />
              </radialGradient>
            </defs>
            
            {/* Refined rectangular pot */}
            <rect x="60" y="200" width="80" height="28" rx="6" fill="url(#formalPot)" />
            <rect x="63" y="203" width="74" height="6" rx="2" fill="#4682B4" opacity="0.6" />
            
            {/* Perfectly straight trunk */}
            <rect x="96" y="30" width="8" height="170" fill="#8B4513" rx="4" />
            
            {/* Symmetrical branching */}
            <path d="M100 60 Q85 55 70 55 Q55 55 45 60" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 60 Q115 55 130 55 Q145 55 155 60" 
                  stroke="#A0522D" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M100 100 Q88 95 75 95" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 100 Q112 95 125 95" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 140 Q90 135 80 135" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M100 140 Q110 135 120 135" 
                  stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
            
            {/* Perfectly balanced foliage */}
            <ellipse cx="45" cy="55" rx="18" ry="12" fill="url(#formalGradient)" opacity="0.9" />
            <ellipse cx="155" cy="55" rx="18" ry="12" fill="url(#formalGradient)" opacity="0.9" />
            <ellipse cx="75" cy="90" rx="15" ry="10" fill="url(#formalGradient)" opacity="0.8" />
            <ellipse cx="125" cy="90" rx="15" ry="10" fill="url(#formalGradient)" opacity="0.8" />
            <ellipse cx="80" cy="130" rx="12" ry="8" fill="url(#formalGradient)" opacity="0.8" />
            <ellipse cx="120" cy="130" rx="12" ry="8" fill="url(#formalGradient)" opacity="0.8" />
            <ellipse cx="100" cy="25" rx="20" ry="15" fill="url(#formalGradient)" opacity="0.9" />
            
            {/* Minimal formal flowers */}
            <circle cx="100" cy="20" r="2" fill="#FFF8DC" opacity="0.9" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center mx-4">
      {/* Interactive Tree Container */}
      <motion.div
        className="relative cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {renderTreeSVG()}
        
        {/* Enhanced Memory Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-black/90 backdrop-blur-md text-white text-sm rounded-xl p-4 shadow-2xl border border-white/20 min-w-[220px]">
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-black/90"></div>
                
                {/* Memory Content */}
                <div className="space-y-2">
                  <div className="text-emerald-400 font-semibold text-base flex items-center gap-2">
                    <span>🌳</span>
                    <span>Focus Memory</span>
                  </div>
                  
                  <div className="space-y-1.5 text-white/90">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs">DATE</span>
                      <span className="font-medium">{formatDate(sessionData.date)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs">DURATION</span>
                      <span className="font-bold text-emerald-300">{sessionData.duration}m</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs">TASK</span>
                      <span className="font-medium text-blue-300 max-w-[120px] truncate" title={sessionData.taskName || 'Focus Session'}>
                        {sessionData.taskName || 'Focus Session'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs">TIME</span>
                      <span className="font-medium text-purple-300">
                        {new Date(sessionData.startTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Achievement Badge */}
                  <div className="mt-3 pt-2 border-t border-white/20">
                    <div className="text-center">
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        <span>🏆</span>
                        <span>Growth Achieved</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Tree Style Label */}
      <motion.div
        className="mt-2 text-center"
        animate={{
          opacity: isHovered ? 1 : 0.7,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-white/80 text-xs font-medium">
          {['Elegant', 'Windswept', 'Cascade', 'Forest', 'Formal'][treeVariant]} Bonsai
        </div>
        <div className="text-white/50 text-xs mt-0.5">
          {formatDate(sessionData.date)}
        </div>
      </motion.div>
    </div>
  );
}
