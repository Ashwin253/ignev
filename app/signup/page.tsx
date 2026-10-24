"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Phone, MapPin, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "../lib/firebaseClient";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "dealer" | "expert">("customer");
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
    if (code.includes("auth/email-already-in-use")) {
      return "This email is already registered. Please log in.";
    }
    if (code.includes("auth/invalid-email")) {
      return "Please enter a valid email address.";
    }
    if (code.includes("auth/weak-password")) {
      return "Password should be at least 6 characters.";
    }
    return error.message || "An unexpected error occurred.";
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Profile display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // Save additional metadata to Firestore with fallback caching
      try {
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          email,
          mobile,
          city,
          role: "customer",
          requestedRole: accountType !== "customer" ? accountType : null,
          isApproved: accountType === "customer",
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreErr) {
        console.warn("Firestore save failed during signup:", firestoreErr);
        localStorage.setItem(`user_meta_${user.uid}`, JSON.stringify({ 
          fullName, 
          mobile, 
          city,
          role: "customer",
          requestedRole: accountType !== "customer" ? accountType : null,
          isApproved: accountType === "customer"
        }));
      }

      setSuccessMsg("Registration successful! Redirecting...");
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
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
        // Sync user document to Firestore on Google signup
        try {
          const docRef = doc(db, "users", userCredential.user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              fullName: userCredential.user.displayName || "",
              email: userCredential.user.email || "",
              mobile: "",
              city: "",
              role: "customer",
              requestedRole: null,
              isApproved: true,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          console.warn("Google login Firestore save skipped:", dbErr);
        }

        setSuccessMsg("Registered successfully with Google! Redirecting...");
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Join EVPLSE</h1>
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setMobile(val);
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number."
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
              <span className="text-xs font-bold text-zinc-600">Account Type</span>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                <User size={16} className="text-zinc-400" />
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="h-11 w-full bg-transparent text-sm outline-none text-zinc-900 cursor-pointer"
                >
                  <option value="customer">Customer / Buyer</option>
                  <option value="dealer">Dealer / Partner Business</option>
                  <option value="expert">EV Expert Advisor</option>
                </select>
              </div>
            </label>

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

          {/* Divider */}
          <div className="relative my-6 text-center text-xs text-zinc-500">
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
