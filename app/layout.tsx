import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AddToHomescreen from "./components/AddToHomescreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",   // prevent FOIT
  preload: true,
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
import PageTracker from "./components/PageTracker";
import FloatingMobileNav from "./components/FloatingMobileNav";
import { CompareProvider } from "./context/CompareContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import CompareWidget from "./components/CompareWidget";
import { Analytics } from "@vercel/analytics/next";
import TidioChat from "./components/TidioChat";
import TawkChat from "./components/TawkChat";
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
      <head>
        <meta name="google-adsense-account" content="ca-pub-4463436920905079" />
        <Script id="theme-loader" strategy="beforeInteractive">
          {`
            (function() {
              var theme = localStorage.getItem('theme_preference');
              if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              document.documentElement.classList.add(theme);
            })();
          `}
        </Script>
        <Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4463436920905079" strategy="lazyOnload" crossOrigin="anonymous" />
        <Script src="https://t.contentsquare.net/uxa/11fb40d69f477.js" strategy="lazyOnload" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-[#0f1115] dark:text-white transition-colors duration-300">
        <ClarityScript />
        <PageTracker />
        <FeedbackProvider>
          <CompareProvider>
            <Header />
            <Analytics />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <CompareWidget />
            {/* <AssistPopup /> */}
            <EnquiryModal />
            <AddToHomescreen />
            <FloatingMobileNav />
            {/* <TidioChat /> */}
            <TawkChat />
          </CompareProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
