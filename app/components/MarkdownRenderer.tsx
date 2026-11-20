"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { preprocessMarkdown } from "../lib/markdownUtils";

export default function MarkdownRenderer({ content }: { content: string }) {
  const formattedContent = useMemo(() => preprocessMarkdown(content || ""), [content]);

  return (
    <div className="prose prose-slate max-w-none prose-headings:font-black prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-2xl prose-img:shadow-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ node, ...props }) => (
            <div className="my-8 w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs not-prose">
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
            <th className="px-5 py-3.5 sm:px-6 font-semibold text-slate-900 whitespace-nowrap" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-5 py-3.5 sm:px-6 text-slate-600 leading-relaxed" {...props} />
          ),
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}
