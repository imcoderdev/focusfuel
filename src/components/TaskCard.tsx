"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiCalendar } from "react-icons/fi";
import { useState } from "react";
import CustomCheckbox from "./CustomCheckbox";
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dueDate?: string;
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityConfig = {
  'High': { 
    color: 'border-red-500', 
    bg: 'bg-red-500/10', 
    text: 'text-red-400',
    dot: 'bg-red-500'
  },
  'Medium': { 
    color: 'border-yellow-500', 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-400',
    dot: 'bg-yellow-500'
  },
  'Low': { 
    color: 'border-blue-500', 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400',
    dot: 'bg-blue-500'
  }
};

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`w-full bg-slate-800 rounded-lg p-4 border-l-4 ${priority.color} hover:bg-slate-700/50 transition-all duration-200 group cursor-grab active:cursor-grabbing`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileDrag={{ 
        scale: 1.02, 
        rotate: 1,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        zIndex: 999
      }}
    >
      <div className="flex items-start space-x-3">
        {/* Custom Animated Checkbox */}
        <CustomCheckbox 
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-white font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-slate-400 text-sm mt-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
                  {task.description}
                </p>
              )}
              
              {/* Priority and Date Row */}
              <div className="flex items-center gap-3 mt-2">
                {/* Priority Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${priority.bg} ${priority.text} text-xs font-medium`}>
                  <div className={`w-2 h-2 rounded-full ${priority.dot}`} />
                  {task.priority}
                </div>
                
                {/* Due Date */}
                {task.dueDate && (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    isPast(new Date(task.dueDate)) && !task.completed
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : isToday(new Date(task.dueDate))
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : isTomorrow(new Date(task.dueDate))
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-700 text-slate-400 border border-slate-600'
                  }`}>
                    <FiCalendar className="w-3 h-3" />
                    {isToday(new Date(task.dueDate)) 
                      ? 'Today'
                      : isTomorrow(new Date(task.dueDate))
                      ? 'Tomorrow'
                      : isThisWeek(new Date(task.dueDate))
                      ? format(new Date(task.dueDate), 'EEE')
                      : format(new Date(task.dueDate), 'MMM d')
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <AnimatePresence>
              {(isHovered || task.completed) && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1 ml-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(task)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete(task.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
