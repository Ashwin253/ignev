"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "wn79e9rkpe";

/**
 * Initialises Microsoft Clarity using the official @microsoft/clarity package.
 * Project ID is read from NEXT_PUBLIC_CLARITY_PROJECT_ID env var,
 * falling back to the hardcoded ID "wpuxsm04uu".
 */
export default function ClarityScript() {
  useEffect(() => {
    if (!PROJECT_ID) return;
    Clarity.init(PROJECT_ID);
  }, []);

  return null;
}
