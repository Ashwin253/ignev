"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const slug = pathname.startsWith("/product/") ? pathname.split("/product/")[1] : "";
    const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, slug, referrer: document.referrer, device }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
