"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompareContextType {
  selectedSlugs: string[];
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("compare_slugs");
    if (saved) {
      try {
        setSelectedSlugs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse compare slugs", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("compare_slugs", JSON.stringify(selectedSlugs));
  }, [selectedSlugs]);

  const addToCompare = (slug: string) => {
    if (selectedSlugs.length >= 4) {
      alert("You can compare up to 4 vehicles at a time.");
      return;
    }
    if (!selectedSlugs.includes(slug)) {
      setSelectedSlugs((prev) => [...prev, slug]);
    }
  };

  const removeFromCompare = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const clearCompare = () => setSelectedSlugs([]);

  const isInCompare = (slug: string) => selectedSlugs.includes(slug);

  return (
    <CompareContext.Provider value={{ selectedSlugs, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    // Return a safe mocked implementation for server-side or un-wrapped components
    return {
      selectedSlugs: [],
      addToCompare: () => {},
      removeFromCompare: () => {},
      clearCompare: () => {},
      isInCompare: () => false,
    };
  }
  return context;
}
