"use client";

import { Inter } from "next/font/google";
import { ReactNode, useState, useRef, useEffect } from "react";
import { HiOutlineBars3 } from "react-icons/hi2";
import CollapsibleSidebar, { CollapsibleSidebarRef } from "@/components/CollapsibleSidebar";
import AddTaskModal from "./tasks/AddTaskModal";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<CollapsibleSidebarRef>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={inter.className + " min-h-screen flex bg-slate-900"}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => {
            console.log('Mobile menu button clicked');
            sidebarRef.current?.toggleSidebar();
          }}
          className="fixed top-4 left-4 z-[10000] p-2 rounded-lg bg-[#1C2333] text-white shadow-lg md:hidden hover:bg-slate-700 transition-colors duration-200"
        >
          <HiOutlineBars3 className="text-xl" />
        </button>
      )}

      {/* Collapsible Sidebar */}
      <CollapsibleSidebar 
        ref={sidebarRef}
        onAddTask={() => setShowAddTaskModal(true)} 
      />
      
      {/* Main content */}
      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: 'var(--sidebar-width, 256px)',
          paddingTop: isMobile ? '60px' : undefined, // Add padding for mobile button
        }}
      >
        {children}
      </main>
      
      {/* Add Task Modal */}
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