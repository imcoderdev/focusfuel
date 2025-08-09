"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSend, FiMessageSquare } from "react-icons/fi";
import { useSupabaseAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";

interface ParentalReportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ParentalReportModal({ open, onClose }: ParentalReportModalProps) {
  const { user } = useSupabaseAuth();
  const [chatId, setChatId] = useState("");
  const [reportsEnabled, setReportsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const saveSettings = async () => {
    if (!user?.email || !chatId.trim()) {
      toast.error("Please enter a valid Chat ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/parent-settings?userEmail=${encodeURIComponent(user.email)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId.trim(),
          reportsEnabled: reportsEnabled,
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
        onClose();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!chatId.trim()) {
      toast.error("Please enter a Chat ID first");
      return;
    }

    if (!user?.email) {
      toast.error("User not authenticated");
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch(`/api/send-telegram-update?userEmail=${encodeURIComponent(user.email)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isTest: true,
        }),
      });

      if (response.ok) {
        toast.success("Test message sent! Check your Telegram.");
      } else {
        toast.error("Failed to send test message");
      }
    } catch (error) {
      toast.error("Error sending test message");
    } finally {
      setTestLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Automated Weekly Reports via Telegram</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
            <li>Open Telegram and find the bot: <strong>@userinfobot</strong>.</li>
            <li>Tap 'Start' to get your unique Chat ID, then copy it.</li>
            <li>Paste your Chat ID in the field below and save your settings.</li>
            <li>Next, search for <strong>@FocusFuelCoachbot</strong>, tap 'Start', and then click 'Send Report' below.</li>
                        </ol>
          </div>

          {/* Chat ID Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Parent Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-400"
            />
          </div>

          {/* Enable Reports Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Enable Weekly Reports</span>
            <button
              onClick={() => setReportsEnabled(!reportsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                reportsEnabled ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reportsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={saveSettings}
              disabled={loading || !chatId.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Save Settings</span>
                </>
              )}
            </button>
            <button
              onClick={sendTestMessage}
              disabled={testLoading || !chatId.trim()}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  <span>Send Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
