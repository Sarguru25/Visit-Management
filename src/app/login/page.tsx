"use client";
import { API_BASE } from "@/lib/api";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const role = json.data.user.role;
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/30 blur-3xl mix-blend-multiply animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-400/30 blur-3xl mix-blend-multiply animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 rounded-full bg-violet-300/20 blur-3xl mix-blend-multiply animate-pulse" style={{ animationDelay: "4s" }} />

      <div className="relative w-full max-w-md bg-white/70 p-8 sm:p-10 rounded-[2.5rem] border border-white/80 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        {/* Header Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/40 text-white font-extrabold text-3xl mb-5 ring-4 ring-white/50">
            SV
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Sales Visit Pro</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Enterprise Field Sales & Visit Intelligence</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-100/80 text-rose-600 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:bg-white shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/80 border border-slate-200/80 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:bg-white shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center space-x-2 group disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Encrypted JWT Authentication Session
        </div>
      </div>
    </div>
  );
}
