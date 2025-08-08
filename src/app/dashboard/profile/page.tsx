"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { FiEdit2, FiLogOut, FiCheck, FiUpload } from "react-icons/fi";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";

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

function getMoodLabel(score: number): string {
  if (score >= 4.5) return "😊 Happy";
  if (score >= 3.5) return "😌 Good";
  if (score >= 2.5) return "😐 Meh";
  if (score >= 1.5) return "😔 Low";
  return "😢 Sad";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      // Get user email from client-side auth
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("Please log in to view profile");
        return;
      }

      try {
        // Fetch user profile and progress data
        const [profileRes, progressRes] = await Promise.all([
          fetch(`/api/user/profile-final?userEmail=${encodeURIComponent(user.email)}`),
          fetch(`/api/progress/profile-final?userEmail=${encodeURIComponent(user.email)}`)
        ]);
        
        const profileData = await profileRes.json();
        const progressData = await progressRes.json();
        
        const combinedData = {
          ...profileData,
          bonsais: progressData.bonsais || 0,
          totalFocusTimeMinutes: progressData.totalFocusTimeMinutes || 0,
          completedTasks: progressData.completedTasks || 0,
          averageMood: progressData.averageMood || 3
        };
        
        setProfile(combinedData);
        setForm({ 
          name: profileData.name || "", 
          email: profileData.email || "", 
          image: profileData.image || profileData.avatar_url || "" 
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
      }
    }
    
    fetchProfile();
  }, []);

  function handleEdit() {
    setEdit(true);
  }
  function handleCancel() {
    setEdit(false);
    setForm({ 
      name: profile?.name || "", 
      email: profile?.email || "", 
      image: profile?.image || profile?.avatar_url || "" 
    });
    setImageFile(null);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setForm(f => ({ ...f, image: result }));
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Get user email from client-side auth
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast.error("Please log in to update profile");
      setLoading(false);
      return;
    }
    
    const body = { 
      name: form.name, 
      email: form.email, 
      image: form.image,
      userEmail: user.email 
    };
    
    const res = await fetch("/api/user/profile-final", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      const updatedProfile = await res.json();
      toast.success("Profile updated!");
      setEdit(false);
      // Update the profile state with the new data
      setProfile((p: any) => ({ 
        ...p, 
        name: updatedProfile.name,
        email: updatedProfile.email,
        image: updatedProfile.image || updatedProfile.avatar_url,
        avatar_url: updatedProfile.avatar_url 
      }));
      // Update form state as well
      setForm({
        name: updatedProfile.name || "",
        email: updatedProfile.email || "",
        image: updatedProfile.image || updatedProfile.avatar_url || ""
      });
      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } else {
      const errorData = await res.json();
      console.error("Profile update error:", errorData);
      toast.error("Failed to update profile");
    }
  }
  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  // Bonsai grows from 0.5 to 1.5 scale over 10+ hours
  const bonsaiScale = profile && profile.totalFocusTimeMinutes ? Math.min(0.5 + (profile.totalFocusTimeMinutes / 60) / 10, 1.5) : 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={inter.className + " min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4"}
    >
      <Toaster position="top-center" />
      <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="relative group">
            <motion.div
              className="rounded-full overflow-hidden border-4 border-emerald-500/50 shadow-lg bg-slate-700 w-32 h-32 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              whileHover={{ scale: 1.08 }}
              onClick={() => edit && fileInput.current && fileInput.current.click()}
            >
              {form.image ? (
                <Image src={form.image} alt="Profile" width={128} height={128} className="object-cover w-32 h-32" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-emerald-400 text-5xl bg-slate-700">👤</div>
              )}
              {edit && (
                <div className="absolute bottom-2 right-2 bg-emerald-600 rounded-full p-2 shadow">
                  <FiUpload className="text-white text-xl" />
                </div>
              )}
            </motion.div>
            {edit && <input type="file" accept="image/*" ref={fileInput} className="hidden" onChange={handleImage} />}
          </div>
          {!edit ? (
            <>
              <h2 className="text-2xl font-bold text-white mt-2">{profile?.name}</h2>
              <p className="text-slate-400">{profile?.email}</p>
            </>
          ) : (
            <form className="flex flex-col items-center gap-2 mt-2 w-full" onSubmit={handleSave}>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="rounded-lg px-3 py-2 border border-slate-600 bg-slate-700 text-white w-full focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                placeholder="Name" 
              />
              <input 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                className="rounded-lg px-3 py-2 border border-slate-600 bg-slate-700 text-white w-full focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                placeholder="Email" 
              />
              <button type="submit" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold shadow hover:scale-105 transition-all" disabled={loading}>{loading ? "Saving..." : <><FiCheck className="inline mr-1" />Save</>}</button>
              <button type="button" className="text-slate-400 hover:text-white mt-1 hover:underline" onClick={handleCancel}>Cancel</button>
            </form>
          )}
          <div className="flex gap-2 mt-2">
            {!edit && <button className="border border-slate-600 hover:bg-slate-700 text-slate-300 px-4 py-1 rounded-lg font-semibold shadow hover:scale-105 transition-all flex items-center gap-1" onClick={handleEdit}><FiEdit2 />Edit Profile</button>}
            <button className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 px-4 py-1 rounded-lg font-semibold hover:scale-105 transition-all flex items-center gap-1" onClick={handleLogout}><FiLogOut />Logout</button>
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
            <motion.div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-white">{profile?.bonsais ?? "-"}</span>
              <span className="text-slate-400 text-sm mt-1">Bonsais Grown</span>
            </motion.div>
            <motion.div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-white">{profile?.totalFocusTimeMinutes ? (profile.totalFocusTimeMinutes / 60).toFixed(1) : "-"}</span>
              <span className="text-slate-400 text-sm mt-1">Total Focus (hrs)</span>
            </motion.div>
            <motion.div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-white">{profile?.completedTasks ?? "-"}</span>
              <span className="text-slate-400 text-sm mt-1">Tasks Completed</span>
            </motion.div>
            <motion.div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center hover:scale-105 transition-transform" whileHover={{ scale: 1.08 }}>
              <span className="text-2xl font-bold text-white">{profile?.averageMood ? profile.averageMood.toFixed(1) : "-"}</span>
              <span className="text-slate-400 text-sm mt-1">Mood Avg</span>
              <span className="text-emerald-400 text-xs mt-1">{profile?.averageMood ? getMoodLabel(profile.averageMood) : ""}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 