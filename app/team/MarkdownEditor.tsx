"use client";

import React, { useEffect, useState, useRef } from "react";
import { UPLOAD_CACHE_CONTROL } from "../lib/storage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import TextareaAutosize from "react-textarea-autosize";
import { preprocessMarkdown } from "../lib/markdownUtils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Table as TableIcon,
  FileSpreadsheet,
  Plus,
  Trash2,
  Clipboard,
  Eye,
  Edit3,
  Upload,
  X,
  Loader2,
  Check,
  Undo2,
  Redo2,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  supabase?: any;
}

export default function MarkdownEditor({ value, onChange, placeholder, supabase }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentValueRef = useRef(value);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Reset the editor-specific history when a different article is loaded.
  useEffect(() => {
    if (value !== currentValueRef.current) {
      currentValueRef.current = value;
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [value]);

  const commitChange = (nextValue: string) => {
    const currentValue = currentValueRef.current;
    if (nextValue === currentValue) return;
    setUndoStack((history) => [...history.slice(-99), currentValue]);
    setRedoStack([]);
    currentValueRef.current = nextValue;
    onChange(nextValue);
  };

  const focusTextareaWithoutScrolling = () => {
    textareaRef.current?.focus({ preventScroll: true });
  };

  const undo = () => {
    setUndoStack((history) => {
      const previousValue = history.at(-1);
      if (previousValue === undefined) return history;
      const currentValue = currentValueRef.current;
      setRedoStack((redoHistory) => [...redoHistory.slice(-99), currentValue]);
      currentValueRef.current = previousValue;
      onChange(previousValue);
      setTimeout(focusTextareaWithoutScrolling, 0);
      return history.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((history) => {
      const nextValue = history.at(-1);
      if (nextValue === undefined) return history;
      const currentValue = currentValueRef.current;
      setUndoStack((undoHistory) => [...undoHistory.slice(-99), currentValue]);
      currentValueRef.current = nextValue;
      onChange(nextValue);
      setTimeout(focusTextareaWithoutScrolling, 0);
      return history.slice(0, -1);
    });
  };

  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMagazineModal, setShowMagazineModal] = useState(false);
  const [magazineLayout, setMagazineLayout] = useState<"photo-text" | "text-photo" | "text-photo-text">("photo-text");
  const [magazineImageUrl, setMagazineImageUrl] = useState("");
  const [magazineAlt, setMagazineAlt] = useState("");
  const [magazineText, setMagazineText] = useState("");
  const [magazineSideText, setMagazineSideText] = useState("");
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Table modal states (Excel-style interactive grid)
  const [showTableModal, setShowTableModal] = useState(false);

  // Cell / row / column highlight colors (editor-only, not in generated markdown)
  const COLOR_CYCLE = [
    "",
    "bg-yellow-100",
    "bg-blue-100",
    "bg-green-100",
    "bg-pink-100",
    "bg-purple-100",
    "bg-orange-100",
  ];
  const [cellColors, setCellColors] = useState<Record<string, string>>({});
  const [selectedCellColor, setSelectedCellColor] = useState("bg-yellow-100");
  const cellColorOptions = [
    { value: "", label: "No color" },
    { value: "bg-yellow-100", label: "Yellow" },
    { value: "bg-blue-100", label: "Blue" },
    { value: "bg-green-100", label: "Green" },
    { value: "bg-pink-100", label: "Pink" },
    { value: "bg-purple-100", label: "Purple" },
    { value: "bg-orange-100", label: "Orange" },
  ];

  const cycleColor = (current: string) => {
    const idx = COLOR_CYCLE.indexOf(current);
    return COLOR_CYCLE[(idx + 1) % COLOR_CYCLE.length];
  };

  // Returns the effective background class for a cell (cell > row > col priority)
  const getCellColor = (rowIdx: number, colIdx: number): string =>
    cellColors[`${rowIdx}-${colIdx}`] ||
    cellColors[`row-${rowIdx}`] ||
    cellColors[`col-${colIdx}`] ||
    "";

  const handleHeaderClick = (colIdx: number) => {
    setCellColors((prev) => {
      const current = prev[`col-${colIdx}`] || "";
      const next = cycleColor(current);
      const updated = { ...prev };
      if (next === "") {
        delete updated[`col-${colIdx}`];
      } else {
        updated[`col-${colIdx}`] = next;
      }
      return updated;
    });
  };

  const handleRowNumberClick = (rowIdx: number) => {
    setCellColors((prev) => {
      const current = prev[`row-${rowIdx}`] || "";
      const next = cycleColor(current);
      const updated = { ...prev };
      if (next === "") {
        delete updated[`row-${rowIdx}`];
      } else {
        updated[`row-${rowIdx}`] = next;
      }
      return updated;
    });
  };

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    setCellColors((prev) => {
      const key = `${rowIdx}-${colIdx}`;
      const updated = { ...prev };
      if (selectedCellColor === "") {
        delete updated[key];
      } else {
        updated[key] = selectedCellColor;
      }
      return updated;
    });
  };

  const [tableData, setTableData] = useState<string[][]>([
    ["Feature", "3.3 kW", "7.4 kW", "11 kW"],
    ["Charging type", "AC", "AC", "AC"],
    ["Typical supply", "Single-phase", "Single-phase", "Three-phase"],
    ["Charging speed", "Slow", "Faster", "Fastest"],
    ["Installation", "Basic to moderate", "Moderate", "More complex"],
    ["Home suitability", "Good", "Excellent", "Depends on supply"],
  ]);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteBoxText, setPasteBoxText] = useState("");

  const updateTableCell = (rowIndex: number, colIndex: number, val: string) => {
    setTableData((prev) => {
      const copy = prev.map((r) => [...r]);
      if (copy[rowIndex]) {
        copy[rowIndex][colIndex] = val;
      }
      return copy;
    });
  };

  const addTableRow = () => {
    setTableData((prev) => {
      const colCount = prev[0]?.length || 3;
      return [...prev, Array(colCount).fill("")];
    });
  };

  const addTableColumn = () => {
    setTableData((prev) => prev.map((r) => [...r, ""]));
  };

  const removeTableRow = (rowIndex: number) => {
    if (tableData.length <= 1) return;
    setTableData((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const removeTableColumn = (colIndex: number) => {
    if ((tableData[0]?.length || 0) <= 1) return;
    setTableData((prev) => prev.map((r) => r.filter((_, idx) => idx !== colIndex)));
  };

  const applyPastedTextToTable = (text: string) => {
    if (!text.trim()) return;
    const lines = text.trim().split(/\r?\n/);
    const parsedRows = lines.map((line) => {
      if (line.includes("\t")) {
        return line.split("\t").map((c) => c.trim());
      }
      return line.split(/\s{2,}/).map((c) => c.trim());
    });

    if (parsedRows.length > 0) {
      const maxCols = Math.max(...parsedRows.map((r) => r.length));
      const normalized = parsedRows.map((r) => {
        const copy = [...r];
        while (copy.length < maxCols) copy.push("");
        return copy;
      });
      setTableData(normalized);
      setCellColors({});
      setShowPasteBox(false);
      setPasteBoxText("");
    }
  };

  const insertTableIntoDocument = () => {
    if (!tableData || tableData.length === 0) return;
    const activeRows = tableData.filter((row) => row.some((c) => c.trim().length > 0));
    if (activeRows.length === 0) {
      setShowTableModal(false);
      return;
    }
    const maxCols = Math.max(...activeRows.map((r) => r.length));
    const header = activeRows[0];
    while (header.length < maxCols) header.push("");
    const mdLines = [
      "| " + header.map((c) => (c.trim() || "-").replace(/\|/g, "\\|")).join(" | ") + " |",
      "| " + Array(maxCols).fill("---").join(" | ") + " |",
    ];
    for (let i = 1; i < activeRows.length; i++) {
      const row = activeRows[i];
      while (row.length < maxCols) row.push("");
      mdLines.push("| " + row.map((c) => (c.trim() || "-").replace(/\|/g, "\\|")).join(" | ") + " |");
    }
    const markdownTable = `\n\n${mdLines.join("\n")}\n\n`;
    insertTextAtCursor(markdownTable);
    setShowTableModal(false);
  };

  const insertTextAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) {
      commitChange((value || "") + textToInsert);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + textToInsert + after;
    commitChange(newText);

    setTimeout(() => {
      el.focus({ preventScroll: true });
      el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const insertSyntax = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    commitChange(newText);

    // Re-focus and select the new text, or place the cursor between empty markers.
    setTimeout(() => {
      el.focus({ preventScroll: true });
      if (selection.length > 0) {
        el.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
      } else if (suffix.length > 0) {
        el.setSelectionRange(start + prefix.length, start + prefix.length);
      } else {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEndIndex = text.indexOf("\n", start);
        const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
        const line = text.slice(lineStart, lineEnd);
        const whitespace = line.match(/^\s*/)?.[0].length ?? 0;
        const cursor = lineStart + whitespace + prefix.length;
        el.setSelectionRange(cursor, cursor);
      }
    }, 0);
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return null;
    }
    if (!supabase) {
      alert("Supabase storage client is not available.");
      return null;
    }
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const path = `content/articles/${Date.now()}-${cleanName}`;
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true });
      if (error) {
        alert("Image upload failed: " + error.message);
        return null;
      }
      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      return publicUrl;
    } catch (err: any) {
      alert("Image upload failed: " + (err.message || String(err)));
      return null;
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadImageFile(file);
    setIsUploading(false);
    if (url) {
      setUploadedPreviewUrl(url);
      if (!imageAltInput) {
        setImageAltInput(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
    e.target.value = "";
  };

  const insertImage = (url: string, alt: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const caption = alt.trim() || "Image";
    const markdownToInsert = `\n\n![${caption}](${cleanUrl})\n\n`;
    insertTextAtCursor(markdownToInsert);
    setShowImageModal(false);
    setImageUrlInput("");
    setImageAltInput("");
    setUploadedPreviewUrl("");
  };

  const insertMagazineBlock = () => {
    if (!magazineImageUrl.trim()) {
      alert("Add an image URL for this magazine block.");
      return;
    }
    const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
    const image = `<img class="magazine-image" src="${escapeHtml(magazineImageUrl.trim())}" alt="${escapeHtml(magazineAlt.trim() || "Article image")}" />`;
    const copy = `<div class="magazine-copy"><p>${escapeHtml(magazineText.trim() || "Add your article text here.")}</p></div>`;
    const sideCopy = `<div class="magazine-copy"><p>${escapeHtml(magazineSideText.trim() || "Add supporting text here.")}</p></div>`;
    const content = magazineLayout === "photo-text"
      ? `${image}\n  ${copy}`
      : magazineLayout === "text-photo"
        ? `${copy}\n  ${image}`
        : `${copy}\n  ${image}\n  ${sideCopy}`;
    insertTextAtCursor(`\n\n<section class="magazine-block magazine-${magazineLayout}">\n  ${content}\n</section>\n\n`);
    setShowMagazineModal(false);
    setMagazineImageUrl("");
    setMagazineAlt("");
    setMagazineText("");
    setMagazineSideText("");
  };

  // Support pasting image from clipboard (Ctrl+V screenshot) or tables from Excel/Docs
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items && supabase) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          setIsUploading(true);
          const url = await uploadImageFile(file);
          setIsUploading(false);
          if (url) {
            insertTextAtCursor(`\n\n![Screenshot](${url})\n\n`);
          }
          return;
        }
      }
    }

    // Auto-detect and convert tab-separated or aligned tables from clipboard (e.g. from Excel / Sheets / Docs)
    const text = e.clipboardData?.getData("text/plain");
    if (text && (text.includes("\t") || /\S\s{2,}\S/.test(text)) && text.includes("\n")) {
      const converted = preprocessMarkdown(text);
      if (converted !== text && converted.includes("|")) {
        e.preventDefault();
        insertTextAtCursor(`\n\n${converted.trim()}\n\n`);
        return;
      }
    }
  };

  // Support dropping image files onto the editor
  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0 || !supabase) return;
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      setIsUploading(true);
      const url = await uploadImageFile(file);
      setIsUploading(false);
      if (url) {
        insertTextAtCursor(`\n\n![${file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")}](${url})\n\n`);
      }
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-brand transition-all relative">
      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white  p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ImageIcon size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Insert Image</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrlInput("");
                  setImageAltInput("");
                  setUploadedPreviewUrl("");
                }}
                className="text-ink-mute hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab switch: Upload vs URL */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageTab === "upload" ? "bg-white text-slate-900 shadow-xs" : "text-ink-mute hover:text-slate-800"}`}
              >
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageTab === "url" ? "bg-white text-slate-900 shadow-xs" : "text-ink-mute hover:text-slate-800"}`}
              >
                Paste Image URL
              </button>
            </div>

            {imageTab === "upload" ? (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-brand bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-6 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-600 py-2">
                      <Loader2 size={28} className="animate-spin" />
                      <span className="text-xs font-bold">Uploading image to storage...</span>
                    </div>
                  ) : uploadedPreviewUrl ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                        <img src={uploadedPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={13} /> Image uploaded successfully!
                      </span>
                      <span className="text-[10px] text-ink-mute">Click to replace image</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-mute group-hover:text-emerald-600">
                      <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 group-hover:scale-105 transition-transform">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Click to choose image file</span>
                      <span className="text-[10px] text-ink-mute">PNG, JPG, WebP, GIF up to 10MB</span>
                    </div>
                  )}
                </label>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Caption / Alt Text (Optional)</span>
                  <input
                    type="text"
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="e.g. Tata Nexon EV side profile"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageModal(false);
                      setImageUrlInput("");
                      setImageAltInput("");
                      setUploadedPreviewUrl("");
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!uploadedPreviewUrl || isUploading}
                    onClick={() => insertImage(uploadedPreviewUrl, imageAltInput)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition cursor-pointer shadow-sm"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Image URL *</span>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Caption / Alt Text (Optional)</span>
                  <input
                    type="text"
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="e.g. Fast charger at highway station"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {imageUrlInput && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={imageUrlInput}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageModal(false);
                      setImageUrlInput("");
                      setImageAltInput("");
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!imageUrlInput.trim()}
                    onClick={() => insertImage(imageUrlInput, imageAltInput)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition cursor-pointer shadow-sm"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showMagazineModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-bold text-slate-950">Magazine Block</h3><p className="mt-1 text-xs text-slate-500">Build an image-and-text layout for a more editorial article design.</p></div>
              <button type="button" onClick={() => setShowMagazineModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["photo-text", "text-photo", "text-photo-text"] as const).map((layout) => (
                <button key={layout} type="button" onClick={() => setMagazineLayout(layout)} className={`rounded-xl border p-3 text-left text-xs font-bold transition ${magazineLayout === layout ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                  <span className="mb-2 flex h-10 items-center gap-1 rounded-md bg-slate-100 p-1">{layout !== "text-photo" && <span className="h-full flex-1 rounded bg-emerald-200" />}{layout !== "text-photo-text" && <span className="h-2 flex-1 rounded bg-slate-300" />}{layout === "text-photo-text" && <><span className="h-2 flex-1 rounded bg-slate-300" /><span className="h-full flex-1 rounded bg-emerald-200" /><span className="h-2 flex-1 rounded bg-slate-300" /></>}</span>
                  {layout === "photo-text" ? "Photo + text" : layout === "text-photo" ? "Text + photo" : "Text + photo + text"}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input value={magazineImageUrl} onChange={(e) => setMagazineImageUrl(e.target.value)} placeholder="Image URL *" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              <input value={magazineAlt} onChange={(e) => setMagazineAlt(e.target.value)} placeholder="Image description (alt text)" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              <textarea value={magazineText} onChange={(e) => setMagazineText(e.target.value)} placeholder="Main article text" rows={4} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              {magazineLayout === "text-photo-text" && <textarea value={magazineSideText} onChange={(e) => setMagazineSideText(e.target.value)} placeholder="Supporting article text" rows={4} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />}
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowMagazineModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button><button type="button" onClick={insertMagazineBlock} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">Insert magazine block</button></div>
          </div>
        </div>
      )}

      {/* Excel-style Table Builder Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Excel-Style Table Builder</h3>
                  <p className="text-xs text-slate-500">Edit cells directly or copy & paste rows straight from Excel / Google Sheets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addTableRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                >
                  <Plus size={13} className="text-emerald-600" /> Add Row
                </button>
                <button
                  type="button"
                  onClick={addTableColumn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                >
                  <Plus size={13} className="text-emerald-600" /> Add Column
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${showPasteBox ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"}`}
                >
                  <Clipboard size={13} /> Paste from Excel / Sheets
                </button>
                <button
                  type="button"
                  onClick={() => { setTableData([["Column 1", "Column 2"], ["Value 1", "Value 2"]]); setCellColors({}); }}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-200/50 transition cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200/70">
                {tableData[0]?.length || 0} Columns × {tableData.length} Rows
              </div>
            </div>

            {/* Color controls */}
            <div className="flex flex-wrap items-center gap-3 mb-2 px-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Highlight:</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-200 border border-emerald-300" /> Click <b>Header row</b> → color column</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300" /> Click <b>Row #</b> → color row</span>
              <label className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600">
                Click a cell to color it:
                <select
                  value={selectedCellColor}
                  onChange={(e) => setSelectedCellColor(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 outline-none focus:border-emerald-500"
                >
                  {cellColorOptions.map((color) => <option key={color.value || "none"} value={color.value}>{color.label}</option>)}
                </select>
              </label>
              <span className="ml-auto text-[10px] text-slate-400">Cell colors are editor-only and not included in the markdown</span>
            </div>

            {/* Paste from Excel / Google Sheets drawer */}
            {showPasteBox && (
              <div className="mb-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">Paste directly from Excel or Google Sheets:</span>
                  <span className="text-[11px] text-emerald-700">Ctrl+V your copied cells below</span>
                </div>
                <textarea
                  rows={3}
                  value={pasteBoxText}
                  onChange={(e) => {
                    setPasteBoxText(e.target.value);
                    applyPastedTextToTable(e.target.value);
                  }}
                  placeholder="Paste copied cells from Excel or Google Sheets here (Ctrl+V)..."
                  className="w-full p-2.5 text-xs font-mono bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            )}

            {/* Excel-like Grid */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 max-h-[380px]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white text-xs shadow-2xs rounded-lg overflow-hidden border border-slate-200">
                  <thead>
                    <tr className="bg-emerald-50/80 border-b-2 border-emerald-300 text-emerald-950">
                      <th className="w-10 px-2 py-2 text-center font-mono text-[11px] text-slate-400 bg-slate-100 border-r border-slate-200 select-none">
                        #
                      </th>
                      {tableData[0]?.map((_, colIdx) => (
                        <th
                          key={colIdx}
                          onClick={() => handleHeaderClick(colIdx)}
                          title="Click to highlight column"
                          className={`px-2 py-2 border-r border-slate-200 min-w-[130px] relative group cursor-pointer select-none transition-colors ${cellColors[`col-${colIdx}`] || "bg-emerald-50/80"}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                              Header {colIdx + 1}
                            </span>
                            {tableData[0].length > 1 && (
                              <button
                                type="button"
                                title="Delete this column"
                                onClick={(e) => { e.stopPropagation(); removeTableColumn(colIdx); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded transition cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-10 px-2 py-2 text-center text-slate-400 select-none"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, rowIdx) => (
                      <tr key={rowIdx} className={`border-b border-slate-200/80 ${rowIdx === 0 ? "font-semibold" : ""}`}>
                        {/* Row number — click to highlight the row */}
                        <td
                          onClick={() => handleRowNumberClick(rowIdx)}
                          title="Click to highlight row"
                          className={`w-10 px-2 py-1.5 text-center font-mono text-[11px] text-slate-500 border-r border-slate-200 select-none cursor-pointer transition-colors ${cellColors[`row-${rowIdx}`] || "bg-slate-50"}`}
                        >
                          {rowIdx === 0 ? "H" : rowIdx}
                        </td>
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            onClick={() => handleCellClick(rowIdx, colIdx)}
                            title="Click to highlight cell"
                            className={`p-0 border-r border-slate-200 cursor-pointer transition-colors ${getCellColor(rowIdx, colIdx)}`}
                          >
                            <input
                              type="text"
                              value={cell}
                              placeholder={rowIdx === 0 ? `Header ${colIdx + 1}` : `Row ${rowIdx}, Col ${colIdx + 1}`}
                              onChange={(e) => updateTableCell(rowIdx, colIdx, e.target.value)}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData("text/plain");
                                if (pasted && (pasted.includes("\t") || pasted.includes("\n"))) {
                                  e.preventDefault();
                                  applyPastedTextToTable(pasted);
                                }
                              }}
                              className={`w-full px-3 py-2 text-xs text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 ${rowIdx === 0 ? "font-bold text-slate-900 placeholder:text-slate-400" : "font-normal"}`}
                            />
                          </td>
                        ))}
                        <td className="w-10 px-2 py-1 text-center">
                          {tableData.length > 1 && (
                            <button
                              type="button"
                              title="Delete this row"
                              onClick={() => removeTableRow(rowIdx)}
                              className="text-slate-300 hover:text-red-500 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 hidden sm:inline">
                💡 Tip: Copy cells in Excel / Sheets and press <b>Ctrl+V</b> inside any cell.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertTableIntoDocument}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  <Check size={14} /> Insert Table into Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Uploading Status */}
      {isUploading && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl bg-white text-ink px-3.5 py-2 text-xs font-bold shadow-lg  animate-pulse">
          <Loader2 size={15} className="animate-spin text-brand" />
          <span>Uploading image to storage...</span>
        </div>
      )}

      {/* Sticky Floating Toolbar */}
      <div className="sticky top-[72px] z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2.5 rounded-t-2xl shadow-xs transition-shadow">
        <div className="flex items-center gap-1 flex-wrap">
          {mode === "write" ? (
            <>
              <ToolbarButton icon={<Bold size={15} />} onClick={() => insertSyntax("**", "**")} title="Bold" />
              <ToolbarButton icon={<Italic size={15} />} onClick={() => insertSyntax("*", "*")} title="Italic" />
              <ToolbarButton icon={<UnderlineIcon size={15} />} onClick={() => insertSyntax("<u>", "</u>")} title="Underline" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<Undo2 size={15} />} onClick={undo} title="Undo (Ctrl/Cmd+Z)" disabled={undoStack.length === 0} />
              <ToolbarButton icon={<Redo2 size={15} />} onClick={redo} title="Redo (Ctrl/Cmd+Shift+Z)" disabled={redoStack.length === 0} />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<Heading1 size={15} />} onClick={() => insertSyntax("# ", "")} title="Heading 1" />
              <ToolbarButton icon={<Heading2 size={15} />} onClick={() => insertSyntax("## ", "")} title="Heading 2" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<List size={15} />} onClick={() => insertSyntax("- ", "")} title="Bullet List" />
              <ToolbarButton icon={<ListOrdered size={15} />} onClick={() => insertSyntax("1. ", "")} title="Numbered List" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<LinkIcon size={15} />} onClick={() => insertSyntax("[", "](url)")} title="Link" />
              <ToolbarButton icon={<ImageIcon size={15} />} onClick={() => setShowImageModal(true)} title="Insert Image (Upload or URL)" />
              <ToolbarButton icon={<ImageIcon size={15} />} onClick={() => setShowMagazineModal(true)} title="Magazine Block (image and text layout)" />
              <ToolbarButton icon={<Quote size={15} />} onClick={() => insertSyntax("> ", "")} title="Blockquote" />
              <ToolbarButton icon={<Code size={15} />} onClick={() => insertSyntax("```\n", "\n```")} title="Code Block" />
              <ToolbarButton icon={<TableIcon size={15} />} onClick={() => setShowTableModal(true)} title="Table Builder (Excel-like Grid)" />
            </>
          ) : (
            <span className="text-xs font-semibold text-ink-mute py-1.5 px-2">Preview Mode</span>
          )}
        </div>
        
        {/* Toggle Write / Preview */}
        <div className="flex bg-slate-200/50 p-0.5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === "write" ? "bg-white text-emerald-700 shadow-sm" : "text-ink-mute hover:text-slate-700"}`}
          >
            <Edit3 size={13} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === "preview" ? "bg-white text-emerald-700 shadow-sm" : "text-ink-mute hover:text-slate-700"}`}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="relative min-h-[400px]">
        {mode === "write" ? (
          <TextareaAutosize
            ref={textareaRef}
            value={value}
            onChange={(e) => commitChange(e.target.value)}
            onKeyDown={(e) => {
              if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
              if (e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
              } else if (e.key.toLowerCase() === "y") {
                e.preventDefault();
                redo();
              }
            }}
            onPaste={handlePaste}
            onDrop={handleDrop}
            placeholder={placeholder}
            minRows={15}
            className="w-full min-h-[400px] p-5 lg:p-8 resize-none outline-none font-sans text-[15px] leading-relaxed text-slate-800 placeholder-slate-400 bg-transparent"
          />
        ) : (
          <div className="p-5 lg:p-8 prose prose-slate prose-img:rounded-xl prose-a:text-emerald-600 max-w-none">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="my-6 w-full overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-xs not-prose">
                      <table className="w-full border-collapse text-left text-sm" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-700" {...props} />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700" {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="transition-colors hover:bg-slate-50/70 even:bg-slate-50/30" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-3 text-slate-600 leading-relaxed" {...props} />
                  ),
                }}
              >
                {preprocessMarkdown(value)}
              </ReactMarkdown>
            ) : (
              <div className="text-ink-mute italic text-sm">Nothing to preview...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title, disabled = false }: { icon: React.ReactNode; onClick: () => void; title: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 text-ink-mute hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink-mute"
    >
      {icon}
    </button>
  );
}
