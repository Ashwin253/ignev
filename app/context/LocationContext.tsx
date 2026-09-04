"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface LocationItem {
  id: string;
  name: string;
  state: string;
  aliases: string[];
}

export const AVAILABLE_LOCATIONS: LocationItem[] = [
  { id: "ncr", name: "NCR", state: "Delhi NCR", aliases: ["ncr", "delhi", "new delhi", "gurgaon", "noida", "ghaziabad", "faridabad"] },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", aliases: ["mumbai", "bombay", "navi mumbai", "thane"] },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", aliases: ["bengaluru", "bangalore"] },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", aliases: ["hyderabad", "secunderabad"] },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", aliases: ["chennai", "madras"] },
  { id: "pune", name: "Pune", state: "Maharashtra", aliases: ["pune", "pcmc"] },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", aliases: ["ahmedabad", "gandhinagar"] },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", aliases: ["kolkata", "calcutta"] },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", aliases: ["jaipur"] },
  { id: "kochi", name: "Kochi", state: "Kerala", aliases: ["kochi", "cochin", "ernakulam"] },
  { id: "chandigarh", name: "Chandigarh", state: "Punjab / Haryana", aliases: ["chandigarh", "mohali", "panchkula"] },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", aliases: ["lucknow"] },
  { id: "goa", name: "Goa", state: "Goa", aliases: ["goa", "panaji"] },
  { id: "surat", name: "Surat", state: "Gujarat", aliases: ["surat"] },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", aliases: ["indore"] },
];

export const DEFAULT_LOCATION = AVAILABLE_LOCATIONS[0]; // NCR

interface LocationContextType {
  location: LocationItem;
  setLocation: (locOrId: LocationItem | string) => void;
  locations: LocationItem[];
}

const LocationContext = createContext<LocationContextType>({
  location: DEFAULT_LOCATION,
  setLocation: () => {},
  locations: AVAILABLE_LOCATIONS,
});

const STORAGE_KEY = "evezy_user_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<LocationItem>(DEFAULT_LOCATION);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = AVAILABLE_LOCATIONS.find(
          (l) => l.id.toLowerCase() === saved.toLowerCase() || l.name.toLowerCase() === saved.toLowerCase()
        );
        if (found) {
          setLocationState(found);
        }
      }
    } catch {
      // localStorage may be unavailable or restricted
    }
  }, []);

  const setLocation = (locOrId: LocationItem | string) => {
    let next: LocationItem | undefined;
    if (typeof locOrId === "string") {
      const query = locOrId.trim().toLowerCase();
      next = AVAILABLE_LOCATIONS.find(
        (l) => l.id.toLowerCase() === query || l.name.toLowerCase() === query || l.aliases.some((a) => a.toLowerCase() === query)
      );
    } else {
      next = locOrId;
    }

    const target = next || DEFAULT_LOCATION;
    setLocationState(target);
    try {
      localStorage.setItem(STORAGE_KEY, target.id);
    } catch {
      // ignore
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location: mounted ? location : DEFAULT_LOCATION,
        setLocation,
        locations: AVAILABLE_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
