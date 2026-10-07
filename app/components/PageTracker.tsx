"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analytics } from "../lib/analytics";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    analytics.page({
      path: pathname,
    });
  }, [pathname]);

  return null;
}
