"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebaseClient";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Check, X, ShieldAlert, Clock, Mail, Phone, MapPin, Loader2 } from "lucide-react";

type PendingUser = {
  uid: string;
  fullName: string;
  email: string;
  mobile: string;
  city: string;
  requestedRole: "dealer" | "expert";
  createdAt: string;
};

export default function ApprovalsPanel() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningUid, setActioningUid] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("isApproved", "==", false),
        where("requestedRole", "in", ["dealer", "expert"])
      );
      
      const querySnapshot = await getDocs(q);
      const fetched: PendingUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          uid: doc.id,
          fullName: data.fullName || "",
          email: data.email || "",
          mobile: data.mobile || "",
          city: data.city || "",
          requestedRole: data.requestedRole,
          createdAt: data.requestedAt || data.createdAt || new Date().toISOString(),
        });
      });
      
      // Sort by newest requests first
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUsers(fetched);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string, requestedRole: "dealer" | "expert") => {
    setActioningUid(uid);
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        role: requestedRole,
        isApproved: true,
      });
      alert("User approved successfully!");
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err: any) {
      alert("Failed to approve user: " + err.message);
    } finally {
      setActioningUid(null);
    }
  };

  const handleReject = async (uid: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;
    setActioningUid(uid);
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        requestedRole: null,
        isApproved: true, // Mark approved so it clears from list, but role remains customer
      });
      alert("User request rejected.");
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err: any) {
      alert("Failed to reject user request: " + err.message);
    } finally {
      setActioningUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="text-amber-500" size={22} /> B2B Partner Approvals
        </h2>
        <p className="text-xs text-ink-mute mt-1">Review and approve applications for Dealers and EV Experts.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={28} />
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {users.map((u) => (
            <div key={u.uid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      u.requestedRole === "dealer" 
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                        : "text-emerald-700 bg-emerald-50 border-emerald-100"
                    }`}>
                      {u.requestedRole === "dealer" ? "Dealer Application" : "EV Expert Application"}
                    </span>
                    <h3 className="font-extrabold text-slate-900 mt-2 text-base">{u.fullName}</h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-ink-mute shrink-0" /> {u.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-ink-mute shrink-0" /> {u.mobile || "No phone number"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={13} className="text-ink-mute shrink-0" /> {u.city || "No city/state"}
                  </p>
                  <p className="flex items-center gap-2 text-ink-mute pt-1 border-t border-slate-200/60 mt-1">
                    <Clock size={13} className="shrink-0" /> {new Date(u.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100">
                <button
                  disabled={actioningUid !== null}
                  onClick={() => handleApprove(u.uid, u.requestedRole)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 transition cursor-pointer"
                >
                  <Check size={14} /> Approve Partner
                </button>
                <button
                  disabled={actioningUid !== null}
                  onClick={() => handleReject(u.uid)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 transition cursor-pointer"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white rounded-2xl">
          <Check className="text-ink-soft" size={40} />
          <h3 className="font-extrabold text-sm text-slate-700 mt-4">No pending applications</h3>
          <p className="text-xs text-ink-mute max-w-xs mt-1 leading-relaxed">
            All partner requests for Dealers and EV Experts have been processed.
          </p>
        </div>
      )}
    </div>
  );
}
