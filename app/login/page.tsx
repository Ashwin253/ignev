"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { auth } from "../lib/firebaseClient";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Check if user is already logged in using Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/profile");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getFriendlyErrorMessage = (error: any) => {
    const code = error?.code || error?.message || "";
    if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/user-not-found")) {
      return "Invalid email or password. Please try again.";
    }
    if (code.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("auth/user-disabled")) {
      return "This account has been disabled.";
    }
    if (code.includes("auth/too-many-requests")) {
      return "Too many failed attempts. Please try again later.";
    }
    return error.message || "An unexpected error occurred.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      if (userCredential.user) {
        setSuccessMsg("Logged in successfully with Google! Redirecting...");
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Welcome Back</h1>
            <p className="mt-2 text-sm text-zinc-500">Sign in to your EVPLSE account</p>
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

          <form onSubmit={handleLogin} className="space-y-4">
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

            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-600">Password</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition relative">
                <Lock size={16} className="text-zinc-400" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center text-xs">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200"></div></div>
            <span className="relative bg-white px-2 text-zinc-400">Or continue with</span>
          </div>

          {/* Social Auth */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 py-3 text-sm font-semibold text-zinc-700 transition cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.79 5.79 0 0 1 8.2 12.725a5.79 5.79 0 0 1 5.79-5.79c2.263 0 4.167 1.27 5.113 3.124l3.52-2.054C20.89 4.542 17.708 2.727 13.99 2.727a9.273 9.273 0 0 0-9.273 9.273 9.273 9.273 0 0 0 9.273 9.273c5.44 0 9.261-3.821 9.261-9.273v-1.714H12.24Z"
              />
            </svg>
            Google Account
          </button>


          {/* Footer link */}
          <p className="mt-8 text-center text-xs text-zinc-500">
            Don't have an account?{" "}
            <Link href="/signup" className="font-bold text-emerald-700 hover:text-emerald-800">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
