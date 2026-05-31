import type { Metadata } from "next";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | EVPLSE",
  description: "Site analytics dashboard combining Microsoft Clarity and Vercel Insights for EVPLSE.",
};

export default function AnalyticsPage() {
  return (
    <div className="pt-20 min-h-screen bg-[#f0f4f8]">
      <AnalyticsDashboard />
    </div>
  );
}
