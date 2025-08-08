"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePlay, HiOutlineCheckCircle } from "react-icons/hi2";
import toast from "react-hot-toast";
import PriorityTag from "./PriorityTag";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

interface AITaskPlannerProps {
  initialTasks: Task[];
  userEmail?: string;
  onTaskUpdate?: () => void;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
}

function TaskItem({ task, onToggleComplete }: TaskItemProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-center space-x-3 py-3 border-b border-slate-700 last:border-b-0"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onToggleComplete(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500' 
            : 'border-slate-600 hover:border-emerald-400'
        }`}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <HiOutlineCheckCircle className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.button>
      
      <div className="flex flex-col flex-1 space-y-1">
        <span 
          className={`text-sm transition-all duration-200 ${
            task.completed 
              ? 'line-through text-slate-500' 
              : 'text-slate-200'
          }`}
        >
          {task.text}
        </span>
        <PriorityTag priority={task.priority} />
      </div>
    </motion.li>
  );
}

export default function AITaskPlanner({ initialTasks, userEmail, onTaskUpdate }: AITaskPlannerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update tasks when initialTasks changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !userEmail) {
      toast.error("Unable to update task. Please try again.");
      return;
    }

    const newCompletedState = !task.completed;
    
    // Optimistically update UI
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, completed: newCompletedState }
          : t
      )
    );

    try {
      // Update task in backend
      const response = await fetch(`/api/tasks-final`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          completed: newCompletedState,
          completedAt: newCompletedState ? new Date().toISOString() : null,
          userEmail: userEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(newCompletedState ? "Task completed! 🎉" : "Task reopened", {
          icon: newCompletedState ? "✅" : "🔄",
          style: { 
            background: newCompletedState ? "#064e3b" : "#0c4a6e", 
            color: "#d1fae5" 
          }
        });
        
        // Refresh dashboard data
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } else {
        throw new Error('Backend update failed');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Revert optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: !newCompletedState }
            : t
        )
      );
      
      toast.error("Failed to update task. Please try again.");
    }
  };

  const handlePlanWithAI = async () => {
    setIsLoading(true);
    
    try {
      // Filter out completed tasks for AI planning
      const incompleteTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);
      
      if (incompleteTasks.length === 0) {
        toast.success("All tasks completed! Great job! 🎉");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/tasks/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: incompleteTasks }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI plan');
      }

      const data = await response.json();
      
      if (data.sortedTasks) {
        // Combine sorted incomplete tasks with completed tasks at the end
        const newTaskOrder = [...data.sortedTasks, ...completedTasks];
        setTasks(newTaskOrder);
        toast.success("Tasks optimized by AI! 🤖✨", {
          icon: "🎯",
          style: { 
            background: "#064e3b", 
            color: "#d1fae5" 
          }
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error planning with AI:', error);
      toast.error("Failed to optimize tasks. Please try again.", {
        style: { 
          background: "#7f1d1d", 
          color: "#fecaca" 
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-[#1C2333] p-6 rounded-xl shadow-lg w-full"
    >
      {/* Card Header */}
      <h3 className="text-xl font-bold text-white mb-4">
        Today's Agenda
      </h3>

      {/* Task List Container */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          <ul>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </ul>
        </AnimatePresence>
      </div>

      {/* AI Plan Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePlanWithAI}
        disabled={isLoading}
        className={`mt-6 w-full text-white font-bold rounded-lg text-sm px-5 py-3 text-center flex items-center justify-center space-x-2 transition-all ${
          isLoading 
            ? 'bg-emerald-700 cursor-not-allowed' 
            : 'bg-emerald-500 hover:bg-emerald-600'
        }`}
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Optimizing...</span>
          </>
        ) : (
          <>
            <HiOutlinePlay className="w-4 h-4" />
            <span>Plan with AI ✨</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
