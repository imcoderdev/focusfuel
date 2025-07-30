"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { ReactNode, useState } from "react";
import { FiSmile, FiList, FiClock, FiBarChart2, FiUser, FiInbox, FiCalendar, FiPlus, FiMenu, FiHelpCircle, FiPlayCircle } from "react-icons/fi";
import AddTaskModal from "./tasks/AddTaskModal";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

const navLinks = [
  { href: "/dashboard/mood", label: "Mood Calibration", icon: <FiSmile /> },
  { href: "/dashboard/tasks", label: "AI Task Planner", icon: <FiList /> },
  { href: "/dashboard/focus", label: "Focus Session", icon: <FiClock /> },
  { href: "/dashboard/progress", label: "Progress Dashboard", icon: <FiBarChart2 /> },
  { href: "/dashboard/profile", label: "User Profile", icon: <FiUser /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  return (
    <div className={inter.className + " min-h-screen flex"} style={{ background: '#fff' }}>
      {/* Sidebar: hackathon style */}
      <aside
        className={`shadow-md rounded-lg flex flex-col py-6 px-4 transition-all duration-300 bg-white max-w-[200px] w-full z-20 border-r border-gray-100`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          width: 200,
          minHeight: '100vh',
          background: '#fff',
        }}
      >
        {/* Top: Avatar + Toggle */}
        <div className="flex items-start gap-2 mb-4">
          <div className="flex flex-col items-center w-full">
            <div className="w-10 h-10 rounded-full bg-[#2DD4BF] flex items-center justify-center text-xl font-bold text-white mb-1">Y</div>
            <span className="mt-1 font-semibold text-[#1F2937] text-base">Yash</span>
          </div>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white shadow hover:bg-[#F5F7FA] transition mt-1"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FiMenu className="text-2xl text-[#1F2937]" />
          </button>
        </div>
        {/* Add Task Button */}
        <button
          className="flex items-center gap-3 mb-3 w-full justify-start py-2 bg-[#2DD4BF] hover:bg-[#22c5b3] text-white font-bold rounded-lg shadow transition-all duration-150 border-none"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowAddTaskModal(true)}
          aria-label="Add Task"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
            <FiPlus className="text-[#2DD4BF] text-xl" style={{ fontSize: '1.25rem' }} />
          </span>
          <span className="text-base font-medium">Add Task</span>
        </button>
        {/* Parent Update Badge */}
        <span className="inline-block bg-[#60A5FA] text-white text-xs font-semibold rounded-full px-3 py-1 mb-4">Parent Update</span>
        {/* Navigation */}
        <nav className="flex-1 w-full">
          <ul className="space-y-1">
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F7FA] text-[#1F2937] font-medium transition">
                <FiInbox className="text-lg" />
                <span>Inbox <span className="ml-auto text-xs bg-gray-200 rounded px-2">3</span></span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F7FA] text-[#1F2937] font-medium transition">
                <FiCalendar className="text-lg" />
                <span>Today <span className="ml-auto text-xs bg-gray-200 rounded px-2">1</span></span>
              </Link>
            </li>
          </ul>
          {/* Main navigation links */}
          <div className="mt-8">
            <div className="text-xs text-gray-400 uppercase mb-2">Features</div>
            <ul className="space-y-1">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F7FA] text-[#1F2937] font-medium transition">
                    <span className="text-xl">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        {/* Footer */}
        <div className="mt-auto pt-6">
          <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm">
            <FiHelpCircle className="text-lg" /> Help & resources
          </a>
        </div>
      </aside>
      {/* Main content */}
      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto"
        style={{ marginLeft: 200, transition: 'margin-left 0.3s' }}
      >
        {children}
      </main>
      <AddTaskModal 
        open={showAddTaskModal} 
        onClose={() => setShowAddTaskModal(false)} 
        onTaskAdded={() => {
          setShowAddTaskModal(false);
          // Dispatch custom event to notify child components
          window.dispatchEvent(new CustomEvent('taskAdded'));
        }} 
      />
    </div>
  );
} 