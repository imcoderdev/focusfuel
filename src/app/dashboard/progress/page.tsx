"use client";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { FiUser, FiAward, FiTrendingUp, FiClock, FiTarget, FiZap, FiActivity } from "react-icons/fi";
import { BsTreeFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createSupabaseClient } from "@/lib/supabase-client";

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);
const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function ProgressPage() {
  const [profile, setProfile] = useState<any>(null);
  const [focusData, setFocusData] = useState<any>(null);
  const [tasksData, setTasksData] = useState<any>(null);
  const [distractionsData, setDistractionsData] = useState<any>(null);
  const [moodData, setMoodData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiRecap, setAiRecap] = useState<string | null>(null);
  const [aiRecapLoading, setAiRecapLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      
      // Get user email from client-side auth
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("Please log in to view progress");
        setLoading(false);
        return;
      }
      
      try {
        const [p, f, t, d, m] = await Promise.all([
          fetch(`/api/progress/profile-final?userEmail=${encodeURIComponent(user.email)}`).then(r => r.json()),
          fetch(`/api/progress/focus-sessions-final?userEmail=${encodeURIComponent(user.email)}`).then(r => r.json()),
          fetch(`/api/progress/tasks-final?userEmail=${encodeURIComponent(user.email)}`).then(r => r.json()),
          fetch(`/api/progress/distractions-final?userEmail=${encodeURIComponent(user.email)}`).then(r => r.json()),
          fetch(`/api/progress/moods-final?userEmail=${encodeURIComponent(user.email)}`).then(r => r.json()),
        ]);
        setProfile(p);
        
        // Create gradient for premium charts
        const createGradient = (ctx: any, color1: string, color2: string) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);
          return gradient;
        };
        
        setFocusData({
          labels: f.map((d: any) => d.date.slice(5)),
          datasets: [{
            label: "Focus Hours",
            data: f.map((d: any) => d.minutes / 60),
            backgroundColor: (ctx: any) => {
              const canvas = ctx.chart.ctx;
              return createGradient(canvas, '#10b981', '#065f46');
            },
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 8,
          }],
        });
        
        setTasksData({
          labels: t.map((d: any) => d.date.slice(5)),
          datasets: [{
            label: "Tasks Completed",
            data: t.map((d: any) => d.count),
            borderColor: '#10b981',
            backgroundColor: (ctx: any) => {
              const canvas = ctx.chart.ctx;
              return createGradient(canvas, '#10b981', '#065f46');
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          }],
        });
        
        setDistractionsData({
          labels: d.map((x: any) => x.label.charAt(0).toUpperCase() + x.label.slice(1)),
          datasets: [{
            data: d.map((x: any) => x.value),
            backgroundColor: ['#10b981', '#059669', '#047857', '#065f46'],
            borderWidth: 0,
          }],
        });
        
        setMoodData({
          labels: m.map((d: any) => d.date.slice(5)),
          datasets: [{
            label: "Mood Score",
            data: m.map((d: any) => d.score),
            borderColor: '#10b981',
            backgroundColor: (ctx: any) => {
              const canvas = ctx.chart.ctx;
              return createGradient(canvas, '#10b981', '#065f46');
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          }],
        });
      } catch (e) {
        toast.error("Failed to load progress data");
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  useEffect(() => {
    async function fetchRecap() {
      setAiRecapLoading(true);
      
      // Get user email from client-side auth
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setAiRecap("Please log in to view your recap.");
        setAiRecapLoading(false);
        return;
      }
      
      try {
        const res = await fetch("/api/progress/recap-final", { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userEmail: user.email })
        });
        const data = await res.json();
        setAiRecap(data.recap || "Great job this week!");
      } catch {
        setAiRecap("Failed to load AI recap.");
      }
      setAiRecapLoading(false);
    }
    fetchRecap();
  }, []);

  // Premium chart options for dark theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#374151',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#9ca3af' },
        border: { display: false },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#374151',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    },
  };

  // Dummy AI Recap and insight for now
  const insight = "Try focusing on one task at a time and put your phone away during sessions.";

  const card3d = {
    rest: { rotateY: 0, rotateX: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
    hover: { rotateY: 4, rotateX: -2, scale: 1.02, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  };

  // Calculate stats for infographic-style recap
  const totalHours = focusData?.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0;
  const totalTasks = tasksData?.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0;

  return (
    <div className={inter.className + " min-h-screen bg-slate-900 p-6"}>
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Progress Dashboard</h1>
          <p className="text-slate-400">Track your productivity journey with AI-powered insights</p>
        </div>

        {/* Intelligent Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI Weekly Recap - Infographic Style (Full Width) */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <FiActivity className="text-2xl text-emerald-400" />
              <h2 className="text-xl font-bold text-white">AI Weekly Recap</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiClock className="text-emerald-400 text-lg" />
                  <span className="text-3xl font-bold text-white">{totalHours.toFixed(1)}</span>
                </div>
                <p className="text-slate-400 text-sm">Hours Focused</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiTarget className="text-emerald-400 text-lg" />
                  <span className="text-3xl font-bold text-white">{totalTasks}</span>
                </div>
                <p className="text-slate-400 text-sm">Tasks Completed</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BsTreeFill className="text-emerald-400 text-lg" />
                  <span className="text-3xl font-bold text-white">{profile?.bonsais ?? 0}</span>
                </div>
                <p className="text-slate-400 text-sm">Bonsais Grown</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FiTrendingUp className="text-emerald-400 text-lg" />
                  <span className="text-3xl font-bold text-white">+12%</span>
                </div>
                <p className="text-slate-400 text-sm">Weekly Growth</p>
              </div>
            </div>
            
            <div className="text-slate-300">
              {aiRecapLoading ? (
                <span className="animate-pulse">Loading your personalized recap...</span>
              ) : (
                aiRecap || "Great job this week! Keep up the momentum."
              )}
            </div>
          </motion.div>

          {/* Actionable Insight - Spotlight Card (Full Width) */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="lg:col-span-2 bg-slate-800 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FiZap className="text-3xl text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Actionable Insight</h2>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">{insight}</p>
          </motion.div>

          {/* Chart Cards - 2x2 Grid */}
          
          {/* Weekly Focus Hours */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Focus Hours</h3>
            <div className="h-64">
              {loading || !focusData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 animate-pulse">Loading...</div>
                </div>
              ) : (
                <Bar data={focusData} options={chartOptions} />
              )}
            </div>
          </motion.div>

          {/* Tasks Completed */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Tasks Completed (7 days)</h3>
            <div className="h-64">
              {loading || !tasksData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 animate-pulse">Loading...</div>
                </div>
              ) : (
                <Line data={tasksData} options={chartOptions} />
              )}
            </div>
          </motion.div>

          {/* Distraction Patterns */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Distraction Patterns</h3>
            <div className="h-64">
              {loading || !distractionsData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 animate-pulse">Loading...</div>
                </div>
              ) : (
                <Pie data={distractionsData} options={pieOptions} />
              )}
            </div>
          </motion.div>

          {/* Mood History */}
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Mood History (7 days)</h3>
            <div className="h-64">
              {loading || !moodData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 animate-pulse">Loading...</div>
                </div>
              ) : (
                <Line data={moodData} options={chartOptions} />
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
} 