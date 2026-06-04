"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { EvListing } from "../lib/wordpress";

type ProductSelectionContextValue = {
  selectedIndex: number;
  showBaas: boolean;
  selectedVariantName: string;
  activeVariants: EvListing["batteryVariants"];
  setSelectedIndex: (index: number) => void;
  setShowBaas: (value: boolean) => void;
  selectVariantByName: (variantName: string) => void;
};

const ProductSelectionContext = createContext<ProductSelectionContextValue | null>(null);

export function ProductSelectionProvider({ item, children }: { item: EvListing; children: React.ReactNode }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBaasState, setShowBaasState] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const variantQuery = searchParams.get("variant");
    const baasQuery = searchParams.get("baas");

    let initialBaas = false;
    if (baasQuery === "true") {
      initialBaas = true;
      setShowBaasState(true);
    }

    if (variantQuery) {
      const variantsToSearch = initialBaas ? item.baasVariants : item.batteryVariants;
      const index = variantsToSearch.findIndex((v) => v.modelName === variantQuery);
      if (index >= 0) {
        setSelectedIndex(index);
      }
    }
    setInitialized(true);
  }, [item]);

  useEffect(() => {
    if (!initialized) return;

    const searchParams = new URLSearchParams(window.location.search);
    let changed = false;

    if (showBaasState) {
      if (searchParams.get("baas") !== "true") {
        searchParams.set("baas", "true");
        changed = true;
      }
    } else {
      if (searchParams.has("baas")) {
        searchParams.delete("baas");
        changed = true;
      }
    }

    const currentVariant = showBaasState ? item.baasVariants[selectedIndex] : item.batteryVariants[selectedIndex];
    const currentVariantName = currentVariant?.modelName;

    if (currentVariantName) {
      if (searchParams.get("variant") !== currentVariantName) {
        searchParams.set("variant", currentVariantName);
        changed = true;
      }
    }

    if (changed) {
      const newQuery = searchParams.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedIndex, showBaasState, initialized, item]);

  const activeVariants = showBaasState ? item.baasVariants : item.batteryVariants;

  const selectedVariantName = useMemo(() => {
    const variant = activeVariants[selectedIndex];
    return variant?.modelName || (variant?.capacity ? `${variant.capacity} kWh` : "");
  }, [activeVariants, selectedIndex]);

  const setShowBaas = (value: boolean) => {
    setShowBaasState(value);
    setSelectedIndex(0);
  };

  const selectVariantByName = (variantName: string) => {
    const index = activeVariants.findIndex((variant) => (
      variant.modelName === variantName || `${variant.capacity} kWh` === variantName
    ));
    if (index >= 0) setSelectedIndex(index);
  };

  return (
    <ProductSelectionContext.Provider
      value={{
        selectedIndex,
        showBaas: showBaasState,
        selectedVariantName,
        activeVariants,
        setSelectedIndex,
        setShowBaas,
        selectVariantByName,
      }}
    >
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelection() {
  const context = useContext(ProductSelectionContext);
  if (!context) throw new Error("useProductSelection must be used inside ProductSelectionProvider");
  return context;
}
