"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Quote, Code, Eye, Edit3 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-400 transition-all">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-3 py-2">
        <div className="flex items-center gap-1">
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
              <ToolbarButton icon={<ImageIcon size={15} />} onClick={() => insertSyntax("![alt text](", ")")} title="Image" />
              <ToolbarButton icon={<Quote size={15} />} onClick={() => insertSyntax("> ", "")} title="Blockquote" />
              <ToolbarButton icon={<Code size={15} />} onClick={() => insertSyntax("```\n", "\n```")} title="Code Block" />
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-500 py-1.5 px-2">Preview Mode</span>
          )}
        </div>
        
        {/* Toggle Write / Preview */}
        <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
          <button
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === "write" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Edit3 size={13} /> Write
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === "preview" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
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
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
    >
      {icon}
    </button>
  );
}
