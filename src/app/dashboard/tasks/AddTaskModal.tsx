"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCalendar, FiFlag, FiPlus } from "react-icons/fi";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from "react-hot-toast";

type Task = {
  id: number;
  title: string;
  completed?: boolean;
  completedAt?: string | null;
  description?: string | null;
  dueDate?: string | Date | null;
  priority?: number | null;
};

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

export default function AddTaskModal({ open, onClose, onTaskAdded }: AddTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<number>(2); // 1=red, 2=orange, 3=blue
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Close date picker when clicking outside
  useEffect(() => {
    if (!showDatePicker) return;
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDatePicker]);

  const priorityOptions = [
    { value: 1, label: "High", color: "bg-red-500" },
    { value: 2, label: "Medium", color: "bg-orange-500" },
    { value: 3, label: "Low", color: "bg-blue-500" },
  ];

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-red-500";
      case 2: return "bg-orange-500";
      case 3: return "bg-blue-500";
      default: return "bg-orange-500";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "High";
      case 2: return "Medium";
      case 3: return "Low";
      default: return "Medium";
    }
  };

  async function addTask() {
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          dueDate: dueDate ? dueDate.toISOString() : null,
          priority: priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const newTask = await response.json();
      toast.success("Task added successfully!");
      
      // Reset form
      setTaskTitle("");
      setTaskDescription("");
      setDueDate(new Date());
      setPriority(2);
      
      onTaskAdded();
      onClose();
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Task</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description (optional)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent resize-none"
                />
              </div>

              {/* Due Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent flex items-center justify-between bg-white"
                  >
                    <span className={dueDate ? "text-gray-900" : "text-gray-500"}>
                      {dueDate ? dueDate.toLocaleDateString() : "Select due date"}
                    </span>
                    <FiCalendar className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {showDatePicker && (
                    <div
                      ref={calendarRef}
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10"
                    >
                      <DayPicker
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        className="p-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                      <span>{getPriorityLabel(priority)}</span>
                    </div>
                    <FiFlag className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {showPriorityDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setPriority(option.value);
                            setShowPriorityDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                        >
                          <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={loading || !taskTitle.trim()}
                className="px-4 py-2 bg-[#2DD4BF] hover:bg-[#22c5b3] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiPlus className="w-4 h-4" />
                )}
                Add Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 