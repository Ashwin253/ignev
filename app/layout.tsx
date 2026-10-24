import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import AddToHomescreen from "./components/AddToHomescreen";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AssistPopup from "./components/AssistPopup";
import BestOfferPopup from "./components/BestOfferPopup";
import EnquiryModal from "./components/EnquiryModal";
import ClarityScript from "./components/ClarityScript";
import PageTracker from "./components/PageTracker";
import AiChatPopup from "./components/AiChatPopup";
import FloatingMobileNav from "./components/FloatingMobileNav";
import CommandPalette from "./components/CommandPalette";
import ScrollToTop from "./components/ScrollToTop";
import Toaster from "./components/ui/Toaster";
import { CompareProvider } from "./context/CompareContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { LocationProvider } from "./context/LocationContext";
import { ShortlistProvider } from "./context/ShortlistContext";
import CompareWidget from "./components/CompareWidget";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "only light", // the site is light-only — never follows the device theme
  themeColor: "#f6f9f4",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.evplse.com"),
  title: {
    default: "EVPLSE | Drive Electric. Buy Smart.",
    template: "%s",
  },
  description: "Buy, rent, sell and service EV & Hybrid vehicles in one place. Your trusted EV marketplace in India.",
  keywords: "EV, Hybrid, Buy EV, Rent EV, Sell EV, Electric Vehicles India",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "https://www.evplse.com/feed",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} style={{ colorScheme: "only light" }}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4463436920905079" />
        <link rel="alternate" type="application/rss+xml" title="EVPLSE Articles & News" href="https://www.evplse.com/feed" />
        <Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4463436920905079" strategy="lazyOnload" crossOrigin="anonymous" />
        <Script src="https://t.contentsquare.net/uxa/11fb40d69f477.js" strategy="lazyOnload" />
        <Script src="https://news.google.com/swg/js/v1/swg-basic.js" strategy="afterInteractive" />
        <Script id="swg-basic-init" strategy="afterInteractive">
          {`
            (self.SWG_BASIC = self.SWG_BASIC || []).push(function(basicSubscriptions) {
              basicSubscriptions.init({
                type: "NewsArticle",
                isPartOfType: ["Product"],
                isPartOfProductId: "CAownrzHDA:openaccess",
                clientOptions: { theme: "light", lang: "en" },
              });
            });
          `}
        </Script>
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ClarityScript />
        <PageTracker />
        <FeedbackProvider>
          <CompareProvider>
            <ShortlistProvider>
              <LocationProvider>
                <Header />
                <SpeedInsights />
                <Analytics />
                <main id="main" className="relative flex-grow">
                  {children}
                </main>
                <Footer />
                <CompareWidget />
                <AssistPopup />
                <BestOfferPopup />
                <EnquiryModal />
                <AddToHomescreen />
                <FloatingMobileNav />
                <CommandPalette />
                <ScrollToTop />
                <Toaster />
                <Suspense fallback={null}>
                  <AiChatPopup />
                </Suspense>
              </LocationProvider>
            </ShortlistProvider>
          </CompareProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
