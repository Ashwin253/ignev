"use client";

import Analytics from "analytics";

/**
 * Custom In-House Plugin for Analytics
 * Automatically sends page views and custom events to our Supabase-backed /api/track endpoint.
 */
const inHousePlugin = {
  name: "in-house-evezy",
  page: ({ payload }: any) => {
    if (typeof window === "undefined") return;
    const pathname = payload.properties?.path || window.location.pathname;
    const slug = pathname.startsWith("/product/") ? pathname.split("/product/")[1] : "";
    const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        slug,
        referrer: document.referrer || "",
        device,
        event: "page_view",
      }),
    }).catch(() => {});
  },
  track: ({ payload }: any) => {
    if (typeof window === "undefined") return;
    const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        slug: payload.properties?.slug || "",
        referrer: document.referrer || "",
        device,
        event: payload.event || "custom_event",
        properties: payload.properties || {},
      }),
    }).catch(() => {});
  },
};

// Initialize Analytics singleton
export const analytics = Analytics({
  app: "evezy-web",
  plugins: [inHousePlugin],
});

export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  try {
    analytics.track(eventName, properties);
  } catch (err) {
    console.warn("Analytics track error:", err);
  }
};
