"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Loader2, Video, FileText } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

export type ProductContent = {
  id?: string;
  type?: string;
  title: string;
  url?: string;
  body: string;
  product_slug: string;
  thumbnail?: string;
  is_active: boolean;
};

const emptyContent: ProductContent = {
  type: "article",
  title: "",
  url: "",
  body: "",
  product_slug: "",
  thumbnail: "",
  is_active: true,
};

export default function ContentPanel({ supabase }: { supabase: any }) {
  const [contents, setContents] = useState<(ProductContent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductContent>(emptyContent);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

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
    setForm({ ...emptyContent });
  };

  const startEdit = (c: ProductContent & { id: string }) => {
    setEditing(c.id);
    setForm(c);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    delete (payload as any).id;

    if (editing === "new") {
      const { error } = await supabase.from("product_content").insert(payload);
      if (error) { alert(`Save failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("product_content").update(payload).eq("id", editing);
      if (error) { alert(`Update failed: ${error.message}`); setSaving(false); return; }
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

  const filtered = contents.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.product_slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-900">{contents.length}</span> items</p>
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700">
          <Plus size={12} /> Add Content
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-sky-700">{editing === "new" ? "New Content" : "Edit Content"}</p>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Article Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 5 Reasons to Buy Tata Nexon EV" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Product Slug (Link To)</span><input value={form.product_slug} onChange={(e) => setForm({ ...form, product_slug: e.target.value })} placeholder="e.g. tata-nexon-ev" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Thumbnail URL (Optional)</span><input value={form.thumbnail || ""} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://... (.jpg, .png)" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></label>
            <div className="block sm:col-span-2">
              <span className="text-xs font-bold text-slate-600 block mb-2">Article Body</span>
              <MarkdownEditor
                value={form.body}
                onChange={(v) => setForm({ ...form, body: v })}
                placeholder="Write your article here... Use the toolbar above to add styles, links, and images."
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content by title or slug..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400" />

      {loading ? <p className="text-slate-400 text-sm text-center py-8">Loading content...</p> : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mt-4">
          {filtered.map((c) => (
            <div key={c.id} className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${!c.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-sky-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{c.title}</p>
                  <p className="text-[10px] text-slate-500">Slug: <span className="font-mono bg-slate-100 px-1 rounded">{c.product_slug}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`/article/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 font-bold hover:underline">Preview</a>
                <button onClick={() => startEdit(c)} className="text-[10px] text-slate-500 font-bold hover:text-sky-600"><Pencil size={12} /></button>
                <button onClick={() => handleDelete(c.id)} className="text-[10px] text-slate-500 font-bold hover:text-rose-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No content found</p>}
        </div>
      )}
    </div>
  );
}
