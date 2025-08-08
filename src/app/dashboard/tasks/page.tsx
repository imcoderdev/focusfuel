"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { FiZap, FiPlus, FiStar } from "react-icons/fi";
import { useSupabaseAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "./AddTaskModal";
import toast from "react-hot-toast";

type Task = {
  id: string;
  title: string;
  completed?: boolean;
  completedAt?: string | null;
  description?: string | null;
  dueDate?: string | Date | null;
  priority?: 'High' | 'Medium' | 'Low';
};

export default function TasksPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiPlanning, setAiPlanning] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch tasks on component mount
  useEffect(() => {
    if (user?.email) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/tasks?userEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json();
        // Convert backend task format to frontend format
        const formattedTasks = data.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          completed: task.completed || false,
          completedAt: task.completedAt,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : task.priority === 3 ? 'Low' : 'Medium'
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  // Magic Sort AI Planning
  const planWithAI = async () => {
    if (incompleteTasks.length === 0) {
      toast.error("No tasks to plan!");
      return;
    }

    setAiPlanning(true);
    try {
      // Convert tasks to the format expected by the AI endpoint
      const aiTaskFormat = incompleteTasks.map(task => ({
        id: task.id,
        text: task.title,
        completed: task.completed || false,
        priority: task.priority || 'Medium'
      }));

      const response = await fetch("/api/tasks/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: aiTaskFormat }),
      });

      if (!response.ok) {
        throw new Error("Failed to plan tasks");
      }

      const result = await response.json();
      
      // Convert AI response back to our task format and merge with completed tasks
      const sortedIncompleteTasks = result.sortedTasks.map((aiTask: any) => {
        const originalTask = tasks.find(t => t.id === aiTask.id);
        return originalTask || aiTask;
      });

      // Update tasks state with new order (Magic Sort animation will handle the rest!)
      setTasks([...sortedIncompleteTasks, ...completedTasks]);
      
      toast.success("🎯 Tasks optimized by AI!", {
        icon: "✨",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error planning tasks:", error);
      toast.error("Failed to plan tasks");
    } finally {
      setAiPlanning(false);
    }
  };

  const toggleComplete = async (taskId: string) => {
    if (!user?.email) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}?userEmail=${encodeURIComponent(user.email)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
            : t
        ));
        toast.success(task.completed ? "Task reopened!" : "Task completed! 🎉");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleEdit = (task: Task) => {
    // TODO: Implement edit functionality
    toast("Edit functionality coming soon!", { icon: "🔧" });
  };

  const handleDelete = async (taskId: string) => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}?userEmail=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success("Task deleted!");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                AI Task Planner
              </h1>
              <p className="text-slate-400 mt-2">
                Let AI optimize your workflow for maximum productivity
              </p>
            </div>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="bg-transparent border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors rounded-lg px-6 py-3 font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="w-5 h-5" />
              Add Task
            </motion.button>
          </div>

          {/* AI Planning Button */}
          {incompleteTasks.length > 0 && (
            <motion.button
              onClick={planWithAI}
              disabled={aiPlanning}
              className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl ${aiPlanning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              whileHover={!aiPlanning ? { scale: 1.02 } : {}}
              whileTap={!aiPlanning ? { scale: 0.98 } : {}}
            >
              {aiPlanning ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Planning... ✨</span>
                </>
              ) : (
                <>
                  <FiZap className="w-6 h-6" />
                  <span>Magic Sort with AI</span>
                  <FiStar className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-8">
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Active Tasks ({incompleteTasks.length})
              </h2>
              <Reorder.Group
                axis="y"
                values={incompleteTasks}
                onReorder={(newOrder) => {
                  setTasks([...newOrder, ...completedTasks]);
                }}
                className="space-y-3"
              >
                {incompleteTasks.map((task) => (
                  <Reorder.Item
                    key={task.id}
                    value={task}
                    id={task.id}
                    className="w-full"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0}
                  >
                    <TaskCard
                      task={task}
                      onToggleComplete={toggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <FiStar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">No active tasks</h3>
              <p className="text-slate-400 mb-6">Create your first task to get started with AI planning</p>
              <motion.button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Task
              </motion.button>
            </motion.div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Completed ({completedTasks.length})
              </h2>
              <div className="space-y-3 opacity-70">
                <AnimatePresence>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskAdded={fetchTasks}
        userEmail={user?.email}
      />
    </div>
  );
}
