"use client";

import { useMemo, useState, type FormEvent } from "react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  interest: string;
  message: string;
  createdAt: string;
};

export default function TeamPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const totalLeads = useMemo(() => leads.length, [leads]);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("/api/team/leads");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Failed to fetch leads.");
      }
      setLeads(body.leads || []);
      setIsLoggedIn(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch leads.";
      setAuthError(message);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch("/api/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || "Login failed.");
      }

      await fetchLeads();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/team/logout", { method: "POST" });
    setIsLoggedIn(false);
    setLeads([]);
    setPassword("");
  };

  return (
    <div className="pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Team Portal</h1>
        <p className="text-gray-400 mt-2">
          Login with mobile and password to see leads from Get Assist.
        </p>

        {!isLoggedIn ? (
          <form
            onSubmit={handleLogin}
            className="mt-8 max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="block text-sm text-gray-300 mb-2">Mobile</label>
              <input
                type="text"
                required
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                placeholder="********"
              />
            </div>

            {authError && <p className="text-sm text-red-400">{authError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="mt-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-gray-300">
                Total leads: <span className="font-semibold text-white">{totalLeads}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={fetchLeads}
                  disabled={leadsLoading}
                  className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-60"
                >
                  {leadsLoading ? "Refreshing..." : "Refresh"}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            </div>

            {authError && <p className="mb-3 text-sm text-red-400">{authError}</p>}

            <div className="overflow-x-auto border border-white/10 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Pincode</th>
                    <th className="px-4 py-3">Interest</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-white/10">
                      <td className="px-4 py-3">{lead.name}</td>
                      <td className="px-4 py-3">{lead.phone}</td>
                      <td className="px-4 py-3">{lead.pincode}</td>
                      <td className="px-4 py-3">{lead.interest}</td>
                      <td className="px-4 py-3 text-gray-300">{lead.message || "-"}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(lead.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!leads.length && (
                    <tr>
                      <td className="px-4 py-5 text-gray-400" colSpan={6}>
                        No leads yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
