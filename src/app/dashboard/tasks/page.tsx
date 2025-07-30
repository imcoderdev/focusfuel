"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiCheck, FiX, FiZap, FiPlus } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import Confetti from "react-confetti";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import React from "react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

type Task = {
  id: number;
  title: string;
  completed?: boolean;
  completedAt?: string | null;
  description?: string | null;
  dueDate?: string | Date | null;
  priority?: number | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [aiOrder, setAiOrder] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOrderApplied, setAiOrderApplied] = useState(false);
  const [confettiTaskId, setConfettiTaskId] = useState<number | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<number>(2); // 1=red, 2=orange, 3=blue
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Edit modal state
  const [showEditTask, setShowEditTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState<any>(null);

  const addTaskInputRef = useRef<HTMLInputElement>(null);
  const addTaskCardRef = useRef<HTMLDivElement>(null);
  // Ref for edit modal calendar popup
  const editCalendarRef = useRef<HTMLDivElement>(null);
  // Ref for add task modal calendar popup
  const addCalendarRef = useRef<HTMLDivElement>(null);

  // Autofocus input when card opens
  useEffect(() => {
    if (showAddTask && addTaskInputRef.current) {
      addTaskInputRef.current.focus();
    }
  }, [showAddTask]);

  // Close card when clicking outside
  useEffect(() => {
    if (!showAddTask) return;
    function handleClick(e: MouseEvent) {
      if (
        addTaskCardRef.current &&
        !addTaskCardRef.current.contains(e.target as Node)
      ) {
        setShowAddTask(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAddTask]);

  // Close add task modal calendar when clicking outside
  useEffect(() => {
    if (!showDatePicker) return;
    function handleClick(e: MouseEvent) {
      if (
        addCalendarRef.current &&
        !addCalendarRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDatePicker]);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Listen for task added event from layout
  useEffect(() => {
    const handleTaskAdded = () => {
      fetchTasks();
    };
    
    window.addEventListener('taskAdded', handleTaskAdded);
    return () => {
      window.removeEventListener('taskAdded', handleTaskAdded);
    };
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        toast.error(data.error || "Failed to load tasks");
      }
    } catch {
      toast.error("Failed to load tasks");
    }
    setLoading(false);
  }

  async function addTask() {
    if (!taskTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          dueDate: dueDate ? dueDate.toISOString() : null,
          priority,
        }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.id) {
        setTasks([data, ...tasks]);
        setTaskTitle("");
        setTaskDescription("");
        setDueDate(new Date());
        setPriority(2);
        setShowAddTask(false);
      } else {
        toast.error(data.error || "Failed to add task");
      }
    } catch {
      toast.error("Failed to add task");
    }
    setAdding(false);
  }

  function startEdit(id: number, title: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setEditTaskData({
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      priority: task.priority || 2,
      showDatePicker: false,
      showPriorityDropdown: false,
    });
    setShowEditTask(true);
  }

  async function saveEditTask() {
    if (!editTaskData.title.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/tasks/${editTaskData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTaskData.title,
          description: editTaskData.description,
          dueDate: editTaskData.dueDate ? editTaskData.dueDate.toISOString() : null,
          priority: editTaskData.priority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks => tasks.map(t => t.id === editTaskData.id ? {
          ...t,
          title: editTaskData.title,
          description: editTaskData.description,
          dueDate: editTaskData.dueDate,
          priority: editTaskData.priority,
        } : t));
        setShowEditTask(false);
        setEditTaskData(null);
      } else {
        toast.error(data.error || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    }
    setEditLoading(false);
  }

  async function deleteTask(id: number) {
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.filter(t => t.id !== id));
      } else {
        toast.error(data.error || "Failed to delete task");
      }
    } catch {
      toast.error("Failed to delete task");
    }
    setDeleteLoading(null);
  }

  function cancelEditTask() {
    setShowEditTask(false);
    setEditTaskData(null);
  }

  async function testGeminiApi() {
    setAiTestLoading(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/arrange-tasks", { method: "POST" });
      const data = await res.json();
      if (data.gemini) {
        toast.success("Gemini API Success! Check console for output.");
        setAiTestResult(JSON.stringify(data.gemini, null, 2));
        console.log("Gemini API Response:", data.gemini);
      } else {
        toast.error(data.error || "Gemini API Error");
        setAiTestResult(data.error || "Gemini API Error");
      }
    } catch (e) {
      toast.error("Gemini API Error");
      setAiTestResult("Gemini API Error");
    }
    setAiTestLoading(false);
  }

  async function planWithAI() {
    setAiLoading(true);
    setAiOrder(null);
    setAiOrderApplied(false);
    try {
      const res = await fetch("/api/arrange-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      const text = data.plan?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          toast.error("AI did not return valid JSON.");
          setAiLoading(false);
          return;
        }
        if (Array.isArray(parsed)) {
          setAiOrder(parsed);
          toast.success("AI plan received!");
        } else {
          toast.error("AI did not return a recognized format.");
        }
      } else {
        toast.error(data.error || "AI did not return a plan");
      }
    } catch {
      toast.error("Failed to get AI plan");
    }
    setAiLoading(false);
  }

  function applyAiOrder() {
    if (!aiOrder) return;
    // Robust match: trim and lowercase both sides
    const newTasks = aiOrder.map(title =>
      tasks.find(t => t.title.trim().toLowerCase() === title.trim().toLowerCase())
    ).filter(Boolean) as typeof tasks;
    setTasks(newTasks);
    setAiOrderApplied(true);
    toast.success("AI order applied to your tasks!");
  }

  async function toggleComplete(task: Task) {
    const newCompleted = !task.completed;
    if (newCompleted) {
      setConfettiTaskId(task.id);
      setTimeout(() => setConfettiTaskId(null), 2000);
    }
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks => tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null } : t));
        toast.success(newCompleted ? "Task completed! 🌱" : "Task marked as incomplete.");
      } else {
        toast.error(data.error || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    }
  }

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div
      className="content-s8f min-h-screen"
      data-empty-view="false"
      style={{
        background: '#fff',
        color: '#111',
        fontFamily: 'var(--reactist-font-family)',
        fontSize: 'var(--reactist-btn-font-size)',
        padding: 0,
        margin: 0,
      }}
    >
      <section className="section-6t8" style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div className="fc4-62z"></div>
        <div className="list-ysq" style={{ marginTop: 32 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#111' }}>Today</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--reactist-content-secondary)', fontSize: 16, marginBottom: 24 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, color: 'var(--reactist-content-secondary)' }}>&#10003;</span>
              {tasks.length === 1 ? '1 task' : `${tasks.length} tasks`}
            </span>
          </div>
          <ul className="item-ds6" style={{ margin: 0, padding: 0 }}>
            {/* Task List */}
            <AnimatePresence>
              {activeTasks.map((task, idx) => (
                <React.Fragment key={task.id}>
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="item-gdz"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, marginBottom: 32 }}
                  >
                    {/* Confetti on completion */}
                    {confettiTaskId === task.id && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <Confetti numberOfPieces={80} recycle={false} width={400} height={60} style={{ pointerEvents: "none" }} />
                      </div>
                    )}
                    <div className="item-dvi" style={{ border: 'none', background: 'transparent', alignItems: 'center', minHeight: 40 }}>
                      <div className="checkbox-a62 jIR-1xm" style={{ marginRight: 12 }}>
                        <motion.button
                          onClick={() => toggleComplete(task)}
                          className="l1F-2jf"
                          whileTap={{ scale: 1.2 }}
                          whileHover={{ scale: 1.1 }}
                          aria-label="Mark as completed"
                          disabled={task.completed}
                          style={{ background: task.completed ? 'var(--product-library-info-positive-secondary-idle-fill)' : 'transparent', border: '1px solid #ddd', width: 24, height: 24, minWidth: 24, minHeight: 24 }}
                        >
                          {task.completed ? (
                            <FiCheck className="text-green-600 text-lg" />
                          ) : null}
                        </motion.button>
                      </div>
                      <div className="content-4m8" style={{ flex: 1, minWidth: 0 }}>
                        <div className="content-58n" style={{ display: 'flex', flexDirection: 'column' }}>
                          <div className="content-d8w" style={{ fontSize: 16, color: '#111', fontWeight: 400 }}>{task.title}</div>
                          <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>
                            {task.description && task.description.trim() ? task.description : <span style={{ opacity: 0.5 }}>[No description]</span>}
                          </div>
                        </div>
                      </div>
                      <div className="item-1os" style={{ position: 'static', marginLeft: 8, display: 'flex', gap: 4 }}>
                        <>
                          <button
                            className="fa-8vb"
                            onClick={() => startEdit(task.id, task.title)}
                            disabled={deleteLoading === task.id}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="fa-8vb"
                            onClick={() => deleteTask(task.id)}
                            disabled={deleteLoading === task.id}
                          >
                            {deleteLoading === task.id ? <span className="animate-pulse">Deleting...</span> : <FiTrash2 />}
                          </button>
                        </>
                      </div>
                    </div>
                  </motion.li>
                  {idx < activeTasks.length - 1 && (
                    <li style={{ borderBottom: '1px solid #eee', margin: '0 0 16px 0' }}></li>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
            {/* Divider */}
            <li style={{ borderBottom: '1px solid #eee', margin: '16px 0' }}></li>
            {/* Add Task Button (Todoist style) */}
            <div style={{ position: 'relative' }}>
              {showAddTask && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    margin: '0 auto',
                    top: '-8px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    ref={addTaskCardRef}
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)',
                      border: '1px solid #eee',
                      padding: 16,
                      width: '100%',
                      maxWidth: 700,
                      position: 'relative',
                    }}
                  >
                    <input
                      ref={addTaskInputRef}
                      type="text"
                      placeholder="Send price list by Wed at 2pm"
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: 16,
                        fontWeight: 500,
                        border: 'none',
                        outline: 'none',
                        color: '#222',
                        marginBottom: 2,
                        background: 'transparent',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={taskDescription}
                      onChange={e => setTaskDescription(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: 15,
                        border: 'none',
                        outline: 'none',
                        color: '#888',
                        marginBottom: 10,
                        background: 'transparent',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      {/* Date Picker */}
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(s => !s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#f6fbf6', color: '#299c46', border: '1px solid #d3f0d3', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 15
                        }}
                      >
                        <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', border: '1px solid #299c46', marginRight: 4 }}></span>
                        {dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}
                      </button>
                      {/* Priority Selector */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setShowPriorityDropdown(s => !s)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#fafafa', color: '#888', border: '1px solid #eee', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 15
                          }}
                        >
                          <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: priority === 1 ? '#f87171' : priority === 2 ? '#fbbf24' : '#60a5fa', borderRadius: '50%', border: '1px solid #888', marginRight: 4 }}></span>
                          Priority
                        </button>
                        {showPriorityDropdown && (
                          <div style={{ position: 'absolute', top: 36, left: 0, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)', zIndex: 20, minWidth: 120 }}>
                            {[1, 2, 3].map(p => (
                              <button
                                key={p}
                                onClick={() => { setPriority(p); setShowPriorityDropdown(false); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: p === 1 ? '#f87171' : p === 2 ? '#fbbf24' : '#60a5fa', borderRadius: '50%', border: '1px solid #888' }}></span>
                                Priority {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Reminders Placeholder */}
                      <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fafafa', color: '#888', border: '1px solid #eee', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 15 }}>
                        <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 4, border: '1px solid #888', marginRight: 4 }}></span>
                        Reminders
                      </button>
                    </div>
                    {/* Date Picker Popup */}
                    {showDatePicker && (
                      <div
                        ref={addCalendarRef}
                        style={{ position: 'absolute', top: 60, left: 0, zIndex: 30, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)', padding: 8 }}
                      >
                        <DayPicker
                          mode="single"
                          selected={dueDate}
                          onSelect={date => {
                            setDueDate(date);
                            setShowDatePicker(false);
                          }}
                          showOutsideDays
                          fixedWeeks
                        />
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #eee', margin: '10px 0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ color: '#888', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '1px solid #eee', borderRadius: 4, width: 24, height: 24, marginRight: 4 }}>
                          <svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="3" fill="#fff" stroke="#bbb" strokeWidth="1.5"/><rect x="5" y="5" width="8" height="8" rx="2" fill="#e5e5e5"/></svg>
                        </span>
                        Inbox ▼
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setShowAddTask(false)}
                        style={{ background: '#f6f6f6', color: '#888', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
                        disabled={adding}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addTask}
                        style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
                        disabled={adding || !taskTitle.trim()}
                      >
                        {adding ? 'Adding...' : 'Add task'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              <li style={{ marginLeft: 0, paddingLeft: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowAddTask(true)}
                  disabled={adding}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <FiPlus style={{ color: '#d1453b', fontSize: 24, marginRight: 8 }} />
                  <span style={{ color: '#888', fontSize: 18, fontWeight: 400, lineHeight: 1 }}>Add task</span>
                </button>
              </li>
            </div>
          </ul>
          {completedTasks.length > 0 && (
            <div className="w-full mt-4">
              <h2 className="text-green-700 font-bold mb-2 text-lg">Completed Tasks</h2>
              <ul className="flex flex-col gap-2">
                {completedTasks.map(task => (
                  <li key={task.id} className="flex items-center gap-3 bg-white/70 border border-green-100 rounded-lg px-4 py-2 shadow-sm opacity-70 line-through">
                    <motion.button
                      onClick={() => toggleComplete(task)}
                      className={`w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center mr-2 bg-white/80 shadow cursor-pointer ${task.completed ? "bg-green-100" : ""}`}
                      whileTap={{ scale: 1.2 }}
                      whileHover={{ scale: 1.1, boxShadow: "0 4px 16px 0 #bbf7d0" }}
                      aria-label="Mark as incomplete"
                      disabled={false}
                    >
                      {!task.completed ? null : <FiCheck className="text-green-600 text-lg" />}
                    </motion.button>
                    <span className="flex-1 text-green-900">{task.title}</span>
                    {task.completedAt && <span className="text-xs text-gray-500 ml-2">{new Date(task.completedAt).toLocaleString()}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      {/* Edit Task Modal */}
      {showEditTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px 0 #0002', padding: 32, minWidth: 340, maxWidth: 400, width: '100%' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#111', textAlign: 'center' }}>Edit Task</h2>
            <input
              type="text"
              placeholder="Task title"
              value={editTaskData.title}
              onChange={e => setEditTaskData((prev: any) => ({ ...prev, title: e.target.value }))}
              style={{ width: '100%', fontSize: 16, fontWeight: 500, border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 10, color: '#222' }}
              autoFocus
              disabled={editLoading}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={editTaskData.description}
              onChange={e => setEditTaskData((prev: any) => ({ ...prev, description: e.target.value }))}
              style={{ width: '100%', fontSize: 15, border: '1px solid #eee', borderRadius: 8, padding: '8px 14px', marginBottom: 10, color: '#888' }}
              disabled={editLoading}
            />
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              {/* Date Picker */}
              <button
                type="button"
                onClick={() => setEditTaskData((prev: any) => ({ ...prev, showDatePicker: !prev.showDatePicker }))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f6fbf6', color: '#299c46', border: '1px solid #d3f0d3', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 15 }}
                disabled={editLoading}
              >
                <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', border: '1px solid #299c46', marginRight: 4 }}></span>
                {editTaskData.dueDate ? new Date(editTaskData.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}
              </button>
              {/* Priority Selector */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setEditTaskData((prev: any) => ({ ...prev, showPriorityDropdown: !prev.showPriorityDropdown }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fafafa', color: '#888', border: '1px solid #eee', borderRadius: 6, padding: '4px 12px', fontWeight: 500, fontSize: 15 }}
                  disabled={editLoading}
                >
                  <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: editTaskData.priority === 1 ? '#f87171' : editTaskData.priority === 2 ? '#fbbf24' : '#60a5fa', borderRadius: '50%', border: '1px solid #888', marginRight: 4 }}></span>
                  Priority
                </button>
                {editTaskData.showPriorityDropdown && (
                  <div style={{ position: 'absolute', top: 36, left: 0, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)', zIndex: 20, minWidth: 120 }}>
                    {[1, 2, 3].map(p => (
                      <button
                        key={p}
                        onClick={() => setEditTaskData((prev: any) => ({ ...prev, priority: p, showPriorityDropdown: false }))}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
                        disabled={editLoading}
                      >
                        <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: p === 1 ? '#f87171' : p === 2 ? '#fbbf24' : '#60a5fa', borderRadius: '50%', border: '1px solid #888' }}></span>
                        Priority {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Calendar popup to the right of modal */}
            {editTaskData.showDatePicker && (
              <div
                ref={editCalendarRef}
                style={{ position: 'absolute', top: 0, left: '100%', marginLeft: 32, zIndex: 1050, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px 0 rgba(60,60,60,0.08)', padding: 8, minWidth: 260 }}
              >
                <DayPicker
                  mode="single"
                  selected={editTaskData.dueDate}
                  onSelect={date => {
                    setEditTaskData((prev: any) => ({ ...prev, dueDate: date, showDatePicker: false }));
                  }}
                  showOutsideDays
                  fixedWeeks
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                onClick={cancelEditTask}
                style={{ background: '#f6f6f6', color: '#888', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                onClick={saveEditTask}
                style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
                disabled={editLoading || !editTaskData.title.trim()}
              >
                {editLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* The rest of the controls (AI, Gemini) can be placed below or in a sidebar as needed */}
      <div style={{ maxWidth: 700, margin: '32px auto 0', width: '100%' }}>
        <motion.button
          onClick={planWithAI}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold shadow hover:bg-emerald-700 transition-colors text-lg cursor-pointer"
          whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #bbf7d0" }}
          whileTap={{ scale: 0.97 }}
          disabled={tasks.length === 0 || aiLoading}
        >
          {aiLoading ? "Planning..." : <><FiZap className="text-xl" /> Plan with AI</>}
        </motion.button>
        {aiOrder && (
          <div className="mt-6 w-full bg-green-50 border border-green-200 rounded-lg p-4 shadow text-green-900">
            <h2 className="font-bold mb-2 text-green-800">AI Suggested Task Order:</h2>
            <ol className="list-decimal list-inside">
              {aiOrder.map((title, i) => (
                <li key={i} className="mb-1">{title}</li>
              ))}
            </ol>
            <motion.button
              onClick={applyAiOrder}
              className="mt-4 px-4 py-2 rounded-lg bg-green-700 text-white font-bold shadow hover:bg-green-800 transition-colors cursor-pointer"
              whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #bbf7d0" }}
              whileTap={{ scale: 0.97 }}
              disabled={aiOrderApplied}
            >
              {aiOrderApplied ? "AI Order Applied" : "Apply AI Order"}
            </motion.button>
          </div>
        )}
        {aiPlan && (
          <div className="mt-6 w-full bg-green-50 border border-green-200 rounded-lg p-4 shadow text-green-900 whitespace-pre-line">
            <h2 className="font-bold mb-2 text-green-800">AI Raw Output:</h2>
            {aiPlan}
          </div>
        )}
        <motion.button
          onClick={testGeminiApi}
          className="mt-8 px-6 py-3 rounded-lg bg-blue-900 text-white font-bold shadow hover:bg-blue-800 transition-colors text-lg cursor-pointer"
          whileHover={{ scale: 1.08, boxShadow: "0 8px 32px 0 #bbf7d0" }}
          whileTap={{ scale: 0.97 }}
          disabled={aiTestLoading}
        >
          {aiTestLoading ? "Testing Gemini API..." : "Test Gemini API"}
        </motion.button>
        {aiTestResult && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs max-w-full overflow-x-auto text-gray-800 border border-gray-200">
            {aiTestResult}
          </pre>
        )}
      </div>
    </div>
  );
} 