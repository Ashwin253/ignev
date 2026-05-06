"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Phone, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

export default function MISLogin() {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({ mobile: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formData.mobile, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Login failed.");
      }

      window.location.href = "/team";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-10 rounded-[32px] relative border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 blur-[60px] -ml-16 -mb-16" />

          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-linear-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg -rotate-3">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                MIS <span className="text-gradient">Portal</span>
              </h1>
              <p className="text-white/50 text-sm">Management Information System Access</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Mobile */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                  Mobile Number / ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/10 text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/10 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-white/30 text-sm">
                Need an account?{" "}
                <a href="#" className="text-primary font-semibold hover:underline">
                  Contact Admin
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-white/20 text-xs uppercase tracking-[0.2em]">
          Secure Infrastructure &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
