import type { Metadata } from "next";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Clarity Analytics | EVPLSE",
  description: "Live site analytics powered by Microsoft Clarity Data Export API.",
};

export default function AnalyticsPage() {
  return (
    <div className="pt-20 min-h-screen bg-[#f0f4f8]">
      <AnalyticsDashboard />
    </div>
  );
}
