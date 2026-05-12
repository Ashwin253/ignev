import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AddToHomescreen from "./components/AddToHomescreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",   // prevent FOIT
});

export const metadata: Metadata = {
  title: "EVPLSE | Drive Electric. Buy Smart.",
  description: "Buy, rent, sell and service EV & Hybrid vehicles in one place. Your trusted EV marketplace in India.",
  keywords: "EV, Hybrid, Buy EV, Rent EV, Sell EV, Electric Vehicles India",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

import Header from "./components/Header";
import Footer from "./components/Footer";
import AssistPopup from "./components/AssistPopup";
import EnquiryModal from "./components/EnquiryModal";
import ClarityScript from "./components/ClarityScript";
import FloatingMobileNav from "./components/FloatingMobileNav";
import { CompareProvider } from "./context/CompareContext";
import CompareWidget from "./components/CompareWidget";
import { Analytics } from "@vercel/analytics/next"
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f1115] text-white">
        <ClarityScript />
        <CompareProvider>
          <Header />
          <Analytics />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CompareWidget />
          <AssistPopup />
          <EnquiryModal />
          <AddToHomescreen />
          <FloatingMobileNav />
        </CompareProvider>
      </body>
    </html>
  );
}
