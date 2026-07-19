"use client";

import React, { useEffect, useState } from "react";
import { X, User, Mail, Lock, Phone, MapPin, LogOut, CheckCircle2, UserPlus, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseClient } from "../lib/supabase-client";

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthProfileModal({ isOpen, onClose }: AuthProfileModalProps) {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    // Sync current session user
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setFullName(data.user.user_metadata?.full_name || "");
        setMobile(data.user.user_metadata?.phone || "");
        setCity(data.user.user_metadata?.city || "");
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFullName(session.user.user_metadata?.full_name || "");
        setMobile(session.user.user_metadata?.phone || "");
        setCity(session.user.user_metadata?.city || "");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Logged in successfully!");
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: mobile,
            city: city,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Registration complete! Check your email for verification link if required.");
        // Clear fields
        setPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabaseClient.auth.updateUser({
        data: {
          full_name: fullName,
          phone: mobile,
          city: city,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Profile updated successfully!");
        setTimeout(() => {
          setSuccessMsg("");
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-2xl text-zinc-900"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-zinc-100 p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {user ? (
            /* Logged In: Edit Profile Panel */
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
                  <User className="text-emerald-600" size={24} /> Edit Profile
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Update your contact details and registered location settings.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-zinc-600">Email Address (Read-only)</span>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-zinc-600">Full Name</span>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                    <User size={16} className="text-zinc-400" />
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <Phone size={16} className="text-zinc-400" />
                      <input
                        type="tel"
                        name="mobile"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="9876543210"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">City / State</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <MapPin size={16} className="text-zinc-400" />
                      <input
                        type="text"
                        name="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Logged Out: Auth Tabs */
            <div className="space-y-6">
              {/* Tab headers */}
              <div className="flex border-b border-zinc-100">
                <button
                  onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                    activeTab === "login"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => { setActiveTab("signup"); setErrorMsg(""); }}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 transition cursor-pointer ${
                    activeTab === "signup"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {activeTab === "login" ? (
                /* Login form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Email Address</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <Mail size={16} className="text-zinc-400" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Password</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <Lock size={16} className="text-zinc-400" />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 mt-6"
                  >
                    {loading ? "Authenticating..." : "Log In"}
                  </button>
                </form>
              ) : (
                /* Sign up form */
                <form onSubmit={handleSignUp} className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Full Name</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <User size={16} className="text-zinc-400" />
                      <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Email Address</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <Mail size={16} className="text-zinc-400" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <Phone size={16} className="text-zinc-400" />
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="9876543210"
                          className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-zinc-600">City</span>
                      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <MapPin size={16} className="text-zinc-400" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Pune"
                          className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold text-zinc-600">Password</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                      <Lock size={16} className="text-zinc-400" />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 mt-6"
                  >
                    {loading ? "Registering..." : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
