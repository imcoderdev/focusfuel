"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { FiEdit2, FiLogOut, FiCheck, FiUpload, FiArrowLeft, FiBarChart2, FiList, FiHome } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

const bonsaiSvg = (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <ellipse cx="32" cy="56" rx="18" ry="4" fill="#a7f3d0" />
    <rect x="28" y="36" width="8" height="20" rx="4" fill="#78350f" />
    <circle cx="32" cy="28" r="14" fill="#22c55e" />
    <circle cx="40" cy="20" r="7" fill="#16a34a" />
    <circle cx="24" cy="18" r="6" fill="#4ade80" />
  </svg>
);

function getMoodLabel(score) {
  if (score >= 4.5) return "😊 Happy";
  if (score >= 3.5) return "😌 Good";
  if (score >= 2.5) return "😐 Meh";
  if (score >= 1.5) return "😔 Low";
  return "😢 Sad";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef();

  useEffect(() => {
    fetch("/api/progress/profile").then(r => r.json()).then(data => {
      setProfile(data);
      setForm({ name: data.name || "", email: data.email || "", image: data.image || "" });
    });
  }, []);

  function handleEdit() {
    setEdit(true);
  }
  function handleCancel() {
    setEdit(false);
    setForm({ name: profile.name || "", email: profile.email || "", image: profile.image || "" });
    setImageFile(null);
  }
  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleImage(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setForm(f => ({ ...f, image: ev.target.result }));
      reader.readAsDataURL(file);
    }
  }
  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    const body = { name: form.name, email: form.email, image: form.image };
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Profile updated!");
      setEdit(false);
      setProfile(p => ({ ...p, ...body }));
    } else {
      toast.error("Failed to update profile");
    }
  }
  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  // Bonsai grows from 0.5 to 1.5 scale over 10+ hours
  const bonsaiScale = profile && profile.totalFocusTime ? Math.min(0.5 + profile.totalFocusTime / 10, 1.5) : 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={inter.className + " min-h-screen flex flex-col items-center justify-center p-4"}
      style={{ background: '#fff' }}
    >
      <Toaster position="top-center" />
      <div className="max-w-2xl w-full bg-white/70 backdrop-blur-md rounded-3xl shadow-xl p-8 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="relative group">
            <motion.div
              className="rounded-full overflow-hidden border-4 border-green-300 shadow-lg bg-green-100 w-32 h-32 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              whileHover={{ scale: 1.08 }}
              onClick={() => edit && fileInput.current && fileInput.current.click()}
            >
              {form.image ? (
                <Image src={form.image} alt="Profile" width={128} height={128} className="object-cover w-32 h-32" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-green-700 text-5xl bg-green-50">👤</div>
              )}
              {edit && (
                <div className="absolute bottom-2 right-2 bg-green-200 rounded-full p-2 shadow">
                  <FiUpload className="text-green-700 text-xl" />
                </div>
              )}
            </motion.div>
            {edit && <input type="file" accept="image/*" ref={fileInput} className="hidden" onChange={handleImage} />}
          </div>
          {!edit ? (
            <>
              <h2 className="text-2xl font-bold text-green-900 mt-2">{profile?.name}</h2>
              <p className="text-green-800">{profile?.email}</p>
            </>
          ) : (
            <form className="flex flex-col items-center gap-2 mt-2 w-full" onSubmit={handleSave}>
              <input name="name" value={form.name} onChange={handleChange} className="rounded-lg px-3 py-2 border border-green-200 w-full focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Name" />
              <input name="email" value={form.email} onChange={handleChange} className="rounded-lg px-3 py-2 border border-green-200 w-full focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Email" />
              <button type="submit" className="mt-2 bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow hover:scale-105 transition-transform" disabled={loading}>{loading ? "Saving..." : <><FiCheck className="inline mr-1" />Save</>}</button>
              <button type="button" className="text-green-700 mt-1 hover:underline" onClick={handleCancel}>Cancel</button>
            </form>
          )}
          <div className="flex gap-2 mt-2">
            {!edit && <button className="bg-green-200 text-green-900 px-4 py-1 rounded-lg font-semibold shadow hover:scale-105 transition-transform flex items-center gap-1" onClick={handleEdit}><FiEdit2 />Edit Profile</button>}
            <button className="bg-green-100 text-green-700 px-4 py-1 rounded-lg font-semibold shadow hover:scale-105 transition-transform flex items-center gap-1" onClick={handleLogout}><FiLogOut />Logout</button>
          </div>
        </div>
        <div className="w-full flex flex-col sm:flex-row gap-6 items-center justify-between">
          <motion.div
            className="w-32 h-32 flex items-end justify-center"
            initial={{ scale: 0.5 }}
            animate={{ scale: bonsaiScale }}
            transition={{ duration: 1, type: "spring" }}
          >
            {bonsaiSvg}
          </motion.div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <motion.div className="bg-green-50 rounded-xl p-4 shadow flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-green-800">{profile?.bonsais ?? "-"}</span>
              <span className="text-green-700 text-sm mt-1">Bonsais Grown</span>
            </motion.div>
            <motion.div className="bg-green-50 rounded-xl p-4 shadow flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-green-800">{profile?.totalFocusTime?.toFixed(1) ?? "-"}</span>
              <span className="text-green-700 text-sm mt-1">Total Focus (hrs)</span>
            </motion.div>
            <motion.div className="bg-green-50 rounded-xl p-4 shadow flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-green-800">{profile?.completedTasks ?? "-"}</span>
              <span className="text-green-700 text-sm mt-1">Tasks Completed</span>
            </motion.div>
            <motion.div className="bg-green-50 rounded-xl p-4 shadow flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-green-800">{profile?.averageMoodScore ? profile.averageMoodScore.toFixed(1) : "-"}</span>
              <span className="text-green-700 text-sm mt-1">Mood Avg</span>
              <span className="text-green-600 text-xs mt-1">{profile?.averageMoodScore ? getMoodLabel(profile.averageMoodScore) : ""}</span>
            </motion.div>
          </div>
        </div>
        <div className="flex gap-4 mt-6 w-full justify-center">
          <Link href="/dashboard" className="bg-green-200 text-green-900 px-4 py-2 rounded-xl font-bold shadow hover:scale-105 transition-transform flex items-center gap-2"><FiHome />Dashboard</Link>
          <Link href="/dashboard/tasks" className="bg-green-200 text-green-900 px-4 py-2 rounded-xl font-bold shadow hover:scale-105 transition-transform flex items-center gap-2"><FiList />Tasks</Link>
          <Link href="/dashboard/progress" className="bg-green-200 text-green-900 px-4 py-2 rounded-xl font-bold shadow hover:scale-105 transition-transform flex items-center gap-2"><FiBarChart2 />Progress</Link>
        </div>
      </div>
    </motion.div>
  );
} 