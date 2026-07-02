"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Download, Trash2, Upload, Search, Loader2, RefreshCw, X, CheckCircle, Sparkles, Crop, FlipHorizontal
} from "lucide-react";
import CropModal from "./CropModal";

interface EvListingRow {
  id: string;
  title: string;
  brand: string;
  photo: string;
  featured_photos: any;
  gallery_images: any;
}

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

interface LogEntry {
  message: string;
  type: "success" | "error" | "info";
}

const BRAND_MAP: Record<string, string> = {
  "Ather": "ATHER",
  "Euler": "EULER MOTORS",
  "TVS": "TVS",
  "Bajaj": "BAJAJ",
  "Ola": "OLA",
  "Vida": "VIDA",
  "Revolt": "REVOLT",
  "Mahindra": "MAHINDRA LAST MILE MOBILITY",
  "Montra": "MONTRA",
  "Tata": "TATA MOTORS",
};

export default function MediaPanel({ supabase }: { supabase: any }) {
  const [listings, setListings] = useState<EvListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bgType, setBgType] = useState<"checkerboard" | "white" | "dark">("checkerboard");

  // Client-side AI background removal states
  const [bgRemovingId, setBgRemovingId] = useState<string | null>(null);
  const [bgRemoveProgress, setBgRemoveProgress] = useState<string>("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Bulk operation states
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkLog, setBulkLog] = useState<LogEntry[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Crop & Flip Horizontal states
  const [flippingId, setFlippingId] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<ImageItem | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("evlistings")
        .select("id, title, brand, photo, featured_photos, gallery_images")
        .order("title");

      if (error) {
        console.error("Fetch listings error:", error.message);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error("Exception fetching listings:", err);
    }
    setLoading(false);
  };

  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    listings.forEach((l) => {
      if (l.brand) brands.add(l.brand.trim().toUpperCase());
    });
    return Array.from(brands).sort();
  }, [listings]);

  // Flatten images from all listings
  const imageItems = useMemo(() => {
    const items: ImageItem[] = [];

    listings.forEach((l) => {
      // 1. Main photo
      if (l.photo) {
        items.push({
          id: `${l.id}-main-0`,
          listingId: l.id,
          listingTitle: l.title,
          listingBrand: l.brand,
          url: l.photo,
          type: "main",
          index: 0,
        });
      }

      // 2. Featured/Variant photos
      const featured = Array.isArray(l.featured_photos) 
        ? l.featured_photos 
        : (() => {
            try {
              return typeof l.featured_photos === "string" ? JSON.parse(l.featured_photos) : [];
            } catch {
              return [];
            }
          })();

      if (Array.isArray(featured)) {
        featured.forEach((item: any, idx: number) => {
          const url = typeof item === "string" ? item : item?.url;
          if (url) {
            items.push({
              id: `${l.id}-featured-${idx}`,
              listingId: l.id,
              listingTitle: l.title,
              listingBrand: l.brand,
              url,
              type: "featured",
              index: idx,
              rawItem: item,
            });
          }
        });
      }

      // 3. Gallery photos
      const gallery = Array.isArray(l.gallery_images) 
        ? l.gallery_images 
        : (() => {
            try {
              return typeof l.gallery_images === "string" ? JSON.parse(l.gallery_images) : [];
            } catch {
              return [];
            }
          })();

      if (Array.isArray(gallery)) {
        gallery.forEach((item: any, idx: number) => {
          const url = typeof item === "string" ? item : item?.url;
          if (url) {
            items.push({
              id: `${l.id}-gallery-${idx}`,
              listingId: l.id,
              listingTitle: l.title,
              listingBrand: l.brand,
              url,
              type: "gallery",
              index: idx,
              rawItem: item,
            });
          }
        });
      }
    });

    return items;
  }, [listings]);

  // Filtered images
  const filteredImages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return imageItems.filter((img) => {
      // Search matches listing title or brand or URL
      if (q) {
        const matchTitle = img.listingTitle.toLowerCase().includes(q);
        const matchBrand = img.listingBrand.toLowerCase().includes(q);
        const matchUrl = img.url.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchUrl) return false;
      }

      // Brand filter
      if (selectedBrand !== "all" && img.listingBrand.trim().toUpperCase() !== selectedBrand) {
        return false;
      }

      // Type filter
      if (selectedType !== "all" && img.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [imageItems, searchQuery, selectedBrand, selectedType]);

  // Helpers for Signatures and Extensions
  const getFileExtension = (url: string): string => {
    try {
      const cleanUrl = url.split("?")[0];
      const parts = cleanUrl.split(".");
      const ext = parts[parts.length - 1];
      if (ext && ext.length <= 4) return ext.toLowerCase();
      return "png";
    } catch {
      return "png";
    }
  };

  const getFileSignature = (img: ImageItem): string => {
    const brand = img.listingBrand.toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = img.listingTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let sig = `${brand}-${title}-${img.type}`;
    if (img.type !== "main") {
      sig += `-${img.index}`;
    }
    return sig;
  };

  const getNormalizedSignature = (rawSig: string): string => {
    let sig = rawSig.toLowerCase().trim();
    
    // Remove copy suffixes: e.g. " (1)", "(1)", " 1", "-1", "_1"
    sig = sig.replace(/\s*\(\d+\)\s*$/, "");
    sig = sig.replace(/[\s\-_]\d+\s*$/, "");
    
    // Normalize spaces and underscores to dashes
    sig = sig.replace(/[\s_]+/g, "-");
    // Collapse multiple dashes
    sig = sig.replace(/-+/g, "-");
    
    // Clean trailing dashes/spaces
    sig = sig.trim().replace(/[\s\-_]+$/, "");
    
    return sig;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  // Bulk Actions
  const handleBulkDownload = async () => {
    if (filteredImages.length === 0) return;
    if (!confirm(`Do you want to download all ${filteredImages.length} images for the selected brand filters?`)) return;

    for (let i = 0; i < filteredImages.length; i++) {
      const img = filteredImages[i];
      const sig = getFileSignature(img);
      const ext = getFileExtension(img.url);
      const filename = `${sig}.${ext}`;
      await handleDownload(img.url, filename);
      // Wait 250ms to prevent triggering browser batch-download blocking
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkProcessing(true);
    setBulkLog([]);
    setShowBulkModal(true);

    const fileList = Array.from(files);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Get filename signature (remove extension)
      const rawUploadSig = file.name.replace(/\.[^/.]+$/, "");
      const uploadSig = getNormalizedSignature(rawUploadSig);

      // Find match in current image items
      const matchedImg = imageItems.find((img) => getFileSignature(img) === uploadSig);

      if (!matchedImg) {
        setBulkLog((prev) => [
          ...prev, 
          { message: `❌ File "${file.name}": No matching image signature found in database.`, type: "error" }
        ]);
        continue;
      }

      setBulkLog((prev) => [
        ...prev, 
        { message: `⏳ Matching file "${file.name}" to listing "${matchedImg.listingTitle}" (${matchedImg.type})...`, type: "info" }
      ]);

      try {
        const path = `vehicles/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
        const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

        if (error) {
          setBulkLog((prev) => [
            ...prev, 
            { message: `❌ Storage upload failed for "${file.name}": ${error.message}`, type: "error" }
          ]);
          continue;
        }

        const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

        // Retrieve fresh listing data to prevent concurrent write overrides
        const { data: freshListings, error: fetchError } = await supabase
          .from("evlistings")
          .select("id, title, brand, photo, featured_photos, gallery_images")
          .eq("id", matchedImg.listingId);

        if (fetchError || !freshListings || freshListings.length === 0) {
          setBulkLog((prev) => [
            ...prev, 
            { message: `❌ Failed to fetch listing row for "${matchedImg.listingTitle}" from database.`, type: "error" }
          ]);
          continue;
        }

        const listing = freshListings[0];
        let updatePayload: Partial<EvListingRow> = {};

        if (matchedImg.type === "main") {
          updatePayload.photo = publicUrl;
        } else if (matchedImg.type === "featured") {
          const rawPhotos = Array.isArray(listing.featured_photos)
            ? [...listing.featured_photos]
            : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

          if (typeof rawPhotos[matchedImg.index] === "string") {
            rawPhotos[matchedImg.index] = publicUrl;
          } else {
            rawPhotos[matchedImg.index] = { ...rawPhotos[matchedImg.index], url: publicUrl };
          }
          updatePayload.featured_photos = rawPhotos;
        } else if (matchedImg.type === "gallery") {
          const rawGallery = Array.isArray(listing.gallery_images)
            ? [...listing.gallery_images]
            : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

          if (typeof rawGallery[matchedImg.index] === "string") {
            rawGallery[matchedImg.index] = publicUrl;
          } else {
            rawGallery[matchedImg.index] = { ...rawGallery[matchedImg.index], url: publicUrl };
          }
          updatePayload.gallery_images = rawGallery;
        }

        const { error: updateError } = await supabase
          .from("evlistings")
          .update(updatePayload)
          .eq("id", matchedImg.listingId);

        if (updateError) {
          setBulkLog((prev) => [
            ...prev, 
            { message: `❌ DB update failed for "${file.name}": ${updateError.message}`, type: "error" }
          ]);
        } else {
          setBulkLog((prev) => [
            ...prev, 
            { message: `✅ Successfully replaced "${file.name}" for "${matchedImg.listingTitle}"!`, type: "success" }
          ]);
        }
      } catch (err: any) {
        setBulkLog((prev) => [
          ...prev, 
          { message: `❌ Process error for "${file.name}": ${err.message}`, type: "error" }
        ]);
      }
    }

    // Refresh and rebuild summary summary
    fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
    await fetchListings();
    setBulkProcessing(false);
  };

  const convertToImageBlob = (url: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas conversion to Blob failed"));
          }
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load source image for decoding"));
      img.src = url;
    });
  };

  // Client-side AI Background Removal
  const handleRemoveBg = async (item: ImageItem) => {
    if (!confirm("Are you sure you want to remove the background of this image? The transparent PNG will immediately replace the original in the database.")) return;

    setBgRemovingId(item.id);
    setBgRemoveProgress("Decoding...");

    try {
      // Decode image first (resolves AVIF/WebP / other library incompatibility issues)
      const decodedBlob = await convertToImageBlob(item.url);

      setBgRemoveProgress("Loading AI...");
      // Dynamic import to avoid next.js SSR build errors
      const imgly = await import("@imgly/background-removal");
      const removeBackground = imgly.removeBackground as any;

      const sig = getFileSignature(item);
      const filename = `${sig}.png`;

      const config = {
        model: "small" as const,
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100);
          if (key.includes("fetch")) {
            setBgRemoveProgress(`AI model... ${percent}%`);
          } else {
            setBgRemoveProgress(`Removing... ${percent}%`);
          }
        }
      };

      const blob = await removeBackground(decodedBlob, config);
      setBgRemoveProgress("Uploading...");

      const file = new File([blob], filename, { type: "image/png" });
      const path = `vehicles/${Date.now()}-${sig}.png`;
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setBgRemovingId(null);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

      // Find original listing row
      const listing = listings.find((l) => l.id === item.listingId);
      if (!listing) return;

      let updatePayload: Partial<EvListingRow> = {};

      if (item.type === "main") {
        updatePayload.photo = publicUrl;
      } else if (item.type === "featured") {
        const rawPhotos = Array.isArray(listing.featured_photos)
          ? [...listing.featured_photos]
          : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

        if (typeof rawPhotos[item.index] === "string") {
          rawPhotos[item.index] = publicUrl;
        } else {
          rawPhotos[item.index] = { ...rawPhotos[item.index], url: publicUrl };
        }
        updatePayload.featured_photos = rawPhotos;
      } else if (item.type === "gallery") {
        const rawGallery = Array.isArray(listing.gallery_images)
          ? [...listing.gallery_images]
          : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

        if (typeof rawGallery[item.index] === "string") {
          rawGallery[item.index] = publicUrl;
        } else {
          rawGallery[item.index] = { ...rawGallery[item.index], url: publicUrl };
        }
        updatePayload.gallery_images = rawGallery;
      }

      const { error: updateError } = await supabase
        .from("evlistings")
        .update(updatePayload)
        .eq("id", item.listingId);

      if (updateError) {
        alert("Failed to update database: " + updateError.message);
      } else {
        // Auto rebuild search summary
        fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
        await fetchListings();
      }
    } catch (err: any) {
      alert("Background removal failed: " + err.message);
    }
    setBgRemovingId(null);
    setBgRemoveProgress("");
  };

  const handleFlipHorizontal = async (item: ImageItem) => {
    if (!confirm("Are you sure you want to flip this image horizontally? The flipped image will immediately replace the original in the database.")) return;

    setFlippingId(item.id);
    try {
      // Decode and load image first (resolves CORS and formatting issues)
      const decodedBlob = await convertToImageBlob(item.url);
      const img = new Image();
      
      const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load source image for flipping"));
        img.src = URL.createObjectURL(decodedBlob);
      });

      const canvas = document.createElement("canvas");
      canvas.width = loadedImg.naturalWidth || loadedImg.width;
      canvas.height = loadedImg.naturalHeight || loadedImg.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2D canvas context");
      }

      // Flip horizontally
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(loadedImg, 0, 0);

      // Export to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas conversion to blob failed"));
        }, "image/png");
      });

      const sig = getFileSignature(item);
      const filename = `${sig}-flipped.png`;
      const path = `vehicles/${Date.now()}-${sig}.png`;
      
      const { data, error } = await supabase.storage.from("evphotos").upload(path, new File([blob], filename, { type: "image/png" }), { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setFlippingId(null);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

      // Find original listing row
      const listing = listings.find((l) => l.id === item.listingId);
      if (!listing) return;

      let updatePayload: Partial<EvListingRow> = {};

      if (item.type === "main") {
        updatePayload.photo = publicUrl;
      } else if (item.type === "featured") {
        const rawPhotos = Array.isArray(listing.featured_photos)
          ? [...listing.featured_photos]
          : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

        if (typeof rawPhotos[item.index] === "string") {
          rawPhotos[item.index] = publicUrl;
        } else {
          rawPhotos[item.index] = { ...rawPhotos[item.index], url: publicUrl };
        }
        updatePayload.featured_photos = rawPhotos;
      } else if (item.type === "gallery") {
        const rawGallery = Array.isArray(listing.gallery_images)
          ? [...listing.gallery_images]
          : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

        if (typeof rawGallery[item.index] === "string") {
          rawGallery[item.index] = publicUrl;
        } else {
          rawGallery[item.index] = { ...rawGallery[item.index], url: publicUrl };
        }
        updatePayload.gallery_images = rawGallery;
      }

      const { error: updateError } = await supabase
        .from("evlistings")
        .update(updatePayload)
        .eq("id", item.listingId);

      if (updateError) {
        alert("Failed to update database: " + updateError.message);
      } else {
        // Auto rebuild search summary
        fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
        await fetchListings();
      }
    } catch (err: any) {
      alert("Flipping failed: " + err.message);
    }
    setFlippingId(null);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>, item: ImageItem) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(item.id);
    try {
      const path = `vehicles/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
        setUploadingId(null);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;

      // Find original listing row
      const listing = listings.find((l) => l.id === item.listingId);
      if (!listing) return;

      let updatePayload: Partial<EvListingRow> = {};

      if (item.type === "main") {
        updatePayload.photo = publicUrl;
      } else if (item.type === "featured") {
        const rawPhotos = Array.isArray(listing.featured_photos)
          ? [...listing.featured_photos]
          : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

        if (typeof rawPhotos[item.index] === "string") {
          rawPhotos[item.index] = publicUrl;
        } else {
          rawPhotos[item.index] = { ...rawPhotos[item.index], url: publicUrl };
        }
        updatePayload.featured_photos = rawPhotos;
      } else if (item.type === "gallery") {
        const rawGallery = Array.isArray(listing.gallery_images)
          ? [...listing.gallery_images]
          : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

        if (typeof rawGallery[item.index] === "string") {
          rawGallery[item.index] = publicUrl;
        } else {
          rawGallery[item.index] = { ...rawGallery[item.index], url: publicUrl };
        }
        updatePayload.gallery_images = rawGallery;
      }

      const { error: updateError } = await supabase
        .from("evlistings")
        .update(updatePayload)
        .eq("id", item.listingId);

      if (updateError) {
        alert("Failed to update database: " + updateError.message);
      } else {
        // Auto rebuild search summary
        fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
        await fetchListings();
      }
    } catch (err: any) {
      alert("Error replacing image: " + err.message);
    }
    setUploadingId(null);
  };

  const handleDelete = async (item: ImageItem) => {
    if (!confirm("Are you sure you want to remove this image from the listing?")) return;

    setDeletingId(item.id);
    try {
      const listing = listings.find((l) => l.id === item.listingId);
      if (!listing) return;

      let updatePayload: Partial<EvListingRow> = {};

      if (item.type === "main") {
        updatePayload.photo = "";
      } else if (item.type === "featured") {
        const rawPhotos = Array.isArray(listing.featured_photos)
          ? [...listing.featured_photos]
          : JSON.parse(typeof listing.featured_photos === "string" ? listing.featured_photos : "[]");

        rawPhotos.splice(item.index, 1);
        updatePayload.featured_photos = rawPhotos;
      } else if (item.type === "gallery") {
        const rawGallery = Array.isArray(listing.gallery_images)
          ? [...listing.gallery_images]
          : JSON.parse(typeof listing.gallery_images === "string" ? listing.gallery_images : "[]");

        rawGallery.splice(item.index, 1);
        updatePayload.gallery_images = rawGallery;
      }

      const { error: updateError } = await supabase
        .from("evlistings")
        .update(updatePayload)
        .eq("id", item.listingId);

      if (updateError) {
        alert("Failed to delete image: " + updateError.message);
      } else {
        // Auto rebuild search summary
        fetch("/api/build-summary").catch((err) => console.error("Error rebuilding summary:", err));
        await fetchListings();
      }
    } catch (err: any) {
      alert("Error deleting image: " + err.message);
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Media Manager</h2>
          <p className="text-xs text-slate-500">
            View, replace, download, and delete photos across all EV listings.
          </p>
        </div>

        {/* Checkerboard Preview BG Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl p-1 shrink-0 w-fit">
          <button
            onClick={() => setBgType("checkerboard")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
              bgType === "checkerboard" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🏁 Checkerboard
          </button>
          <button
            onClick={() => setBgType("white")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
              bgType === "white" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ⚪ White
          </button>
          <button
            onClick={() => setBgType("dark")}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${
              bgType === "dark" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            ⚫ Dark
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] items-center mb-6">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400 focus-within:bg-white transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by listing name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Brand Filter */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Brand</span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 cursor-pointer appearance-none"
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Type</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 cursor-pointer appearance-none"
          >
            <option value="all">All Image Types</option>
            <option value="main">Main Listing Photo</option>
            <option value="featured">Featured / Variant Photo</option>
            <option value="gallery">Gallery Photo</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchListings}
          className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors"
          title="Refresh Media"
        >
          <RefreshCw size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Bulk Actions Panel (Visible when a brand is selected) */}
      {selectedBrand !== "all" && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-55/10 border border-emerald-200/50 bg-emerald-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-emerald-950">Bulk Actions for {selectedBrand}</h4>
            <p className="text-xs text-emerald-700">
              Download all media files named by matching signatures, or bulk upload replaced versions of the brand at once.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {/* Bulk Download */}
            <button
              onClick={handleBulkDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Download size={14} /> Download All ({filteredImages.length})
            </button>

            {/* Bulk Replace */}
            <label className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer shadow-sm">
              <Upload size={14} /> Bulk Upload & Replace
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleBulkUpload}
                disabled={bulkProcessing || bgRemovingId !== null}
              />
            </label>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 size={36} className="animate-spin text-slate-400 mb-4" />
          <p className="text-sm text-slate-500">Loading EV media assets...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-200 rounded-3xl">
          <p className="text-sm text-slate-500">No media assets found matching the filters.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-xs font-bold text-slate-400 uppercase">
            Showing {filteredImages.length} images
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map((img) => {
              const sig = getFileSignature(img);
              const ext = getFileExtension(img.url);
              const filename = `${sig}.${ext}`;

              return (
                <div 
                  key={img.id}
                  className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Image Container with Custom Toggled Background */}
                  <div 
                    className="relative aspect-[4/3] overflow-hidden border-b border-slate-200 flex items-center justify-center"
                    style={{
                      backgroundColor: bgType === "white" ? "#ffffff" : bgType === "dark" ? "#1e293b" : "#ffffff",
                      backgroundImage: bgType === "checkerboard" 
                        ? "linear-gradient(45deg, #efefef 25%, transparent 25%, transparent 75%, #efefef 75%, #efefef), linear-gradient(45deg, #efefef 25%, #ffffff 25%, #ffffff 75%, #efefef 75%, #efefef)"
                        : "none",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 10px 10px"
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.url} 
                      alt={img.listingTitle}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Image Type Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md">
                      {img.type === "main" ? "Main Photo" : img.type === "featured" ? "Variant Photo" : "Gallery Image"}
                    </div>

                    {/* Floating Overlay Actions (Download & Delete) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-250">
                      {/* Download */}
                      <button
                        onClick={() => handleDownload(img.url, filename)}
                        className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-sky-600 text-white backdrop-blur-md transition-colors cursor-pointer shadow-sm flex items-center justify-center"
                        title="Download Image"
                      >
                        <Download size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(img)}
                        disabled={deletingId !== null || bgRemovingId !== null || uploadingId !== null}
                        className="p-1.5 rounded-lg bg-slate-900/85 hover:bg-rose-600 text-white backdrop-blur-md transition-colors cursor-pointer shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Image"
                      >
                        {deletingId === img.id ? (
                          <Loader2 size={13} className="animate-spin text-white" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info block */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#10855f] truncate">
                        {img.listingBrand}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1">
                        {img.listingTitle}
                      </h3>
                      {img.type === "featured" && img.rawItem?.variantName && (
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                          Variant: {img.rawItem.variantName}
                        </p>
                      )}
                      <p className="text-[9.5px] text-slate-400 font-mono mt-1 select-all truncate bg-slate-100 rounded px-1.5 py-0.5" title={`Signature: ${sig}`}>
                        {sig}
                      </p>
                    </div>

                    {/* Actions Panel (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                      {/* Replace */}
                      <label className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-650 text-[10px] font-extrabold cursor-pointer transition-colors border border-slate-200 text-center">
                        {uploadingId === img.id ? (
                          <Loader2 size={14} className="animate-spin text-emerald-600" />
                        ) : (
                          <>
                            <Upload size={14} className="mb-1 text-emerald-600" />
                            Replace
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleReplace(e, img)}
                          disabled={uploadingId !== null || bgRemovingId !== null}
                        />
                      </label>

                      {/* Remove BG (Client-side AI) */}
                      <button
                        onClick={() => handleRemoveBg(img)}
                        disabled={bgRemovingId !== null || uploadingId !== null || deletingId !== null || bulkProcessing}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-650 text-[10px] font-extrabold transition-colors border border-slate-200 cursor-pointer text-center"
                      >
                        {bgRemovingId === img.id ? (
                          <div className="flex flex-col items-center">
                            <Loader2 size={14} className="animate-spin text-violet-600 mb-0.5" />
                            <span className="text-[8px] font-medium leading-none truncate max-w-[70px]">{bgRemoveProgress}</span>
                          </div>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-violet-600 mb-1 animate-pulse" />
                            Remove BG
                          </>
                        )}
                      </button>

                      {/* Crop */}
                      <button
                        onClick={() => setCropImage(img)}
                        disabled={cropImage !== null || bgRemovingId !== null || uploadingId !== null || deletingId !== null || flippingId !== null}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-650 text-[10px] font-extrabold transition-colors border border-slate-200 cursor-pointer text-center"
                      >
                        <Crop size={14} className="mb-1 text-amber-600" />
                        Crop
                      </button>

                      {/* Flip Horizontal */}
                      <button
                        onClick={() => handleFlipHorizontal(img)}
                        disabled={flippingId !== null || bgRemovingId !== null || uploadingId !== null || deletingId !== null}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-650 text-[10px] font-extrabold transition-colors border border-slate-200 cursor-pointer text-center"
                      >
                        {flippingId === img.id ? (
                          <Loader2 size={14} className="animate-spin text-indigo-600" />
                        ) : (
                          <>
                            <FlipHorizontal size={14} className="mb-1 text-indigo-600" />
                            Flip Horiz.
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Bulk Progress Log Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Bulk Replace Progress</h3>
                <p className="text-xs text-slate-500">
                  Replacing files based on filename signatures matching the DB.
                </p>
              </div>
              {!bulkProcessing && (
                <button 
                  onClick={() => setShowBulkModal(false)} 
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-655 cursor-pointer"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Logs List */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 bg-slate-50 border-b border-slate-100">
              {bulkLog.length === 0 ? (
                <div className="text-slate-400 text-center py-6">Initializing bulk replaces...</div>
              ) : (
                bulkLog.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-lg leading-relaxed ${
                      log.type === "success" 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                        : log.type === "error" 
                        ? "bg-rose-50 text-rose-800 border border-rose-200" 
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {bulkProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-600" />
                    <span className="text-xs font-bold text-slate-600">Processing files...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">Completed bulk action.</span>
                  </>
                )}
              </div>
              <button
                disabled={bulkProcessing}
                onClick={() => setShowBulkModal(false)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  bulkProcessing 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-sm"
                }`}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropImage && (
        <CropModal
          image={cropImage}
          supabase={supabase}
          listings={listings}
          fetchListings={fetchListings}
          onClose={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
