"use client";

import { useState, useEffect, useRef } from "react";

export function useAmbientAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState("forest");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Available tracks - using free ambient sounds
  const tracks = {
    forest: "/ambient/forest.mp3",
    rain: "/ambient/rain.mp3", 
    ocean: "/ambient/ocean.mp3",
    silence: "" // No audio
  };

  // Load user preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem("ambientAudio");
    if (savedPreference) {
      const { isPlaying: savedIsPlaying, track } = JSON.parse(savedPreference);
      setIsPlaying(savedIsPlaying);
      setCurrentTrack(track || "forest");
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("ambientAudio", JSON.stringify({
      isPlaying,
      track: currentTrack
    }));
  }, [isPlaying, currentTrack]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && currentTrack !== "silence") {
      audioRef.current = new Audio(tracks[currentTrack as keyof typeof tracks]);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Keep it subtle
      
      // Handle audio errors gracefully
      audioRef.current.addEventListener('error', () => {
        console.warn('Audio track not found, falling back to silence');
        setCurrentTrack("silence");
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Auto-play might be blocked, that's okay
          console.log('Auto-play prevented by browser');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const setTrack = (track: string) => {
    if (track in tracks) {
      setCurrentTrack(track);
    }
  };

  return {
    isPlaying,
    currentTrack,
    toggleAudio,
    setTrack,
    availableTracks: Object.keys(tracks)
  };
}
