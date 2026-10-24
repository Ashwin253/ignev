"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, MapPin, ArrowLeft, LogOut, CheckCircle2, Loader2, MessageSquare, Clock, ShieldCheck, Car, Wrench, Shield, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { supabaseClient } from "../lib/supabase-client";
import { auth, db } from "../lib/firebaseClient";
import { onAuthStateChanged, updateProfile, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Lead = {
  id: string;
  interest: string;
  message: string;
  source: string;
  assisted_by: string | null;
  created_at: string;
  name?: string;
  phone?: string;
  pincode?: string;
  brand?: string | null;
  model?: string | null;
  reg_year?: string | null;
  service_type?: string | null;
  price_expectation?: string | null;
  status?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
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

  // B2B Partner states
  const [role, setRole] = useState<string>("customer");
  const [requestedRole, setRequestedRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("claimed");

  // Vehicle Registration form states
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [vehicleServiceType, setVehicleServiceType] = useState<"sell" | "scrap">("sell");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleRegYear, setVehicleRegYear] = useState("");
  const [vehiclePrice, setVehiclePrice] = useState("");
  const [vehicleMessage, setVehicleMessage] = useState("");

  // Expert Inspection states
  const [pendingInspections, setPendingInspections] = useState<Lead[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);

  // Dealer Promo states
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerBrand, setOfferBrand] = useState("");
  const [offerText, setOfferText] = useState("");
  const [offerCities, setOfferCities] = useState("");
  const [offerValidUntil, setOfferValidUntil] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
      } else {
        setUser(firebaseUser);
        setFullName(firebaseUser.displayName || "");
        
        let userMobile = "";
        let userCity = "";
        let userRole = "customer";
        let reqRole = null;
        let approved = true;

        // 1. Try to load additional details from Firestore
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            userMobile = data.mobile || "";
            userCity = data.city || "";
            userRole = data.role || "customer";
            reqRole = data.requestedRole || null;
            approved = data.isApproved !== undefined ? data.isApproved : true;
          }
        } catch (firestoreErr) {
          console.warn("Could not fetch user details from Firestore:", firestoreErr);
        }

        // 2. Try to fallback to localStorage
        if (!userMobile || !userCity) {
          try {
            const cached = localStorage.getItem(`user_meta_${firebaseUser.uid}`);
            if (cached) {
              const data = JSON.parse(cached);
              userMobile = userMobile || data.mobile || "";
              userCity = userCity || data.city || "";
              userRole = userRole || data.role || "customer";
              reqRole = reqRole || data.requestedRole || null;
              approved = approved !== undefined ? approved : (data.isApproved !== undefined ? data.isApproved : true);
            }
          } catch (e) {
            // ignore
          }
        }

        setMobile(userMobile);
        setCity(userCity);
        setRole(userRole);
        setRequestedRole(reqRole);
        setIsApproved(approved);
        setLoading(false);

        // Fetch user leads based on role
        if ((userRole === "dealer" || userRole === "expert") && approved) {
          fetchB2BLeads(firebaseUser.uid);
          fetchAvailableLeads();
          if (userRole === "expert") {
            fetchPendingInspections();
          } else if (userRole === "dealer") {
            fetchDealerOffers(firebaseUser.uid);
          }
        } else if (userMobile) {
          fetchUserLeads(userMobile);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserLeads = async (phoneNum: string) => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("id, interest, message, source, assisted_by, created_at, brand, model, reg_year, service_type, price_expectation, status")
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

  const fetchB2BLeads = async (userId: string) => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("id, name, phone, pincode, interest, message, source, assisted_by, created_at, brand, model, reg_year, service_type, price_expectation, status")
        .eq("assisted_by", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching B2B leads:", error.message);
      } else {
        setEnquiries((data ?? []) as Lead[]);
      }
    } catch (err) {
      console.warn("Failed to retrieve B2B leads", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchAvailableLeads = async () => {
    setLoadingAvailable(true);
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("id, name, phone, pincode, interest, message, source, assisted_by, created_at, brand, model, reg_year, service_type, price_expectation, status")
        .is("assisted_by", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching available leads:", error.message);
      } else {
        setAvailableLeads((data ?? []) as Lead[]);
      }
    } catch (err) {
      console.warn("Failed to retrieve available leads", err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchPendingInspections = async () => {
    setLoadingInspections(true);
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("id, name, phone, pincode, interest, message, source, assisted_by, created_at, brand, model, reg_year, service_type, price_expectation, status")
        .not("brand", "is", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching pending inspections:", error.message);
      } else {
        setPendingInspections((data ?? []) as Lead[]);
      }
    } catch (err) {
      console.warn("Failed to retrieve pending inspections", err);
    } finally {
      setLoadingInspections(false);
    }
  };

  const handleVerifyInspection = async (leadId: string, verifyStatus: "approved" | "rejected") => {
    try {
      const { error } = await supabaseClient
        .from("leads")
        .update({ status: verifyStatus })
        .eq("id", leadId);

      if (error) {
        alert("Verification failed: " + error.message);
      } else {
        alert(`Request successfully marked as ${verifyStatus}!`);
        setPendingInspections((prev) => prev.filter((l) => l.id !== leadId));
        fetchAvailableLeads();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const fetchDealerOffers = async (userId: string) => {
    setLoadingOffers(true);
    try {
      const { data, error } = await supabaseClient
        .from("offers")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Error fetching dealer offers:", error.message);
      } else {
        setOffers(data ?? []);
      }
    } catch (err) {
      console.warn("Failed to retrieve dealer offers", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingOffer(true);
    try {
      const { error } = await supabaseClient
        .from("offers")
        .insert({
          brand: offerBrand.trim() || null,
          text: offerText.trim(),
          cities: offerCities.trim() || null,
          valid_until: offerValidUntil || null,
          is_active: true,
          created_by: user.uid,
        });

      if (error) {
        alert("Offer registration failed: " + error.message);
      } else {
        alert("Offer registered successfully!");
        setOfferBrand("");
        setOfferText("");
        setOfferCities("");
        setOfferValidUntil("");
        setShowOfferForm(false);
        fetchDealerOffers(user.uid);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const { error } = await supabaseClient
        .from("offers")
        .delete()
        .eq("id", offerId);

      if (error) {
        alert("Failed to delete offer: " + error.message);
      } else {
        alert("Offer deleted successfully.");
        if (user) fetchDealerOffers(user.uid);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleClaimLead = async (leadId: string) => {
    if (!user) return;
    try {
      const { error } = await supabaseClient
        .from("leads")
        .update({
          assisted_by: user.uid,
        })
        .eq("id", leadId);

      if (error) {
        alert("Could not claim lead: " + error.message);
      } else {
        alert("Lead claimed successfully!");
        fetchB2BLeads(user.uid);
        fetchAvailableLeads();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleReleaseLead = async (leadId: string) => {
    if (!user) return;
    try {
      const { error } = await supabaseClient
        .from("leads")
        .update({
          assisted_by: null,
        })
        .eq("id", leadId);

      if (error) {
        alert("Could not release lead: " + error.message);
      } else {
        alert("Lead released successfully!");
        fetchB2BLeads(user.uid);
        fetchAvailableLeads();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) {
      alert("Please save a mobile number in your Account Settings first so we can contact you.");
      return;
    }
    setSubmittingVehicle(true);
    try {
      const interestStr = `${vehicleServiceType === "sell" ? "Sell" : "Scrap"} old ${vehicleBrand} ${vehicleModel} (${vehicleRegYear})`;
      const { error } = await supabaseClient.from("leads").insert({
        name: fullName || user?.displayName || "",
        phone: mobile,
        pincode: city,
        interest: interestStr,
        message: `Condition: ${vehicleMessage || "Not specified"}. Price Expectation: ${vehiclePrice}`,
        source: vehicleServiceType === "sell" ? "Valuation Request" : "Scrap Request",
        brand: vehicleBrand,
        model: vehicleModel,
        reg_year: vehicleRegYear,
        service_type: vehicleServiceType,
        price_expectation: vehiclePrice,
        status: "pending"
      });

      if (error) {
        alert("Submission failed: " + error.message);
      } else {
        alert("Vehicle registered successfully! You can track its progress below.");
        // Clear form and close
        setVehicleBrand("");
        setVehicleModel("");
        setVehicleRegYear("");
        setVehiclePrice("");
        setVehicleMessage("");
        setShowVehicleForm(false);
        // Refresh leads list
        fetchUserLeads(mobile);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (!user) throw new Error("No authenticated user found.");

      // 1. Update Firebase display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // 2. Update Firestore details
      try {
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          email: user.email,
          mobile,
          city,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn("Failed to update user doc in Firestore:", firestoreErr);
        // Save to local storage as fallback
        localStorage.setItem(`user_meta_${user.uid}`, JSON.stringify({ fullName, mobile, city }));
      }

      setSuccessMsg("Profile details saved successfully!");
      // Refresh leads list with new phone number if updated
      if (mobile) {
        fetchUserLeads(mobile);
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    await signOut(auth);
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
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
              My Profile
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-widest align-middle">
                Beta
              </span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-1">
              {role === "dealer" ? "Dealer Account" : role === "expert" ? "EV Expert Advisor" : "User Profile"}
            </p>
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
                  <span>{user?.email}</span>
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setMobile(val);
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number."
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

          {/* Column 2 & 3: Dynamic Panel Content based on Approval & Role */}
          {requestedRole !== null && !isApproved ? (
            /* Pending Approval State */
            <div className="lg:col-span-2 rounded-3xl border border-amber-200 bg-amber-50/30 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Clock className="text-amber-600 mb-4 animate-pulse" size={48} />
              <h2 className="text-2xl font-bold text-zinc-950">Partner Registration Pending</h2>
              <p className="text-sm text-zinc-600 max-w-md mt-3 leading-relaxed">
                Thanks for registering as a <strong>{requestedRole === "dealer" ? "Dealer / Partner" : "EV Expert Advisor"}</strong>! 
                Your B2B account request is currently being reviewed by the EVPLSE admin team. 
                Once approved, your partner lead claim board will activate automatically.
              </p>
            </div>
          ) : (role === "dealer" || role === "expert") && isApproved ? (
            /* B2B Partner Dashboard Mode */
            <div className="lg:col-span-2 rounded-3xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600" size={20} /> Partner Dashboard ({role === "dealer" ? "Dealer" : "EV Expert"})
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Claim unassigned customer leads and manage your active accounts.</p>
                </div>
                {role === "expert" ? (
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveTab("claimed")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "claimed" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      My Claims ({enquiries.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab("available")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "available" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      Claim Board ({availableLeads.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab("inspections")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "inspections" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      Inspections ({pendingInspections.length})
                    </button>
                  </div>
                ) : (
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveTab("claimed")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "claimed" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      My Claims ({enquiries.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab("available")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "available" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      Regional Leads ({
                        availableLeads.filter((lead) => {
                          if (!city) return true;
                          const leadLoc = (lead.pincode || lead.message || "").toLowerCase();
                          return leadLoc.includes(city.toLowerCase());
                        }).length
                      })
                    </button>
                    <button 
                      onClick={() => setActiveTab("offers")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === "offers" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      Promo Offers ({offers.length})
                    </button>
                  </div>
                )}
              </div>

              {activeTab === "claimed" ? (
                /* My Claims List */
                loadingLeads ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-emerald-600" size={24} />
                  </div>
                ) : enquiries.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {enquiries.map((enq) => (
                      <div key={enq.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/10 p-5 shadow-sm hover:border-emerald-200 transition">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {enq.source}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                Claimed
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-zinc-950">{enq.interest}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 mt-2 bg-white/50 p-3 rounded-xl border border-zinc-100">
                              <p><strong>Name:</strong> {enq.name || "N/A"}</p>
                              <p><strong>Phone:</strong> <a href={`tel:${enq.phone}`} className="text-emerald-700 font-bold hover:underline">{enq.phone || "N/A"}</a></p>
                              <p><strong>Pincode:</strong> {enq.pincode || "N/A"}</p>
                              <p><strong>Date:</strong> {new Date(enq.created_at).toLocaleDateString()}</p>
                            </div>
                            {enq.message && (
                              <p className="mt-2 text-xs text-zinc-600 leading-relaxed bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                                <strong>Client Message:</strong> "{enq.message}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleReleaseLead(enq.id)}
                            className="rounded-xl border border-zinc-200 hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 transition cursor-pointer shrink-0"
                          >
                            Release Lead
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                    <ShieldCheck className="text-zinc-300" size={36} />
                    <h3 className="font-bold text-sm text-zinc-700 mt-3">No claimed leads</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                      You haven't claimed any enquiries yet. Switch to the available boards to claim customer queries.
                    </p>
                  </div>
                )
              ) : activeTab === "available" ? (
                /* Available Lead Market */
                loadingAvailable ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-emerald-600" size={24} />
                  </div>
                ) : (role === "dealer" 
                  ? availableLeads.filter((lead) => {
                      if (!city) return true;
                      const leadLoc = (lead.pincode || lead.message || "").toLowerCase();
                      return leadLoc.includes(city.toLowerCase());
                    })
                  : availableLeads).length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {role === "dealer" && (
                      <div className="mb-2 p-3 bg-zinc-50 text-[11px] text-zinc-500 rounded-xl border border-zinc-100 font-semibold">
                        📍 Showing unassigned customer leads matching your city coverage (<strong>{city || "all regions"}</strong>).
                      </div>
                    )}
                    {(role === "dealer" 
                      ? availableLeads.filter((lead) => {
                          if (!city) return true;
                          const leadLoc = (lead.pincode || lead.message || "").toLowerCase();
                          return leadLoc.includes(city.toLowerCase());
                        })
                      : availableLeads).map((enq) => (
                      <div key={enq.id} className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm hover:border-zinc-300 transition">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                {enq.source}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-400">
                                {new Date(enq.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-zinc-950">{enq.interest}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500 mt-2 bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                              <p><strong>Pincode:</strong> {enq.pincode || "Not shared"}</p>
                            </div>
                            {enq.message && (
                              <p className="mt-2 text-xs text-zinc-600 leading-relaxed bg-zinc-50/30 p-2.5 rounded-xl border border-zinc-100/50 italic">
                                "{enq.message}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleClaimLead(enq.id)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer shrink-0"
                          >
                            Claim Lead
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                    <ShieldCheck className="text-zinc-300" size={36} />
                    <h3 className="font-bold text-sm text-zinc-700 mt-3">All clear!</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                      There are no unassigned customer enquiries on the board matching your region coverage. Check back later!
                    </p>
                  </div>
                )
              ) : activeTab === "inspections" && role === "expert" ? (
                /* Expert Vehicle Inspections Tab */
                loadingInspections ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-emerald-600" size={24} />
                  </div>
                ) : pendingInspections.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {pendingInspections.map((enq) => (
                      <div key={enq.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4 hover:border-zinc-300 transition">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              enq.service_type === "scrap" 
                                ? "text-rose-700 bg-rose-50 border-rose-100" 
                                : "text-emerald-700 bg-emerald-50 border-emerald-100"
                            }`}>
                              {enq.service_type === "scrap" ? "Scrap Request" : "Sale Request"}
                            </span>
                            <h3 className="font-extrabold text-zinc-950 mt-2 text-base">
                              {enq.brand} {enq.model} ({enq.reg_year})
                            </h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-emerald-600 block">
                              INR {enq.price_expectation || "No estimate"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                          <p><strong>Owner Name:</strong> {enq.name || "Anonymous Client"}</p>
                          <p className="flex items-center gap-1">
                            <Phone size={12} className="text-zinc-400 animate-pulse" /> 
                            <a href={`tel:${enq.phone}`} className="text-emerald-600 font-bold hover:underline">{enq.phone}</a>
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin size={12} className="text-zinc-400" /> {enq.pincode || "Not specified"}
                          </p>
                          {enq.message && (
                            <p className="text-zinc-500 italic mt-1 pt-1.5 border-t border-zinc-200/50">
                              "{enq.message}"
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2.5 pt-3 border-t border-zinc-100">
                          <button
                            onClick={() => handleVerifyInspection(enq.id, "approved")}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 transition cursor-pointer"
                          >
                            <Check size={14} /> Verify & Approve Listing
                          </button>
                          <button
                            onClick={() => handleVerifyInspection(enq.id, "rejected")}
                            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-zinc-700 font-bold text-xs px-3.5 py-2 transition cursor-pointer"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                    <CheckCircle2 className="text-zinc-300" size={36} />
                    <h3 className="font-bold text-sm text-zinc-700 mt-3">No pending inspections</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                      All registered customer vehicles have been evaluated and approved.
                    </p>
                  </div>
                )
              ) : activeTab === "offers" && role === "dealer" ? (
                /* Dealer promo offers manager view */
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">Promotional Offers Manager</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Register discounts, valuation benefits, or scrapping rewards.</p>
                    </div>
                    <button
                      onClick={() => setShowOfferForm(!showOfferForm)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 cursor-pointer transition shadow-sm"
                    >
                      {showOfferForm ? "Close Form" : "Create New Offer"}
                    </button>
                  </div>

                  {showOfferForm && (
                    <form onSubmit={handleCreateOffer} className="space-y-4 bg-zinc-50/50 p-4.5 rounded-2xl border border-zinc-100 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-xs font-bold text-zinc-600">Target Vehicle Brand (Optional)</span>
                          <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                            <input
                              type="text"
                              value={offerBrand}
                              onChange={(e) => setOfferBrand(e.target.value)}
                              placeholder="e.g. Tata, Nexon, General"
                              className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold text-zinc-600">Cities / Regions (Optional)</span>
                          <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                            <input
                              type="text"
                              value={offerCities}
                              onChange={(e) => setOfferCities(e.target.value)}
                              placeholder="e.g. Mumbai, Pune (comma separated)"
                              className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                            />
                          </div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-xs font-bold text-zinc-600">Valid Until (Optional)</span>
                          <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                            <input
                              type="date"
                              value={offerValidUntil}
                              onChange={(e) => setOfferValidUntil(e.target.value)}
                              className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900 cursor-pointer text-zinc-600"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="text-xs font-bold text-zinc-600">Offer Detail Text</span>
                          <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                            <input
                              required
                              type="text"
                              value={offerText}
                              onChange={(e) => setOfferText(e.target.value)}
                              placeholder="e.g. Get additional INR 15,000 exchange bonus on Tata EVs."
                              className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                            />
                          </div>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingOffer}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingOffer ? "Saving Offer..." : "Publish Promo Offer"}
                      </button>
                    </form>
                  )}

                  {loadingOffers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                    </div>
                  ) : offers.length > 0 ? (
                    <div className="space-y-4">
                      {offers.map((off) => (
                        <div key={off.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {off.brand && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  {off.brand}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-zinc-400">
                                Valid to: {off.valid_until ? new Date(off.valid_until).toLocaleDateString() : "Lifetime"}
                              </span>
                            </div>
                            <p className="font-extrabold text-sm text-zinc-950">"{off.text}"</p>
                            {off.cities && (
                              <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <MapPin size={10} /> Cities: {off.cities}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteOffer(off.id)}
                            className="rounded-xl border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-zinc-500 p-2 cursor-pointer transition shrink-0"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                      <Wrench className="text-zinc-300" size={36} />
                      <h3 className="font-bold text-sm text-zinc-700 mt-3">No published offers</h3>
                      <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                        You haven't registered any promotional offers yet. Use the button above to publish your first deal!
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            /* Customer Mode: Vehicle Scrap & Sales Tracker */
            <div className="lg:col-span-2 rounded-3xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8 animate-fade-in">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
                    <Car size={20} className="text-emerald-600" /> Sales & Scrapping Tracker
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Track the live progress of your vehicle selling or scrapping requests.</p>
                </div>
                {mobile && (
                  <button
                    onClick={() => fetchUserLeads(mobile)}
                    className="text-xs text-emerald-700 font-bold hover:text-emerald-800 cursor-pointer"
                  >
                    Refresh list
                  </button>
                )}
              </div>

              {/* Expandable Register Vehicle Form */}
              <div className="mb-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                      <Car size={16} className="text-emerald-600 animate-pulse" /> Have a vehicle to sell or scrap?
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Register it below to start our evaluation progress.</p>
                  </div>
                  <button 
                    onClick={() => setShowVehicleForm(!showVehicleForm)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 cursor-pointer transition shadow-sm shrink-0"
                  >
                    {showVehicleForm ? "Close Form" : "Register Vehicle"}
                  </button>
                </div>

                {showVehicleForm && (
                  <form onSubmit={handleRegisterVehicle} className="mt-5 space-y-4 pt-5 border-t border-emerald-200/50 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs font-bold text-zinc-600">Request Type</span>
                        <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                          <select
                            value={vehicleServiceType}
                            onChange={(e) => setVehicleServiceType(e.target.value as any)}
                            className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900 cursor-pointer"
                          >
                            <option value="sell">Sell Old Car</option>
                            <option value="scrap">Scrap Old Car</option>
                          </select>
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-zinc-600">Expected Price / Scrap Value</span>
                        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                          <span className="text-xs font-semibold text-zinc-400">INR</span>
                          <input
                            required
                            type="text"
                            value={vehiclePrice}
                            onChange={(e) => setVehiclePrice(e.target.value)}
                            placeholder="e.g. 3,50,000"
                            className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="block">
                        <span className="text-xs font-bold text-zinc-600">Vehicle Brand</span>
                        <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                          <input
                            required
                            type="text"
                            value={vehicleBrand}
                            onChange={(e) => setVehicleBrand(e.target.value)}
                            placeholder="e.g. Honda"
                            className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-zinc-600">Vehicle Model</span>
                        <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                          <input
                            required
                            type="text"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            placeholder="e.g. City"
                            className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold text-zinc-600">Registration Year</span>
                        <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-white px-3.5 focus-within:border-emerald-500 transition">
                          <input
                            required
                            type="text"
                            value={vehicleRegYear}
                            onChange={(e) => setVehicleRegYear(e.target.value)}
                            placeholder="e.g. 2016"
                            className="h-10 w-full bg-transparent text-sm outline-none text-zinc-900"
                          />
                        </div>
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-bold text-zinc-600">Vehicle Condition / Message</span>
                      <div className="mt-1.5 flex items-start rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 transition">
                        <textarea
                          rows={2}
                          value={vehicleMessage}
                          onChange={(e) => setVehicleMessage(e.target.value)}
                          placeholder="e.g. First owner, excellent mechanical condition, a few minor scratches."
                          className="w-full bg-transparent text-sm outline-none text-zinc-900 resize-none"
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={submittingVehicle}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {submittingVehicle ? "Submitting Vehicle..." : "Submit Registration"}
                    </button>
                  </form>
                )}
              </div>

              {loadingLeads ? (
                <div className="flex items-center justify-center py-16 text-zinc-400">
                  <Loader2 className="animate-spin text-emerald-600" size={24} />
                </div>
              ) : enquiries.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 animate-fade-in">
                  {enquiries.map((enq) => {
                    const isValuation = enq.source === "Valuation Request";
                    const isScrap = enq.source === "Scrap Request";
                    const isVehicle = isValuation || isScrap || enq.source.includes("Valuation") || enq.source.includes("Scrap") || enq.source.includes("sell");
                    const assigned = enq.assisted_by !== null;
                    const approved = enq.status === "approved" || enq.status === "closed";
                    const closed = enq.status === "closed";
                    const rejected = enq.status === "rejected";

                    // Determine current step index (1-based)
                    let currentStep = 1;
                    if (assigned) currentStep = 2;
                    if (approved) currentStep = 3;
                    if (closed) currentStep = 4;

                    return (
                      <div key={enq.id} className={`rounded-2xl border bg-white p-5 shadow-sm space-y-4 transition ${
                        rejected ? "border-rose-200 bg-rose-50/5" : "border-zinc-200 hover:border-zinc-300"
                      }`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isScrap 
                                  ? "text-rose-700 bg-rose-50 border-rose-100" 
                                  : isValuation 
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                                    : "text-emerald-700 bg-emerald-50 border-emerald-100"
                              }`}>
                                {enq.source}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-semibold">
                                Ref: #{enq.id.slice(0, 8)}
                              </span>
                              {rejected && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-200 bg-rose-100 text-rose-800">
                                  Rejected
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-zinc-950 text-base">{enq.interest}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold justify-end">
                              <Clock size={11} /> {new Date(enq.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Stepper */}
                        {isVehicle && !rejected && (
                          <div className="py-2.5">
                            <div className="relative flex items-center justify-between w-full">
                              {/* Background Connector Bar */}
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-zinc-100 -z-10 rounded-full" />
                              {/* Filled Connector Bar */}
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-10 transition-all duration-500 rounded-full"
                                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                              />

                              {/* Step 1: Submitted */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                  currentStep >= 1 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "bg-white border-zinc-200 text-zinc-400"
                                }`}>
                                  <Check size={14} />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-950 mt-1.5">Submitted</span>
                              </div>

                              {/* Step 2: Expert Assigned */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                  currentStep >= 2 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : currentStep === 1 
                                      ? "bg-white border-emerald-500 text-emerald-600 animate-pulse" 
                                      : "bg-white border-zinc-200 text-zinc-400"
                                }`}>
                                  {currentStep >= 2 ? <Check size={14} /> : 2}
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 mt-1.5">Advisor Match</span>
                              </div>

                              {/* Step 3: Inspection */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                  currentStep >= 3 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : currentStep === 2 
                                      ? "bg-white border-emerald-500 text-emerald-600 animate-pulse" 
                                      : "bg-white border-zinc-200 text-zinc-400"
                                }`}>
                                  {currentStep >= 3 ? <Check size={14} /> : 3}
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 mt-1.5">Inspection</span>
                              </div>

                              {/* Step 4: Closed */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                                  currentStep >= 4 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "bg-white border-zinc-200 text-zinc-400"
                                }`}>
                                  4
                                </div>
                                <span className="text-[10px] font-bold text-zinc-500 mt-1.5">Closed</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Description & Action Notice */}
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-xs space-y-2">
                          {enq.message && (
                            <p className="text-zinc-600">
                              <strong>Your Message:</strong> "{enq.message}"
                            </p>
                          )}
                          {enq.brand && (
                            <p className="text-zinc-500">
                              <strong>Vehicle Info:</strong> {enq.brand} {enq.model} ({enq.reg_year}) | Expectation: INR {enq.price_expectation}
                            </p>
                          )}
                          <div className="pt-2 border-t border-zinc-200/60 flex items-center gap-2 text-zinc-900 font-semibold">
                            {rejected ? (
                              <>
                                <X size={15} className="text-rose-600 shrink-0" />
                                <span className="text-rose-700">This request has been rejected or cancelled by the evaluation team.</span>
                              </>
                            ) : closed ? (
                              <>
                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                <span className="text-emerald-700">Deal finalized! Vehicle handoff and payout completed successfully.</span>
                              </>
                            ) : approved ? (
                              <>
                                <Wrench size={15} className="text-emerald-600 shrink-0 animate-pulse" />
                                <span className="text-emerald-700">Evaluation Approved! Physical vehicle inspection scheduled.</span>
                              </>
                            ) : assigned ? (
                              <>
                                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                <span>Verification advisor assigned! They will contact you shortly to schedule inspection.</span>
                              </>
                            ) : (
                              <>
                                <Loader2 size={13} className="animate-spin text-emerald-600 shrink-0" />
                                <span className="text-emerald-700 font-bold">Matching with local EV Expert/Dealer advisor...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                  <Car className="text-zinc-300" size={40} />
                  <h3 className="font-bold text-sm text-slate-700 mt-3">No sales or scrapping requests</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                    Create valuation requests, sell leads, or vehicle scrapping bookings to monitor your progress here in real-time.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
