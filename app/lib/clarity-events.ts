"use client";

import Clarity from "@microsoft/clarity";

/**
 * High-intent EV platform user interaction events.
 */
export const SMART_EVENTS = {
  TEST_DRIVE_INQUIRY: "test_drive_booking_inquiry",
  EV_COMPARISON: "ev_model_comparison",
  CHARGING_STATION_SEARCH: "charging_station_search",
  CATALOG_FILTER: "catalog_filter_search",
  EMI_CALCULATOR: "emi_subsidy_calculator",
  AI_ASSISTANT_QUERY: "ev_ai_assistant_query",
  BROCHURE_DOWNLOAD: "brochure_spec_download",
  DEALER_WHATSAPP: "dealer_whatsapp_connect",
} as const;

export type SmartEventName = (typeof SMART_EVENTS)[keyof typeof SMART_EVENTS] | string;

/**
 * Safely dispatch a custom event to Microsoft Clarity session telemetry.
 */
export function trackSmartEvent(eventName: SmartEventName, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    // 1. Send event to Microsoft Clarity
    Clarity.event(eventName);

    // 2. Also log locally or to telemetry if debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[Clarity Telemetry] Event fired: "${eventName}"`, properties || "");
    }
  } catch (err) {
    // Non-fatal telemetry dispatch failure
  }
}
