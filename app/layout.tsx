import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AddToHomescreen from "./components/AddToHomescreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f1115] text-white">
        <ClarityScript />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <AssistPopup />
        <EnquiryModal />
        <AddToHomescreen />
      </body>
    </html>
  );
}
