"use client";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { FiUser, FiAward } from "react-icons/fi";
import { BsTreeFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
      try {
        const [p, f, t, d, m] = await Promise.all([
          fetch("/api/progress/profile").then(r => r.json()),
          fetch("/api/progress/focus-sessions").then(r => r.json()),
          fetch("/api/progress/tasks").then(r => r.json()),
          fetch("/api/progress/distractions").then(r => r.json()),
          fetch("/api/progress/moods").then(r => r.json()),
        ]);
        setProfile(p);
        setFocusData({
          labels: f.map((d: any) => d.date.slice(5)),
          datasets: [{ label: "Focus Hours", data: f.map((d: any) => d.minutes / 60), backgroundColor: "#22c55e" }],
        });
        setTasksData({
          labels: t.map((d: any) => d.date.slice(5)),
          datasets: [{ label: "Tasks Completed", data: t.map((d: any) => d.count), borderColor: "#1e3a8a", backgroundColor: "#a7f3d0" }],
        });
        setDistractionsData({
          labels: d.map((x: any) => x.label.charAt(0).toUpperCase() + x.label.slice(1)),
          datasets: [{ data: d.map((x: any) => x.value), backgroundColor: ["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"] }],
        });
        setMoodData({
          labels: m.map((d: any) => d.date.slice(5)),
          datasets: [{ label: "Mood Score", data: m.map((d: any) => d.score), borderColor: "#fbbf24", backgroundColor: "#fef9c3" }],
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
      try {
        const res = await fetch("/api/progress/recap", { method: "POST" });
        const data = await res.json();
        setAiRecap(data.recap || "Great job this week!");
      } catch {
        setAiRecap("Failed to load AI recap.");
      }
      setAiRecapLoading(false);
    }
    fetchRecap();
  }, []);

  // Dummy AI Recap and insight for now
  const insight = "Try focusing on one task at a time and put your phone away during sessions.";

  const card3d = {
    rest: { rotateY: 0, rotateX: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
    hover: { rotateY: 8, rotateX: -4, scale: 1.03, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };

  return (
    <div className={inter.className + " min-h-screen flex flex-col items-center justify-center w-full p-4"} style={{ background: '#fff' }}>
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Profile, Recap, Insights */}
        <div className="flex flex-col gap-8">
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex items-center gap-4"
          >
            <FiUser className="text-3xl text-green-700" />
            <div>
              <div className="font-bold text-green-900 text-lg">{profile?.name || "-"}</div>
              <div className="text-green-800 text-sm">{profile?.email || "-"}</div>
              <div className="flex items-center gap-2 mt-2 text-green-700 font-semibold">
                <BsTreeFill className="text-xl" /> Bonsais Grown: {profile?.bonsais ?? "-"}
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex items-center gap-4"
          >
            <BsTreeFill className="text-3xl text-amber-500 animate-pulse" />
            <div>
              <div className="font-bold text-green-900 text-lg mb-1">AI Weekly Recap</div>
              <div className="text-green-800 text-sm">
                {aiRecapLoading ? <span className="animate-pulse">Loading recap...</span> : aiRecap}
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex items-center gap-4"
          >
            <FiAward className="text-3xl text-green-700" />
            <div>
              <div className="font-bold text-green-900 text-lg mb-1">Actionable Insight</div>
              <div className="text-green-800 text-sm">{insight}</div>
            </div>
          </motion.div>
        </div>
        {/* Right: Charts */}
        <div className="flex flex-col gap-8">
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6"
          >
            <div className="font-bold text-green-900 mb-2">Weekly Focus Hours</div>
            {loading || !focusData ? <div className="text-green-800 animate-pulse">Loading...</div> : <Bar data={focusData} options={{ plugins: { legend: { display: false } } }} />}
          </motion.div>
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6"
          >
            <div className="font-bold text-green-900 mb-2">Tasks Completed (7 days)</div>
            {loading || !tasksData ? <div className="text-green-800 animate-pulse">Loading...</div> : <Line data={tasksData} options={{ plugins: { legend: { display: false } } }} />}
          </motion.div>
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6"
          >
            <div className="font-bold text-green-900 mb-2">Distraction Patterns</div>
            {loading || !distractionsData ? <div className="text-green-800 animate-pulse">Loading...</div> : <Pie data={distractionsData} />}
          </motion.div>
          <motion.div
            variants={card3d}
            initial="rest"
            whileHover="hover"
            animate="rest"
            style={{ perspective: 800 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-2xl p-6"
          >
            <div className="font-bold text-green-900 mb-2">Mood History (7 days)</div>
            {loading || !moodData ? <div className="text-green-800 animate-pulse">Loading...</div> : <Line data={moodData} options={{ plugins: { legend: { display: false } } }} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 