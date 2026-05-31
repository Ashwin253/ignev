"use client";

import { createContext, useContext, useMemo, useState } from "react";
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
