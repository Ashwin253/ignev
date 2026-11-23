"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CI360Viewer } from "@cloudimage/360-view/react";
import type { CI360ViewerRef } from "@cloudimage/360-view/react";

interface Vehicle360ViewerProps {
  images: string[];
}

export default function Vehicle360Viewer({ images }: Vehicle360ViewerProps) {
  const viewerRef = useRef<CI360ViewerRef>(null);

  return (
    <div className="relative min-h-0 w-full flex-1 bg-slate-50">
      <CI360Viewer
        ref={viewerRef}
        imageListX={images}
        amountX={images.length}
        aspectRatio="16/9"
        theme="light"
        draggable
        swipeable
        keys
        inertia
        dragSpeed={100}
        pinchZoom
        zoomControls
        zoomControlsPosition="bottom-right"
        zoomMax={4}
        bottomCircle
        hide360Logo
        initialIconShown={false}
        hints={false}
        autoplay={false}
        style={{ width: "100%" }}
      />
      <button
        type="button"
        onClick={() => viewerRef.current?.moveLeft(1)}
        aria-label="Rotate vehicle left"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 sm:left-5 sm:p-3"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={() => viewerRef.current?.moveRight(1)}
        aria-label="Rotate vehicle right"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 sm:right-5 sm:p-3"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
