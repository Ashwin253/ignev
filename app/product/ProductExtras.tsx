"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "../lib/recently-viewed";

/** Tracks recently viewed products. */
export default function ProductExtras({ slug }: { slug: string }) {
  useEffect(() => {
    pushRecentlyViewed(slug);
  }, [slug]);

  return null;
}
