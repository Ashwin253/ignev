import type { Metadata } from "next";
import ShortlistClient from "./ShortlistClient";

export const metadata: Metadata = {
  title: "My Shortlist | EVPLSE",
  description: "Your saved electric vehicles — compare them, check EMIs and get the best offer.",
  robots: { index: false, follow: true },
};

export default function ShortlistPage() {
  return <ShortlistClient />;
}
