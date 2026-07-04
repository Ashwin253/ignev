"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";

interface ImageItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingBrand: string;
  url: string;
  type: "main" | "featured" | "gallery";
  index: number;
  rawItem?: any;
}

interface EvListingRow {
  id: string;
  title: string;
  brand: string;
  photo: string;
  featured_photos: any;
  gallery_images: any;
}

interface CropModalProps {
  image: ImageItem;
  supabase: any;
  listings: EvListingRow[];
  fetchListings: () => Promise<void>;
  onClose: () => void;
  onSaveCallback?: (newUrl: string) => void;
}

export default function CropModal({
  image,
  supabase,
  listings,
  fetchListings,
  onClose,
  onSaveCallback
}: CropModalProps) {
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [bgFill, setBgFill] = useState<"transparent" | "white" | "black">("transparent");
  const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9" | "1:1" | "free">("4:3");
  const [saving, setSaving] = useState<boolean>(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get base crop frame dimensions
  const getFrameSize = () => {
    const maxWidth = 480;
    const maxHeight = 360;

    if (aspectRatio === "4:3") {
      return { width: maxWidth, height: maxHeight };
    }
    if (aspectRatio === "16:9") {
      return { width: maxWidth, height: Math.round(maxWidth * (9 / 16)) };
    }
    if (aspectRatio === "1:1") {
      const size = Math.min(maxWidth, maxHeight);
      return { width: size, height: size };
    }
    // "free" aspect ratio - matches the natural image aspect ratio if known
    if (imgNaturalSize) {
      const ar = imgNaturalSize.width / imgNaturalSize.height;
      if (ar >= 1) {
        return { width: maxWidth, height: Math.round(maxWidth / ar) };
      } else {
        return { width: Math.round(maxHeight * ar), height: maxHeight };
      }
    }
    return { width: maxWidth, height: maxHeight };
  };

  const { width: frameWidth, height: frameHeight } = getFrameSize();

  // Reset positioning when aspect ratio changes
  useEffect(() => {
    setPanX(0);
    setPanY(0);
  }, [aspectRatio]);

  // Compute base dimensions of the image to object-contain within the frame
  const getBaseImageSize = () => {
    if (!imgNaturalSize) return { width: 0, height: 0, left: 0, top: 0 };

    const scaleToFit = Math.min(frameWidth / imgNaturalSize.width, frameHeight / imgNaturalSize.height);
    const baseWidth = imgNaturalSize.width * scaleToFit;
    const baseHeight = imgNaturalSize.height * scaleToFit;

    return {
      width: baseWidth,
      height: baseHeight,
      left: (frameWidth - baseWidth) / 2,
      top: (frameHeight - baseHeight) / 2,
    };
  };

  const baseImage = getBaseImageSize();

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  const handleApplyCrop = async () => {
    if (!imgNaturalSize) return;
    setSaving(true);

    try {
      // 1. Load the image cleanly for canvas (handling crossOrigin)
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load source image for cropping"));
        img.src = image.url;
      });

      // 2. Determine canvas size based on original aspect ratio / dimensions
      let targetAR = 4 / 3;
      if (aspectRatio === "16:9") targetAR = 16 / 9;
      else if (aspectRatio === "1:1") targetAR = 1.0;
      else if (aspectRatio === "free") targetAR = imgNaturalSize.width / imgNaturalSize.height;

      // Base canvas size on original image dimensions to preserve resolution
      let canvasWidth = imgNaturalSize.width;
      let canvasHeight = imgNaturalSize.height;

      if (targetAR >= 1) {
        canvasWidth = imgNaturalSize.width;
        canvasHeight = Math.round(canvasWidth / targetAR);
      } else {
        canvasHeight = imgNaturalSize.height;
        canvasWidth = Math.round(canvasHeight * targetAR);
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2D canvas context");
      }

      // 3. Draw background color if not transparent
      if (bgFill === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bgFill === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }

      // 4. Calculate drawn position using zoom & pan factors
      const k = canvasWidth / frameWidth; // scale factor between UI and canvas
      const drawnWidth = baseImage.width * zoom * k;
      const drawnHeight = baseImage.height * zoom * k;

      const uiCenterX = frameWidth / 2 + panX;
      const uiCenterY = frameHeight / 2 + panY;

      const canvasCenterX = uiCenterX * k;
      const canvasCenterY = uiCenterY * k;

      const drawX = canvasCenterX - drawnWidth / 2;
      const drawY = canvasCenterY - drawnHeight / 2;

      ctx.drawImage(loadedImg, drawX, drawY, drawnWidth, drawnHeight);

      // 5. Convert to Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas conversion to blob failed"));
        }, "image/png");
      });

      // 6. Upload to Supabase Storage
      const brand = image.listingBrand.toLowerCase().replace(/[^a-z0-9]/g, "");
      const title = image.listingTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let sig = `${brand}-${title}-${image.type}`;
      if (image.type !== "main") {
        sig += `-${image.index}`;
      }
      
      const filename = `${sig}-cropped.png`;
      const path = `vehicles/${Date.now()}-${sig}.png`;
      
      const { data, error } = await supabase.storage.from("evphotos").upload(path, new File([blob], filename, { type: "image/png" }), { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setSaving(false);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

      // If onSaveCallback is provided, skip the DB update and let the parent handle it
      if (onSaveCallback) {
        onSaveCallback(publicUrl);
        setSaving(false);
        onClose();
        return;
      }

      // 7. Find and update the original listing row in Supabase
      const listing = listings.find((l) => l.id === image.listingId);
      if (!listing) return;

      let updatePayload: Partial<EvListingRow> = {};

      if (image.type === "main") {
        updatePayload.photo = publicUrl;
      } else if (image.type === "featured") {
        const rawPhotos = Array.isArray(listing.featured_photos)
          ? [...listing.featured_photos]
          : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

        if (typeof rawPhotos[image.index] === "string") {
          rawPhotos[image.index] = publicUrl;
        } else {
          rawPhotos[image.index] = { ...rawPhotos[image.index], url: publicUrl };
        }
        updatePayload.featured_photos = rawPhotos;
      } else if (image.type === "gallery") {
        const rawGallery = Array.isArray(listing.gallery_images)
          ? [...listing.gallery_images]
          : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

        if (typeof rawGallery[image.index] === "string") {
          rawGallery[image.index] = publicUrl;
        } else {
          rawGallery[image.index] = { ...rawGallery[image.index], url: publicUrl };
        }
        updatePayload.gallery_images = rawGallery;
      }

      const { error: updateError } = await supabase
        .from("evlistings")
        .update(updatePayload)
        .eq("id", image.listingId);

      if (updateError) {
        alert("Failed to update database: " + updateError.message);
      } else {
        // Auto rebuild search summary
        fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
        await fetchListings();
        onClose();
      }
    } catch (err: any) {
      alert("Cropping failed: " + err.message);
    }
    setSaving(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Editor Area (Left/Top) */}
        <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-[400px] md:min-h-0 border-r border-slate-900">
          
          {/* Headline info for layout */}
          <div className="absolute top-4 left-4 z-10 text-white/60 text-[10px] uppercase font-bold tracking-wider">
            {image.listingTitle} ({image.type})
          </div>

          {/* Interactive Crop Frame */}
          <div
            ref={containerRef}
            className="relative overflow-hidden border border-slate-800 rounded-xl select-none cursor-move transition-all duration-300"
            style={{
              width: `${frameWidth}px`,
              height: `${frameHeight}px`,
              backgroundColor: bgFill === "transparent" ? "transparent" : bgFill,
              backgroundImage: bgFill === "transparent" 
                ? "linear-gradient(45deg, #09090b 25%, transparent 25%, transparent 75%, #09090b 75%, #09090b), linear-gradient(45deg, #09090b 25%, #18181b 25%, #18181b 75%, #09090b 75%, #09090b)"
                : "none",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px"
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
          >
            {/* The Image inside crop container */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt="Crop target"
              onLoad={handleImageLoad}
              className="absolute select-none pointer-events-none max-w-none"
              style={{
                width: `${baseImage.width}px`,
                height: `${baseImage.height}px`,
                left: `${baseImage.left}px`,
                top: `${baseImage.top}px`,
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />

            {/* Subtle Overlay Guide lines (rule of thirds) */}
            <div className="absolute inset-0 pointer-events-none border border-white/20">
              <div className="absolute top-0 bottom-0 left-1/3 border-r border-white/10 border-dashed" />
              <div className="absolute top-0 bottom-0 left-2/3 border-r border-white/10 border-dashed" />
              <div className="absolute left-0 right-0 top-1/3 border-b border-white/10 border-dashed" />
              <div className="absolute left-0 right-0 top-2/3 border-b border-white/10 border-dashed" />
            </div>
          </div>

          <div className="absolute bottom-4 text-center text-slate-400 text-[10px] flex items-center gap-1.5 pointer-events-none">
            <Move size={12} /> Drag image to position • Pinch/slide below to zoom
          </div>
        </div>

        {/* Controls Panel (Right/Bottom) */}
        <div className="w-full md:w-80 bg-white p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-slate-900">Crop & Resize</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["4:3", "16:9", "1:1", "free"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-3 text-xs font-bold border rounded-xl capitalize transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {ratio === "free" ? "Free / As-Is" : ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Zoom / Scale
                </label>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut size={14} className="text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <ZoomIn size={14} className="text-slate-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tip: Slide below 100% to zoom out and add surrounding space.
              </p>
            </div>

            {/* Background color for margins */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Background Padding Fill
              </label>
              <div className="flex gap-2">
                {(["transparent", "white", "black"] as const).map((fill) => (
                  <button
                    key={fill}
                    onClick={() => setBgFill(fill)}
                    className={`flex-1 py-2 text-xs font-bold border rounded-xl capitalize transition-all cursor-pointer ${
                      bgFill === fill
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {fill === "transparent" ? "🏁 Transparent" : fill === "white" ? "⚪ White" : "⚫ Black"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 px-3 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            
            <button
              onClick={handleApplyCrop}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all disabled:bg-slate-400 cursor-pointer shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
