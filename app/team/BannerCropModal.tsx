"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  FileImage,
  Layers,
  Maximize,
  Minimize,
} from "lucide-react";

export type BannerCropField = "image_horizontal" | "image_vertical";

interface BannerCropModalProps {
  initialUrl: string;
  defaultField: BannerCropField;
  supabase: any;
  onClose: () => void;
  onSave: (newUrl: string, targetField: BannerCropField) => void;
}

export default function BannerCropModal({
  initialUrl,
  defaultField,
  supabase,
  onClose,
  onSave,
}: BannerCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [targetField, setTargetField] = useState<BannerCropField>(defaultField);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "3:4" | "1:1" | "free">(
    defaultField === "image_vertical" ? "9:16" : "16:9"
  );
  const [fitMode, setFitMode] = useState<"cover" | "fit">("cover");
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [bgFill, setBgFill] = useState<"blur" | "black" | "white" | "slate" | "transparent">("blur");
  const [saveAsAvif, setSaveAsAvif] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savingStatus, setSavingStatus] = useState<string>("");
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load natural image dimensions
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    if (imageUrl.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => setImgNaturalSize({ width: img2.naturalWidth, height: img2.naturalHeight });
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Frame dimension calculation for preview container
  const getFrameSize = () => {
    const maxWidth = 520;
    const maxHeight = 380;

    if (aspectRatio === "16:9") {
      return { width: maxWidth, height: Math.round(maxWidth * (9 / 16)) };
    }
    if (aspectRatio === "9:16") {
      return { width: Math.round(maxHeight * (9 / 16)), height: maxHeight };
    }
    if (aspectRatio === "3:4") {
      return { width: Math.round(maxHeight * (3 / 4)), height: maxHeight };
    }
    if (aspectRatio === "1:1") {
      const size = Math.min(maxWidth, maxHeight);
      return { width: size, height: size };
    }
    // "free"
    if (imgNaturalSize) {
      const ar = imgNaturalSize.width / imgNaturalSize.height;
      if (ar >= 1) {
        return { width: maxWidth, height: Math.min(maxHeight, Math.round(maxWidth / ar)) };
      } else {
        return { width: Math.min(maxWidth, Math.round(maxHeight * ar)), height: maxHeight };
      }
    }
    return { width: maxWidth, height: maxHeight };
  };

  const { width: frameWidth, height: frameHeight } = getFrameSize();

  // Reset positioning when aspect ratio or fit mode changes
  useEffect(() => {
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
  }, [aspectRatio, fitMode]);

  // Calculate base scale and dimensions
  const getDisplaySize = () => {
    if (!imgNaturalSize) return { width: 0, height: 0, left: 0, top: 0 };

    const scaleCover = Math.max(frameWidth / imgNaturalSize.width, frameHeight / imgNaturalSize.height);
    const scaleFit = Math.min(frameWidth / imgNaturalSize.width, frameHeight / imgNaturalSize.height);
    const baseScale = fitMode === "cover" ? scaleCover : scaleFit;

    const displayWidth = imgNaturalSize.width * baseScale * zoom;
    const displayHeight = imgNaturalSize.height * baseScale * zoom;

    return {
      width: displayWidth,
      height: displayHeight,
      left: frameWidth / 2 + panX - displayWidth / 2,
      top: frameHeight / 2 + panY - displayHeight / 2,
      baseScale,
    };
  };

  const display = getDisplaySize();

  // Drag Handlers
  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    dragStart.current = { x: clientX - panX, y: clientY - panY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    setPanX(clientX - dragStart.current.x);
    setPanY(clientY - dragStart.current.y);
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const handleApplyCrop = async () => {
    if (!imgNaturalSize || !imageUrl) return;
    setSaving(true);
    setSavingStatus("Rendering high-res canvas...");

    try {
      // 1. Load the image cleanly for canvas
      const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        if (imageUrl.startsWith("http")) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = () => {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = () => reject(new Error("Failed to load source image for cropping."));
          retryImg.src = imageUrl;
        };
        img.src = imageUrl;
      });

      // 2. Determine target aspect ratio and canvas dimensions
      let targetAR = 16 / 9;
      if (aspectRatio === "9:16") targetAR = 9 / 16;
      else if (aspectRatio === "3:4") targetAR = 3 / 4;
      else if (aspectRatio === "1:1") targetAR = 1.0;
      else if (aspectRatio === "free") targetAR = imgNaturalSize.width / imgNaturalSize.height;

      // High-res output canvas (1920px base)
      let canvasWidth = 1920;
      let canvasHeight = Math.round(canvasWidth / targetAR);

      if (targetAR < 1) {
        // Vertical image
        canvasHeight = 1920;
        canvasWidth = Math.round(canvasHeight * targetAR);
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D canvas context");

      // 3. Draw Background Fill (surrounding area around pic)
      if (bgFill === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bgFill === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bgFill === "slate") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bgFill === "blur") {
        try {
          ctx.save();
          ctx.filter = "blur(40px) brightness(0.65)";
          const bgScale = Math.max(canvasWidth / loadedImg.width, canvasHeight / loadedImg.height) * 1.3;
          const bgW = loadedImg.width * bgScale;
          const bgH = loadedImg.height * bgScale;
          ctx.drawImage(loadedImg, (canvasWidth - bgW) / 2, (canvasHeight - bgH) / 2, bgW, bgH);
          ctx.restore();
        } catch {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }

      // 4. Calculate drawn position using exact UI scale factor k
      const k = canvasWidth / frameWidth;
      const drawnWidth = display.width * k;
      const drawnHeight = display.height * k;

      const canvasCenterX = (frameWidth / 2 + panX) * k;
      const canvasCenterY = (frameHeight / 2 + panY) * k;

      const drawX = canvasCenterX - drawnWidth / 2;
      const drawY = canvasCenterY - drawnHeight / 2;

      ctx.drawImage(loadedImg, drawX, drawY, drawnWidth, drawnHeight);

      // 5. Convert to Blob
      setSavingStatus("Exporting image...");
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas conversion to blob failed"));
        }, "image/png", 0.95);
      });

      // 6. Upload initial PNG to Supabase Storage
      setSavingStatus("Uploading to storage...");
      const timestamp = Date.now();
      const rawPath = `banners/${timestamp}-cropped.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("evphotos")
        .upload(rawPath, new File([blob], "cropped.png", { type: "image/png" }), { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      let finalPublicUrl = supabase.storage.from("evphotos").getPublicUrl(uploadData.path).data.publicUrl;

      // 7. Convert to AVIF if requested
      if (saveAsAvif) {
        setSavingStatus("Converting to AVIF format...");
        try {
          const avifRes = await fetch("/api/convert-to-avif", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: finalPublicUrl }),
          });

          if (avifRes.ok) {
            const avifBlob = await avifRes.blob();
            const avifPath = `banners/${timestamp}-cropped.avif`;
            const { data: avifData, error: avifError } = await supabase.storage
              .from("evphotos")
              .upload(avifPath, new File([avifBlob], "cropped.avif", { type: "image/avif" }), { upsert: true });

            if (!avifError && avifData) {
              finalPublicUrl = supabase.storage.from("evphotos").getPublicUrl(avifData.path).data.publicUrl;
            }
          }
        } catch (avifErr) {
          console.warn("AVIF conversion skipped:", avifErr);
        }
      }

      onSave(finalPublicUrl, targetField);
      onClose();
    } catch (err: any) {
      alert("Crop/Resize failed: " + (err.message || String(err)));
    } finally {
      setSaving(false);
      setSavingStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85  p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white border border-slate-200  shadow-card overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Crop &amp; Resize Banner
            </h3>
            <p className="text-[11px] text-ink-mute ">
              Crop, convert to vertical mobile banner, add surrounding area/padding, and export as AVIF.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-mute hover:text-slate-600 hover:bg-slate-100  transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - 2 Column Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Viewport & Presets (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Format & Sizing Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 ">
              {/* Aspect Ratio Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio("16:9");
                    setTargetField("image_horizontal");
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 aspectRatio === "16:9"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white  text-slate-600  hover:bg-slate-200"
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>16:9 Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio("9:16");
                    setTargetField("image_vertical");
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 aspectRatio === "9:16"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white  text-slate-600  hover:bg-slate-200"
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>9:16 Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAspectRatio("3:4");
                    setTargetField("image_vertical");
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 aspectRatio === "3:4"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white  text-slate-600  hover:bg-slate-200"
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>3:4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio("1:1")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 aspectRatio === "1:1"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white  text-slate-600  hover:bg-slate-200"
                  }`}
                >
                  <Square className="w-3 h-3" />
                  <span>1:1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio("free")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
 aspectRatio === "free"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white  text-slate-600  hover:bg-slate-200"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Free</span>
                </button>
              </div>

              {/* Sizing Mode (Fill vs Fit) */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setFitMode("cover")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
 fitMode === "cover"
                      ? "bg-white  text-emerald-600  shadow-xs"
                      : "text-slate-600  hover:text-slate-900"
                  }`}
                  title="Fill the frame edge-to-edge"
                >
                  <Maximize className="w-3 h-3" />
                  <span>Fill</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFitMode("fit")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
 fitMode === "fit"
                      ? "bg-white  text-emerald-600  shadow-xs"
                      : "text-slate-600  hover:text-slate-900"
                  }`}
                  title="Fit whole picture with surrounding area"
                >
                  <Minimize className="w-3 h-3" />
                  <span>Fit (Add Area)</span>
                </button>
              </div>
            </div>

            {/* Interactive Crop Viewport Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-800 min-h-[300px] select-none">
              <div
                className="relative overflow-hidden border-2 border-emerald-500 rounded-xl shadow-card cursor-grab active:cursor-grabbing bg-white"
                style={{
                  width: frameWidth,
                  height: frameHeight,
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  handleStart(e.clientX, e.clientY);
                }}
                onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={handleEnd}
              >
                {/* Background Fill (Surrounding Area) */}
                {bgFill === "blur" && (
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-60 scale-125 pointer-events-none"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                )}
                {bgFill === "white" && <div className="absolute inset-0 bg-white pointer-events-none" />}
                {bgFill === "black" && <div className="absolute inset-0 bg-white pointer-events-none" />}
                {bgFill === "slate" && <div className="absolute inset-0 bg-white pointer-events-none" />}

                {/* Main Draggable Image */}
                {display.width > 0 && (
                  <img
                    src={imageUrl}
                    alt="Banner preview"
                    draggable={false}
                    className="absolute pointer-events-none select-none max-w-none"
                    style={{
                      width: display.width,
                      height: display.height,
                      left: display.left,
                      top: display.top,
                    }}
                  />
                )}

                {/* Rule of Thirds Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-brand">
                  <div className="border-r border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-r border-b border-brand" />
                  <div className="border-b border-brand" />
                  <div className="border-r border-brand" />
                  <div className="border-r border-brand" />
                  <div />
                </div>
              </div>

              <p className="text-[10px] text-ink-mute mt-2 flex items-center gap-1">
                <span>💡 Drag image on canvas to pan &bull; Adjust size and position with sliders on the right</span>
              </p>
            </div>
          </div>

          {/* Right Column: Controls, Sliders & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              {/* Zoom & Space (Size) Slider */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 ">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-500" />
                    Size &amp; Space (Zoom)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFitMode("fit");
                        setZoom(0.85);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-emerald-100  hover:text-emerald-600"
                    >
                      Add Space
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFitMode("cover");
                        setZoom(1.0);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-emerald-100  hover:text-emerald-600"
                    >
                      Fit Edge
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1.0);
                        setPanX(0);
                        setPanY(0);
                      }}
                      className="p-1 rounded text-ink-mute hover:text-slate-600 "
                      title="Reset All"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-mute shrink-0">Space</span>
                  <ZoomOut size={13} className="text-ink-mute shrink-0" />
                  <input
                    type="range"
                    min="0.3"
                    max="3.5"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <ZoomIn size={13} className="text-ink-mute shrink-0" />
                  <span className="text-xs font-mono font-bold text-emerald-600 w-11 text-right shrink-0">
                    {zoom.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Up / Down Slider (Vertical) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 ">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 ">
                    ↕ Position: Up / Down
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPanY((prev) => Math.max(prev - 25, -Math.round(frameHeight * 0.8)))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Shift Up"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY(0)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Center Vertically"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY((prev) => Math.min(prev + 25, Math.round(frameHeight * 0.8)))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Shift Down"
                    >
                      ▼ Down
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-mute shrink-0">Up</span>
                  <input
                    type="range"
                    min={-Math.round(frameHeight * 0.8)}
                    max={Math.round(frameHeight * 0.8)}
                    step={1}
                    value={panY}
                    onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-ink-mute shrink-0">Down</span>
                  <span className="text-xs font-mono text-ink-mute w-8 text-right shrink-0">{panY}px</span>
                </div>
              </div>

              {/* Left / Right Slider (Horizontal) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 ">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 ">
                    ↔ Position: Left / Right
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPanX((prev) => Math.max(prev - 25, -Math.round(frameWidth * 0.8)))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Shift Left"
                    >
                      ◀ Left
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanX(0)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Center Horizontally"
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanX((prev) => Math.min(prev + 25, Math.round(frameWidth * 0.8)))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700  hover:bg-slate-300"
                      title="Shift Right"
                    >
                      ▶ Right
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-mute shrink-0">Left</span>
                  <input
                    type="range"
                    min={-Math.round(frameWidth * 0.8)}
                    max={Math.round(frameWidth * 0.8)}
                    step={1}
                    value={panX}
                    onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-ink-mute shrink-0">Right</span>
                  <span className="text-xs font-mono text-ink-mute w-8 text-right shrink-0">{panX}px</span>
                </div>
              </div>

              {/* Background Fill (Surrounding Area) */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 ">
                <span className="text-xs font-bold text-slate-600 shrink-0">Area Fill:</span>
                {(
                  [
                    { id: "blur", label: "Blur Photo" },
                    { id: "black", label: "Black" },
                    { id: "white", label: "White" },
                    { id: "slate", label: "Dark" },
                    { id: "transparent", label: "None" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBgFill(f.id)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${
 bgFill === f.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white  text-slate-600  hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Target Field & Format Options */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200  space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Save Result To:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetField("image_horizontal")}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
 targetField === "image_horizontal"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-white  text-slate-600  border-slate-200  hover:bg-slate-100"
                      }`}
                    >
                      Desktop (Horizontal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetField("image_vertical")}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
 targetField === "image_vertical"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                          : "bg-white  text-slate-600  border-slate-200  hover:bg-slate-100"
                      }`}
                    >
                      Mobile (Vertical)
                    </button>
                  </div>
                </div>

                {/* AVIF Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200/60 ">
                  <input
                    type="checkbox"
                    checked={saveAsAvif}
                    onChange={(e) => setSaveAsAvif(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <FileImage className="w-3 h-3 text-emerald-600" />
                    Export as AVIF (Recommended)
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 ">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200  transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={saving || !imageUrl}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{savingStatus || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Apply &amp; Save Banner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

