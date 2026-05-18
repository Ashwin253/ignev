"use client";

import { useState } from "react";
import ColorList from "./ColorList";

export default function ProductColorStrip({ colors, galleryImages }: { colors: string[]; galleryImages: string[] }) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  if (!colors || colors.length === 0) return null;

  return (
    <ColorList
      colors={colors}
      galleryImages={galleryImages}
      activeColor={colors[activeColorIndex] ? `#${colors[activeColorIndex].replace("#", "")}` : null}
      onSelectColor={(hex, index) => {
        setActiveColorIndex(index);
        if (galleryImages[index]) {
          window.dispatchEvent(new CustomEvent("gallery-set-image", { detail: { index } }));
        }
      }}
    />
  );
}
