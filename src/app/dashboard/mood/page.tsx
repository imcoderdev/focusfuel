"use client";

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import MoodCard from "@/components/MoodCard";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function DailyCheckInPage() {
  return (
    <div className={`${inter.className} flex items-center justify-center w-full h-full p-4 min-h-[calc(100vh-8rem)]`}>
      <Toaster position="top-center" />
      <MoodCard />
    </div>
  );
} 