import type { Metadata } from "next";
import QuickClientPage from "./QuickClientPage";

export const metadata: Metadata = {
  title: "Quick Service Request | EVPLSE",
  description: "Request vehicle pickup, cleaning, or service using your current location.",
};

export default function ServicePage() {
  return <QuickClientPage />;
}
