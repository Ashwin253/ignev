"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Eye,
  Edit3,
  Upload,
  X,
  Loader2,
  Check,
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

  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const insertTextAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) {
      onChange((value || "") + textToInsert);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + textToInsert + after;
    onChange(newText);

    setTimeout(() => {
      el.focus();
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
    onChange(newText);

    // Re-focus and set cursor position
    setTimeout(() => {
      el.focus();
      if (selection.length > 0) {
        el.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
      } else {
        el.setSelectionRange(start + prefix.length, start + prefix.length);
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
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });
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

  // Support pasting image from clipboard (Ctrl+V screenshot)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !supabase) return;

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
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-400 transition-all relative">
      {/* Insert Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab switch: Upload vs URL */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageTab === "upload" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageTab === "url" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Paste Image URL
              </button>
            </div>

            {imageTab === "upload" ? (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 rounded-2xl p-6 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-sky-600 py-2">
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
                      <span className="text-[10px] text-slate-400">Click to replace image</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-sky-600">
                      <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-sky-600 group-hover:scale-105 transition-transform">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-sky-700">Click to choose image file</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WebP, GIF up to 10MB</span>
                    </div>
                  )}
                </label>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Caption / Alt Text (Optional)</span>
                  <input
                    type="text"
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="e.g. Tata Nexon EV side profile"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
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
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-40 transition cursor-pointer shadow-sm"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Image URL *</span>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Caption / Alt Text (Optional)</span>
                  <input
                    type="text"
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="e.g. Fast charger at highway station"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
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
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 disabled:opacity-40 transition cursor-pointer shadow-sm"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Uploading Status */}
      {isUploading && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl bg-slate-900/90 text-white px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur-sm animate-pulse">
          <Loader2 size={15} className="animate-spin text-sky-400" />
          <span>Uploading image to storage...</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        <div className="flex items-center gap-1 flex-wrap">
          {mode === "write" ? (
            <>
              <ToolbarButton icon={<Bold size={15} />} onClick={() => insertSyntax("**", "**")} title="Bold" />
              <ToolbarButton icon={<Italic size={15} />} onClick={() => insertSyntax("_", "_")} title="Italic" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<Heading1 size={15} />} onClick={() => insertSyntax("# ", "")} title="Heading 1" />
              <ToolbarButton icon={<Heading2 size={15} />} onClick={() => insertSyntax("## ", "")} title="Heading 2" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<List size={15} />} onClick={() => insertSyntax("- ", "")} title="Bullet List" />
              <ToolbarButton icon={<ListOrdered size={15} />} onClick={() => insertSyntax("1. ", "")} title="Numbered List" />
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <ToolbarButton icon={<LinkIcon size={15} />} onClick={() => insertSyntax("[", "](url)")} title="Link" />
              <ToolbarButton icon={<ImageIcon size={15} />} onClick={() => setShowImageModal(true)} title="Insert Image (Upload or URL)" />
              <ToolbarButton icon={<Quote size={15} />} onClick={() => insertSyntax("> ", "")} title="Blockquote" />
              <ToolbarButton icon={<Code size={15} />} onClick={() => insertSyntax("```\n", "\n```")} title="Code Block" />
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-500 py-1.5 px-2">Preview Mode</span>
          )}
        </div>
        
        {/* Toggle Write / Preview */}
        <div className="flex bg-slate-200/50 p-0.5 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === "write" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Edit3 size={13} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === "preview" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
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
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            placeholder={placeholder}
            minRows={15}
            className="w-full min-h-[400px] p-5 lg:p-8 resize-none outline-none font-sans text-[15px] leading-relaxed text-slate-800 placeholder-slate-400 bg-transparent"
          />
        ) : (
          <div className="p-5 lg:p-8 prose prose-slate prose-img:rounded-xl prose-a:text-sky-600 max-w-none">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <div className="text-slate-400 italic text-sm">Nothing to preview...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors cursor-pointer"
    >
      {icon}
    </button>
  );
}
