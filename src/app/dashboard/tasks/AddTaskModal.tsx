"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCalendar, FiFlag, FiPlus } from "react-icons/fi";
import { DayPicker } from 'react-day-picker';
import toast from "react-hot-toast";

// This is the custom styling for the date picker.
const dayPickerClassNames = {
  root: 'bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3',
  months: 'text-white',
  month: 'space-y-4',
  caption: 'flex justify-center py-2 mb-4 relative items-center',
  caption_label: 'text-sm font-medium text-white',
  nav: 'space-x-1 flex items-center',
  nav_button: 'h-7 w-7 bg-transparent p-1 rounded-md hover:bg-slate-700 transition-colors',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse space-y-1',
  head_row: 'flex',
  head_cell: 'text-slate-400 rounded-md w-9 font-normal text-[0.8rem]',
  row: 'flex w-full mt-2',
  cell: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
  day: 'h-9 w-9 p-0 font-normal rounded-full transition-colors hover:!bg-emerald-500/20',
  day_selected: 'bg-emerald-600 text-white hover:!bg-emerald-600 focus:bg-emerald-600 rounded-full',
  day_today: 'bg-slate-700 text-emerald-400 rounded-full',
  day_outside: 'text-slate-500 opacity-50',
  day_disabled: 'text-slate-600 opacity-50',
  day_hidden: 'invisible',
};

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  userEmail?: string;
}

export default function AddTaskModal({ open, onClose, onTaskAdded, userEmail }: AddTaskModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<number>(2);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousDueDateRef = useRef<Date | undefined>(dueDate);
  
  // Logic to close date picker when a date is selected
  useEffect(() => {
    // Only close if the date actually changed from a user selection
    if (dueDate !== previousDueDateRef.current && showDatePicker) {
      setShowDatePicker(false);
    }
    // Update the previous date reference
    previousDueDateRef.current = dueDate;
  }, [dueDate, showDatePicker]);

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

    if (!userEmail) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?userEmail=${encodeURIComponent(userEmail)}`, {
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

  // Guard clause: If the modal isn't open, render nothing.
  if (!open) {
    return null;
  }
  
  // THE PORTAL: This teleports the modal to the document body
  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Task Title</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-400"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter task description (optional)..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-white placeholder-slate-400"
            />
          </div>
          
          {/* Due Date */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between"
            >
              <span className={dueDate ? "text-white" : "text-slate-400"}>
                {dueDate ? dueDate.toLocaleDateString() : "Select due date"}
              </span>
              <FiCalendar className="w-5 h-5 text-slate-400" />
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 z-10"
                >
                  <DayPicker
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    classNames={dayPickerClassNames}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Priority */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                  <span className="text-white">{getPriorityLabel(priority)}</span>
                </div>
                <FiFlag className="w-5 h-5 text-slate-400" />
              </button>
              
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPriority(option.value);
                        setShowPriorityDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg text-white"
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

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={addTask}
            disabled={loading || !taskTitle.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>,
    document.body // This is the destination for the portal
  );
} 