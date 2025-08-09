"use client";

import { useSupabaseAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  HiOutlineSparkles, 
  HiOutlineClock, 
  HiOutlineCheckCircle, 
  HiOutlineFaceSmile,
  HiOutlineLightBulb,
  HiOutlinePlay
} from "react-icons/hi2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import AITaskPlanner from '@/components/AITaskPlanner';
import ParentalReportModal from '@/components/ParentalReportModal';
import { HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  index: number;
}

function StatCard({ title, value, icon: Icon, iconColor, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white dark:bg-slate-800/50 p-5 rounded-xl shadow-sm flex items-center space-x-4 transition-transform hover:scale-105"
    >
      <div className={`${iconColor} p-3 rounded-lg bg-opacity-10`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}

export default function FocusFuelDashboard() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [showParentModal, setShowParentModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      bonsaisGrown: "0",
      todaysFocus: "0 hrs",
      tasksCompleted: "0",
      currentMood: "Unknown"
    },
    weeklyFocusData: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Focus Hours",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 8,
      }]
    },
    tasks: [] as Task[]
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Generate AI insights based on user data
  function generateAIInsight() {
    const chartData = dashboardData.weeklyFocusData.datasets[0].data;
    const totalFocus = chartData.reduce((sum, hours) => sum + hours, 0);
    const avgFocus = totalFocus / 7;
    const bonsaiCount = parseInt(dashboardData.stats.bonsaisGrown);
    const completedTasks = parseInt(dashboardData.stats.tasksCompleted);
    
    // Find the best performing day
    const maxFocusIndex = chartData.indexOf(Math.max(...chartData));
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const bestDay = days[maxFocusIndex];
    
    const insights = [
      `You've grown ${bonsaiCount} bonsai trees! Keep nurturing your focus habits. 🌱`,
      `Your peak focus day is ${bestDay}. Try scheduling important tasks then! 📅`,
      `You completed ${completedTasks} tasks today. You're building great momentum! ⚡`,
      `Average focus time: ${avgFocus.toFixed(1)}h/day. Small consistent efforts create big results! 💪`,
      `Take breaks between focus sessions to maintain your energy and clarity. 🧘‍♀️`,
      `Your current mood affects productivity. Consider mood tracking for better insights! 😊`
    ];
    
    // Choose insight based on data availability and performance
    if (bonsaiCount > 0 && avgFocus > 1) {
      return insights[1]; // Peak day insight
    } else if (completedTasks > 0) {
      return insights[2]; // Task completion
    } else if (avgFocus > 0) {
      return insights[3]; // Average focus
    } else if (bonsaiCount > 0) {
      return insights[0]; // Bonsai count
    } else {
      return insights[4]; // Default encouraging message
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" }
      },
      y: {
        grid: { display: false },
        ticks: { color: "#64748b" }
      }
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Set user name
  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || "User");
    }
  }, [user]);

  // Fetch dashboard data from APIs
  useEffect(() => {
    if (user?.email && !loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  async function fetchDashboardData() {
    if (!user?.email) return;
    
    setDataLoading(true);
    try {
      // Fetch all data in parallel
      const [focusSessionsRes, tasksRes, moodsRes, latestMoodRes, focusTodayRes] = await Promise.all([
        fetch(`/api/progress/focus-sessions-final?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/tasks-final?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/progress/moods-final?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/mood-latest?userEmail=${encodeURIComponent(user.email)}`),
        fetch(`/api/focus-today?userEmail=${encodeURIComponent(user.email)}`)
      ]);

      const [focusSessionsData, tasksData, moodsData, latestMoodData, focusTodayData] = await Promise.all([
        focusSessionsRes.json(),
        tasksRes.json(),
        moodsRes.json(),
        latestMoodRes.json(),
        focusTodayRes.json()
      ]);

      // Process focus sessions for weekly chart
      const weeklyData = Array.isArray(focusSessionsData) ? focusSessionsData : [];
      const chartData = weeklyData.map(day => day.minutes / 60); // Convert minutes to hours
      
      // Get today's focus time from dedicated API
      const todayFocusHours = focusTodayData?.displayTime || "0.0";

      // Process tasks
      const tasks = Array.isArray(tasksData) ? tasksData : [];
      const completedTasksToday = tasks.filter(task => {
        if (!task.completed || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt).toISOString().slice(0, 10);
        const today = new Date().toISOString().slice(0, 10);
        return completedDate === today;
      }).length;

      // Get current mood from latest mood API
      const currentMood = latestMoodData?.mood || "Unknown";

      // Get bonsai count from localStorage (from focus page)
      const savedForest = localStorage.getItem('bonsaiForest') || "0";

      // Map tasks to dashboard format
      const dashboardTasks = tasks.slice(0, 5).map((task: any) => ({
        id: task.id ? task.id.toString() : Math.random().toString(),
        text: task.title || task.description || "Untitled Task",
        completed: task.completed || false,
        priority: (task.priority as "High" | "Medium" | "Low") || "Medium"
      }));

      setDashboardData({
        stats: {
          bonsaisGrown: savedForest,
          todaysFocus: `${todayFocusHours} hrs`,
          tasksCompleted: completedTasksToday.toString(),
          currentMood: currentMood
        },
        weeklyFocusData: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{
            label: "Focus Hours",
            data: chartData,
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        tasks: dashboardTasks
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }

  if (loading || dataLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {loading ? "Loading your dashboard..." : "Fetching your data..."}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Dashboard Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                  Welcome back, {userName}!
                </h1>
                <p className="text-md text-slate-500 dark:text-slate-400 mt-1">
                  Let's make today productive. Here's your game plan.
                </p>
              </div>
              
              {/* Parent Reports Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowParentModal(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-200"
              >
                <HiOutlineChatBubbleBottomCenterText className="h-5 w-5" />
                <span className="font-medium">Parent Reports</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Bonsais Grown"
                value={dashboardData.stats.bonsaisGrown}
                icon={HiOutlineSparkles}
                iconColor="text-amber-500 bg-amber-100"
                index={0}
              />
              <StatCard
                title="Today's Focus"
                value={dashboardData.stats.todaysFocus}
                icon={HiOutlineClock}
                iconColor="text-blue-500 bg-blue-100"
                index={1}
              />
              <StatCard
                title="Tasks Completed"
                value={dashboardData.stats.tasksCompleted}
                icon={HiOutlineCheckCircle}
                iconColor="text-emerald-500 bg-emerald-100"
                index={2}
              />
              <StatCard
                title="Current Mood"
                value={dashboardData.stats.currentMood}
                icon={HiOutlineFaceSmile}
                iconColor="text-pink-500 bg-pink-100"
                index={3}
              />
            </div>
          </div>

          {/* AI Insight Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3">
              <HiOutlineLightBulb className="h-8 w-8" />
              <h3 className="text-xl font-bold">Your AI Pro-Tip</h3>
            </div>
            <p className="mt-4 text-lg">
              {generateAIInsight()}
            </p>
          </motion.div>

          {/* Weekly Focus Chart Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Weekly Focus Activity
            </h3>
            <div className="h-64">
              <Bar data={dashboardData.weeklyFocusData} options={chartOptions} />
            </div>
          </motion.div>

          {/* AI Task Planner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="lg:col-span-4 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm"
          >
            <AITaskPlanner 
              initialTasks={dashboardData.tasks} 
              userEmail={user?.email}
              onTaskUpdate={fetchDashboardData}
            />
          </motion.div>

        </div>
      </div>

      {/* Parent Reports Modal */}
      <ParentalReportModal 
        open={showParentModal} 
        onClose={() => setShowParentModal(false)} 
      />
    </div>
  );
}