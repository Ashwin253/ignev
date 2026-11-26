"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface Vehicle360ViewerProps {
  images: string[];
}

/** Dependency-free turntable for direct Supabase Storage image URLs. */
export default function Vehicle360Viewer({ images }: Vehicle360ViewerProps) {
  const frames = images.filter(Boolean);
  const [frame, setFrame] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartFrame = useRef(0);
  const activeFrame = Math.min(frame, Math.max(0, frames.length - 1));

  if (!frames.length) return null;

  const rotate = (direction: -1 | 1) => {
    setFrame((current) => (current + direction + frames.length) % frames.length);
  };

  const startDrag = (clientX: number) => {
    dragStartX.current = clientX;
    dragStartFrame.current = activeFrame;
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX.current === null) return;
    const step = Math.trunc((dragStartX.current - clientX) / 36);
    const next = ((dragStartFrame.current + step) % frames.length + frames.length) % frames.length;
    setFrame(next);
  };

  const finishDrag = () => { dragStartX.current = null; };

  return (
    <div
      className="relative h-full min-h-0 w-full select-none touch-pan-y overflow-hidden bg-slate-100"
      role="region"
      aria-label="360 degree product view. Drag or use arrow buttons to rotate."
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") rotate(-1);
        if (event.key === "ArrowRight") rotate(1);
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        startDrag(event.clientX);
      }}
      onPointerMove={(event) => moveDrag(event.clientX)}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <img
        key={frames[activeFrame]}
        src={frames[activeFrame]}
        alt={`360° vehicle view, angle ${activeFrame + 1} of ${frames.length}`}
        draggable={false}
        className="pointer-events-none h-full w-full object-contain"
      />

      <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
        <RotateCw size={12} className="text-volt" /> {activeFrame + 1} / {frames.length}
      </div>

      <button type="button" onClick={(event) => { event.stopPropagation(); rotate(-1); }} aria-label="Rotate vehicle left" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 sm:left-5 sm:p-3">
        <ChevronLeft size={22} />
      </button>
      <button type="button" onClick={(event) => { event.stopPropagation(); rotate(1); }} aria-label="Rotate vehicle right" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 sm:right-5 sm:p-3">
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
