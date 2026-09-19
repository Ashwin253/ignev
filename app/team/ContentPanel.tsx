"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, FileText, Upload, Image as ImageIcon, Sparkles, RefreshCw, ExternalLink, Car, User } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import { extractArticleMeta } from "../lib/supabase";
export { extractArticleMeta };

export type ProductContent = {
  id?: string;
  type?: string;
  title: string;
  url?: string;
  slug?: string;
  author_name?: string;
  author_email?: string;
  body: string;
  product_slug: string;
  thumbnail?: string;
  is_active: boolean;
};

const emptyContent: ProductContent = {
  type: "article",
  title: "",
  url: "",
  slug: "",
  author_name: "",
  author_email: "",
  body: "",
  product_slug: "",
  thumbnail: "",
  is_active: true,
};


const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

interface ContentPanelProps {
  supabase: any;
  listings?: Array<{ id: string; slug: string; title: string; brand: string }>;
  currentUserEmail?: string;
  currentUserName?: string;
}

export default function ContentPanel({
  supabase,
  listings = [],
  currentUserEmail = "",
  currentUserName = "",
}: ContentPanelProps) {
  const [contents, setContents] = useState<(ProductContent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductContent>(emptyContent);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isCustomSlugEdited, setIsCustomSlugEdited] = useState(false);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("product_content").select("*").order("created_at", { ascending: false });
    if (error) console.warn("Fetch content error:", error.message);
    setContents((data ?? []) as any);
    setLoading(false);
  };

  const startNew = () => {
    setEditing("new");
    const defaultAuthorName = currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : "Editorial Team");
    setForm({
      ...emptyContent,
      author_name: defaultAuthorName,
      author_email: currentUserEmail || "",
    });
    setIsCustomSlugEdited(false);
  };

  const startEdit = (c: ProductContent & { id: string }) => {
    const meta = extractArticleMeta(c.body);
    setEditing(c.id);
    setForm({
      ...c,
      slug: c.slug || c.url || "",
      author_name: c.author_name || meta.authorName || currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : ""),
      author_email: c.author_email || meta.authorEmail || currentUserEmail || "",
      body: meta.cleanBody,
    });
    setIsCustomSlugEdited(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const next = { ...prev, title: newTitle };
      if (!isCustomSlugEdited) {
        const autoSlug = slugify(newTitle);
        next.slug = autoSlug;
        next.url = autoSlug;
      }
      return next;
    });
  };

  const handleCustomSlugChange = (val: string) => {
    setIsCustomSlugEdited(true);
    const sanitized = val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    setForm((prev) => ({ ...prev, slug: sanitized, url: sanitized }));
  };

  const resetSlugFromTitle = () => {
    const autoSlug = slugify(form.title);
    setIsCustomSlugEdited(false);
    setForm((prev) => ({ ...prev, slug: autoSlug, url: autoSlug }));
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setUploadingThumbnail(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const path = `content/thumbnails/${Date.now()}-${cleanName}`;
      const { data, error } = await supabase.storage.from("evphotos").upload(path, file, { upsert: true });

      if (error) {
        alert("Upload failed: " + error.message);
      } else if (data) {
        const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
        setForm((prev) => ({ ...prev, thumbnail: publicUrl }));
      }
    } catch (err: any) {
      alert("Upload failed: " + (err.message || String(err)));
    } finally {
      setUploadingThumbnail(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("Please enter an article title.");
      return;
    }

    setSaving(true);
    const slugVal = form.slug?.trim() || form.url?.trim() || slugify(form.title);
    const authorNameVal = (
      (editing === "new" ? currentUserName : form.author_name) ||
      currentUserName ||
      (currentUserEmail ? currentUserEmail.split("@")[0] : "Editorial Team")
    ).trim();
    const authorEmailVal = (
      (editing === "new" ? currentUserEmail : form.author_email) ||
      currentUserEmail ||
      ""
    ).trim();

    const cleanBodyText = extractArticleMeta(form.body).cleanBody;
    const metaHeader = (authorNameVal || authorEmailVal)
      ? `<!--meta:${JSON.stringify({ author_name: authorNameVal, author_email: authorEmailVal })}-->\n\n`
      : "";
    const fullBody = `${metaHeader}${cleanBodyText}`;

    const payload: any = {
      title: form.title.trim(),
      body: fullBody,
      product_slug: form.product_slug?.trim() || "",
      thumbnail: form.thumbnail?.trim() || "",
      is_active: form.is_active,
      type: form.type || "article",
      url: slugVal,
      slug: slugVal,
      author_name: authorNameVal,
      author_email: authorEmailVal,
    };

    let saveError: any = null;

    const stripUnsupportedColumns = (p: any) => {
      delete p.slug;
      delete p.author_name;
      delete p.author_email;
    };

    if (editing === "new") {
      const res = await supabase.from("product_content").insert(payload);
      if (
        res.error?.code === "PGRST204" ||
        res.error?.message?.includes("slug") ||
        res.error?.message?.includes("author")
      ) {
        stripUnsupportedColumns(payload);
        const retryRes = await supabase.from("product_content").insert(payload);
        saveError = retryRes.error;
      } else {
        saveError = res.error;
      }
    } else {
      const res = await supabase.from("product_content").update(payload).eq("id", editing);
      if (
        res.error?.code === "PGRST204" ||
        res.error?.message?.includes("slug") ||
        res.error?.message?.includes("author")
      ) {
        stripUnsupportedColumns(payload);
        const retryRes = await supabase.from("product_content").update(payload).eq("id", editing);
        saveError = retryRes.error;
      } else {
        saveError = res.error;
      }
    }

    if (saveError) {
      alert(`Save failed: ${saveError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(null);
    fetchContents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    await supabase.from("product_content").delete().eq("id", id);
    fetchContents();
  };

  const filtered = contents.filter((c) => {
    const slugVal = c.slug || c.url || "";
    const meta = extractArticleMeta(c.body);
    const authorName = c.author_name || meta.authorName || "";
    const authorEmail = c.author_email || meta.authorEmail || "";
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      slugVal.toLowerCase().includes(q) ||
      c.product_slug.toLowerCase().includes(q) ||
      authorName.toLowerCase().includes(q) ||
      authorEmail.toLowerCase().includes(q)
    );
  });

  const matchedVehicle = listings.find(
    (l) => l.slug?.toLowerCase() === form.product_slug?.trim().toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{contents.length}</span> published articles & updates
          </p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-sm transition">
          <Plus size={14} /> Add New Content
        </button>
      </div>

      {/* Editing / Creating Modal Form */}
      {editing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-sky-100">
            <div>
              <p className="text-base font-extrabold text-sky-900">
                {editing === "new" ? "Create New Content" : "Edit Content"}
              </p>
              <p className="text-xs text-sky-600">
                Publish articles, guides, or updates linked to specific electric vehicles or general topics.
              </p>
            </div>
            <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Article Title */}
            <label className="block sm:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Article Title *</span>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. 5 Reasons to Buy Tata Nexon EV in 2026"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            {/* Custom Slug for this Content */}
            <div className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Article Custom Slug (URL)
                </span>
                <button
                  type="button"
                  onClick={resetSlugFromTitle}
                  title="Auto-generate slug from title"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition"
                >
                  <RefreshCw size={11} /> Auto from Title
                </button>
              </div>
              <div className="mt-1.5 flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                <span className="text-xs text-slate-400 font-mono select-none">/article/</span>
                <input
                  value={form.slug || form.url || ""}
                  onChange={(e) => handleCustomSlugChange(e.target.value)}
                  placeholder="5-reasons-to-buy-tata-nexon-ev"
                  className="w-full bg-transparent px-1 font-mono text-xs text-slate-800 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                The web address for this article: <span className="font-mono text-slate-700">/article/{form.slug || form.url || "your-slug"}</span>
              </p>
            </div>

            {/* Associated Vehicle (Replaced confusing Product Slug) */}
            <div className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Car size={13} className="text-slate-500" /> Associated Vehicle (Optional)
                </span>
                {matchedVehicle && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    ✓ {matchedVehicle.brand} {matchedVehicle.title}
                  </span>
                )}
              </div>
              <input
                list="vehicle-slug-options"
                value={form.product_slug}
                onChange={(e) => setForm({ ...form, product_slug: e.target.value })}
                placeholder="Select or enter vehicle slug (e.g. tata-nexon-ev)..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <datalist id="vehicle-slug-options">
                {listings.map((l) => (
                  <option key={l.id || l.slug} value={l.slug}>
                    {l.brand} {l.title} ({l.slug})
                  </option>
                ))}
              </datalist>
              <p className="mt-1 text-[11px] text-slate-500">
                Links this content to that car/bike page. Leave empty if this is a general EV guide.
              </p>
            </div>


            {/* Thumbnail URL with Upload */}
            <div className="block sm:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Thumbnail Image (Optional)
              </span>
              <div className="mt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={form.thumbnail || ""}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="Enter image URL (https://...) or upload directly →"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 pr-9"
                  />
                  {form.thumbnail && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, thumbnail: "" })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1 rounded-md"
                      title="Clear thumbnail"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-600 transition cursor-pointer shrink-0 shadow-sm">
                  {uploadingThumbnail ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload Image
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingThumbnail}
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Thumbnail Preview if present */}
              {form.thumbnail && (
                <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white w-fit shadow-xs">
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                    <img
                      src={form.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-700">Thumbnail Preview</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[240px] font-mono">{form.thumbnail}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Article Body Markdown Editor */}
            <div className="block sm:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                Article Body (Markdown)
              </span>
              <MarkdownEditor
                value={form.body}
                onChange={(v) => setForm({ ...form, body: v })}
                supabase={supabase}
                placeholder="Write your article here... Use the toolbar above to add styles, headings, tables, links, and images."
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-sky-200/70">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                Publish as Active
              </label>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <User size={13} className="text-slate-400 shrink-0" />
                <span>Author: <strong className="text-slate-800">{editing === "new" ? (currentUserName || (currentUserEmail ? currentUserEmail.split("@")[0] : "Team")) : (form.author_name || currentUserName || "Team")}</strong></span>
                <span className="rounded bg-sky-100 text-sky-700 px-1.5 py-0.5 text-[10px] font-bold">Auto</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploadingThumbnail}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editing === "new" ? "Create Content" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content by title, article slug, or vehicle model..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-sky-500 shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* List of Content Items */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-sky-600" />
          <p className="text-sm font-medium">Loading content...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          {filtered.map((c) => {
            const articleSlug = c.slug || c.url || c.id;
            return (
              <div
                key={c.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition ${
                  !c.is_active ? "opacity-60 bg-slate-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {c.thumbnail ? (
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 shrink-0 mt-0.5">
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 text-sky-600 mt-0.5">
                      <FileText size={18} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</p>
                      {!c.is_active && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <span className="text-slate-400">Slug:</span> /{articleSlug}
                      </span>
                      {c.product_slug ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          <Car size={11} /> {c.product_slug}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Article</span>
                      )}
                      {(c.author_name || extractArticleMeta(c.body).authorName || c.author_email || extractArticleMeta(c.body).authorEmail) && (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          <User size={11} className="text-slate-400" />
                          {c.author_name || extractArticleMeta(c.body).authorName || c.author_email || extractArticleMeta(c.body).authorEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={`/article/${articleSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-sky-600 hover:bg-sky-50 hover:border-sky-200 transition"
                  >
                    <ExternalLink size={11} /> Preview
                  </a>
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-sky-600 hover:border-sky-200 transition"
                    title="Edit article"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition"
                    title="Delete article"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No content found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
