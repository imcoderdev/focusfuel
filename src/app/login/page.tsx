"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid email or password.");
    } else {
      setSuccess(true);
      toast.success("Login successful!");
      setTimeout(() => {
        setSuccess(false);
        router.push("/dashboard");
      }, 2000);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} className={inter.className}>
      <Toaster position="top-center" />
      {success && (
        <Confetti
          width={confettiSize.width}
          height={confettiSize.height}
          recycle={false}
          numberOfPieces={120}
          colors={["#22c55e", "#16a34a", "#4ade80", "#a7f3d0"]}
        />
      )}
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
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, color: "#111", textAlign: "center" }}>Sign in</h1>
          <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
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
                placeholder="Enter your password"
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
              {loading ? "Signing in..." : "Sign in"}
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
            Don&apos;t have an account?{' '}
            <a href="/register" style={{ color: "#111", textDecoration: "underline", fontWeight: 600 }}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
} 