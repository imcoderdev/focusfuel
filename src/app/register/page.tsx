"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";
import { Inter } from "next/font/google";
import { signIn } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const [confettiSize, setConfettiSize] = useState({ width: 300, height: 300 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConfettiSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    toast.dismiss();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.firstName + " " + form.lastName,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setCodeSent(true);
        toast.success("User registered successfully!");
        // Auto-login after successful registration
        const loginRes = await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        });
        if (loginRes && !loginRes.error) {
          router.push("/dashboard");
        } else {
          toast.error("Auto-login failed. Please sign in manually.");
          router.push("/login");
        }
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      setLoading(false);
      toast.error("Registration failed");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Toaster position="top-center" />
      <AnimatePresence>
        {codeSent && (
          <Confetti
            width={confettiSize.width}
            height={confettiSize.height}
            recycle={false}
            numberOfPieces={120}
            colors={["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"]}
          />
        )}
      </AnimatePresence>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div style={{
          background: "var(--reactist-bg-aside)",
          color: "#111",
          borderRadius: 28,
          padding: 40,
          minWidth: 380,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 32px 0 #0002",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, color: "#111", textAlign: "center" }}>Sign up</h1>
          <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="firstName" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: "block", color: "#111" }}>First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Your first name"
                  value={form.firstName}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #e6e6e6",
                    background: "#fff",
                    color: "#111",
                    fontSize: 16,
                    marginBottom: 0
                  }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="lastName" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: "block", color: "#111" }}>Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Your last name"
                  value={form.lastName}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #e6e6e6",
                    background: "#fff",
                    color: "#111",
                    fontSize: 16,
                    marginBottom: 0
                  }}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: "block", color: "#111" }}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Your email address"
                value={form.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #e6e6e6",
                  background: "#fff",
                  color: "#111",
                  fontSize: 16
                }}
                required
              />
            </div>
            <div>
              <label htmlFor="password" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: "block", color: "#111" }}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #e6e6e6",
                  background: "#fff",
                  color: "#111",
                  fontSize: 16
                }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#fff",
                color: "#111",
                fontWeight: 700,
                fontSize: 18,
                border: "none",
                borderRadius: 14,
                padding: "14px 0",
                marginTop: 10,
                marginBottom: 10,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s, color 0.2s"
              }}
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>
          <div style={{ width: "100%", textAlign: "center", margin: "18px 0 10px 0", color: "#888", fontWeight: 600, fontSize: 15 }}>
            <span style={{ display: "inline-block", width: 40, borderBottom: "1px solid #e6e6e6", marginRight: 8, verticalAlign: "middle" }}></span>
            OR
            <span style={{ display: "inline-block", width: 40, borderBottom: "1px solid #e6e6e6", marginLeft: 8, verticalAlign: "middle" }}></span>
          </div>
          <button style={{ width: "100%", background: "#fff", color: "#111", borderRadius: 10, fontWeight: 700, fontSize: 17, padding: "12px 0", marginBottom: 10, border: "1px solid #e6e6e6", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>🌐</span> Continue with Google
          </button>
          <button style={{ width: "100%", background: "#fff", color: "#111", borderRadius: 10, fontWeight: 700, fontSize: 17, padding: "12px 0", marginBottom: 10, border: "1px solid #e6e6e6", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>🐙</span> Continue with GitHub
          </button>
          <div style={{ marginTop: 18, color: "#888", fontSize: 15, textAlign: "center" }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: "#111", textDecoration: "underline", fontWeight: 600 }}>Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bonsai loader animation (inline SVG, scales from 0 to 1)
function BonsaiLoader() {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="inline-block"
      style={{ willChange: "transform" }}
    >
      <ellipse cx="32" cy="56" rx="16" ry="4" fill="#a7f3d0" />
      <rect x="29" y="32" width="6" height="18" rx="3" fill="#4ade80" />
      <circle cx="32" cy="28" r="10" fill="#22c55e" />
      <ellipse cx="32" cy="22" rx="6" ry="3" fill="#16a34a" />
      <ellipse cx="38" cy="30" rx="4" ry="2" fill="#16a34a" />
      <ellipse cx="26" cy="30" rx="4" ry="2" fill="#16a34a" />
    </motion.svg>
  );
} 