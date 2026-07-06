"use client";

import React, { useState, useEffect, useRef } from "react";

interface LazyViewportProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export default function LazyViewport({
  children,
  fallback,
  rootMargin = "250px", // triggers loading slightly before entering viewport
  threshold = 0.01,
}: LazyViewportProps) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { rootMargin, threshold }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasIntersected, rootMargin, threshold]);

  if (hasIntersected) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="w-full">
      {fallback}
    </div>
  );
}
