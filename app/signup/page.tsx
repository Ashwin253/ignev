"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Phone, MapPin, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "../lib/supabase-client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/profile");
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await supabaseClient.auth.signUp({
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
        setLoading(false);
      } else if (data.user) {
        setSuccessMsg("Registration successful! Logging you in...");
        
        // Auto sign in user if confirmation is bypassed
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f0fdf4_100%)] flex items-center justify-center text-zinc-900">
      <div className="w-full max-w-md px-4">
        {/* Back Link */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
            <ArrowLeft size={16} /> Back to Homepage
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Join EVPULSE</h1>
            <p className="mt-2 text-sm text-zinc-500">Create an account to compare & buy EVs</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Full Name</span>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                <User size={16} className="text-zinc-400" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Email Address</span>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                <Mail size={16} className="text-zinc-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                  <Phone size={16} className="text-zinc-400" />
                  <input
                    required
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-zinc-600">City</span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                  <MapPin size={16} className="text-zinc-400" />
                  <input
                    required
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-zinc-600">Password</span>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition relative">
                <Lock size={16} className="text-zinc-400" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 mt-6 shadow-md shadow-emerald-600/10"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-8 text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-800">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
