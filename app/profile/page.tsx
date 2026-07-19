"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, MapPin, ArrowLeft, LogOut, CheckCircle2, Loader2, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "../lib/supabase-client";

type Lead = {
  id: string;
  interest: string;
  message: string;
  source: string;
  assisted_by: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Profile fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  
  // Leads/Enquiries list
  const [enquiries, setEnquiries] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setFullName(session.user.user_metadata?.full_name || "");
        setMobile(session.user.user_metadata?.phone || "");
        setCity(session.user.user_metadata?.city || "");
        setLoading(false);
        
        // Fetch user leads if mobile number is present
        if (session.user.user_metadata?.phone) {
          fetchUserLeads(session.user.user_metadata.phone);
        }
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchUserLeads = async (phoneNum: string) => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("id, interest, message, source, assisted_by, created_at")
        .eq("phone", phoneNum)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching user leads:", error.message);
      } else {
        setEnquiries((data ?? []) as Lead[]);
      }
    } catch (err) {
      console.warn("Failed to retrieve leads", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        setSuccessMsg("Profile details saved successfully!");
        // Refresh leads list with new phone number if updated
        fetchUserLeads(mobile);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    await supabaseClient.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_40%),linear-gradient(180deg,#fafafa_0%,#f0fdf4_100%)] text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Navigation */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
              <ArrowLeft size={16} /> Back to Homepage
            </Link>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-950">My Profile</h1>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-1">Legit Supabase User Profile</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition cursor-pointer"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Edit Profile Card */}
          <div className="lg:col-span-1 rounded-3xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2 mb-4">
              <User size={18} className="text-emerald-600" /> Account Settings
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-zinc-600">Email Address (Read-only)</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-zinc-600">Full Name</span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
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

              <label className="block">
                <span className="text-xs font-bold text-zinc-600">Mobile Number</span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                  <Phone size={16} className="text-zinc-400" />
                  <input
                    required
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
                <span className="text-xs font-bold text-zinc-600">City / Registration State</span>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
                  <MapPin size={16} className="text-zinc-400" />
                  <input
                    required
                    type="text"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 mt-6"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>

          {/* Column 2 & 3: Submitted Enquiries */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" /> My Enquiries
              </h2>
              {mobile && (
                <button
                  onClick={() => fetchUserLeads(mobile)}
                  className="text-xs text-emerald-700 font-bold hover:text-emerald-800"
                >
                  Refresh list
                </button>
              )}
            </div>

            {loadingLeads ? (
              <div className="flex items-center justify-center py-16 text-zinc-400">
                <Loader2 className="animate-spin text-emerald-600" size={24} />
              </div>
            ) : enquiries.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {enquiries.map((enq) => (
                  <div key={enq.id} className={`rounded-2xl border border-zinc-200/60 bg-white p-4.5 shadow-sm transition-all hover:border-zinc-300`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {enq.source}
                          </span>
                          {enq.assisted_by && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                              <ShieldCheck size={10} /> Support Assigned
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-zinc-950 mt-1">{enq.interest}</h3>
                        {enq.message && (
                          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                            {enq.message}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1">
                          <Clock size={10} /> {new Date(enq.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                <MessageSquare className="text-zinc-300" size={32} />
                <h3 className="font-bold text-sm text-zinc-700 mt-3">No submissions yet</h3>
                <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                  Your submitted enquiries, valuations, or scrapping requests will list here once registered with your profile phone number (<strong>{mobile || "no phone registered"}</strong>).
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
