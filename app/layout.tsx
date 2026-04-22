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
  title: "EVPULSE | Drive Electric. Buy Smart.",
  description: "Buy, rent, sell and service EV & Hybrid vehicles in one place. Your trusted EV marketplace in India.",
  keywords: "EV, Hybrid, Buy EV, Rent EV, Sell EV, Electric Vehicles India",
};

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
      <body className="min-h-full flex flex-col">
        {children}
        <AddToHomescreen />
      </body>
    </html>
  );
}
