"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ShoppingBag, Plus, Search, Pencil, Trash2, X, Loader2, RefreshCw,
  Upload, Package, Truck, CheckCircle2, XCircle, IndianRupee, ExternalLink,
} from "lucide-react";
import {
  SHOP_PRODUCT_TYPES,
  SHOP_PRODUCT_TYPE_LABEL,
  SHOP_ORDER_STATUSES,
  formatShopPrice,
  type ShopProduct,
  type ShopProductType,
  type ShopOrder,
  type ShopOrderStatus,
  type ShopSpec,
} from "../lib/shop";
import { UPLOAD_CACHE_CONTROL } from "../lib/storage";
import { authedFetch } from "../lib/authed-fetch";

interface ShopPanelProps {
  supabase: SupabaseClient | null;
  userEmail?: string;
}

type SubTab = "products" | "orders";

interface ProductForm {
  name: string;
  slug: string;
  product_type: ShopProductType;
  category: string;
  brand: string;
  vehicle_model: string;
  vehicle_slug: string;
  price: string;
  mrp: string;
  sku: string;
  stock: string;
  description: string;
  image: string;
  gallery_images: string[];
  highlightsText: string;
  specsText: string;
  is_active: boolean;
  featured: boolean;
  cod_available: boolean;
  sort_order: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  product_type: "accessory",
  category: "Accessories",
  brand: "",
  vehicle_model: "",
  vehicle_slug: "",
  price: "",
  mrp: "",
  sku: "",
  stock: "0",
  description: "",
  image: "",
  gallery_images: [],
  highlightsText: "",
  specsText: "",
  is_active: true,
  featured: false,
  cod_available: true,
  sort_order: "0",
};

const parseLines = (value: string) =>
  value.split("\n").map((line) => line.trim()).filter(Boolean);

const parseSpecs = (value: string): ShopSpec[] =>
  parseLines(value)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { label: line, value: "" };
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((spec) => spec.label && spec.value);

const specsToText = (specs: ShopSpec[]) =>
  specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n");

const STATUS_STYLE: Record<ShopOrderStatus, string> = {
  placed: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ShopPanel({ supabase }: ShopPanelProps) {
  const [subTab, setSubTab] = useState<SubTab>("products");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authedFetch(supabase, "/api/shop/products?all=1", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; data?: ShopProduct[]; error?: string };
      if (json.ok && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setProducts([]);
        setNotification({ type: "error", message: json.error || "Could not load shop products." });
      }
    } catch {
      setProducts([]);
      setNotification({ type: "error", message: "Could not reach the shop products API." });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await authedFetch(supabase, "/api/shop/orders", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; data?: ShopOrder[]; error?: string };
      if (json.ok && Array.isArray(json.data)) {
        setOrders(json.data);
      } else {
        setOrders([]);
        setNotification({ type: "error", message: json.error || "Could not load orders." });
      }
    } catch {
      setOrders([]);
      setNotification({ type: "error", message: "Could not reach the orders API." });
    } finally {
      setOrdersLoading(false);
    }
  }, [supabase]);

  // Fetch on mount. The state updates happen inside the async callback after the
  // responses land. This rule can't distinguish that from a sync setState, so it
  // is disabled for these two calls only (same pattern appears ~40x repo-wide).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (subTab === "orders") fetchOrders();
  }, [subTab, fetchOrders]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (typeFilter !== "all" && product.product_type !== typeFilter) return false;
      if (!term) return true;
      return [product.name, product.slug, product.brand, product.vehicle_model, product.sku]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [products, search, typeFilter]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((order) => order.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const startAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setSubTab("products");
  };

  const startEdit = (product: ShopProduct) => {
    setForm({
      name: product.name,
      slug: product.slug,
      product_type: product.product_type,
      category: product.category,
      brand: product.brand,
      vehicle_model: product.vehicle_model,
      vehicle_slug: product.vehicle_slug,
      price: String(product.price),
      mrp: product.mrp === null ? "" : String(product.mrp),
      sku: product.sku,
      stock: String(product.stock),
      description: product.description,
      image: product.image,
      gallery_images: product.gallery_images,
      highlightsText: product.highlights.join("\n"),
      specsText: specsToText(product.specs),
      is_active: product.is_active,
      featured: product.featured,
      cod_available: product.cod_available,
      sort_order: String(product.sort_order),
    });
    setEditingId(product.id);
    setShowForm(true);
    setSubTab("products");
  };

  const handleDelete = async (product: ShopProduct) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      const res = await authedFetch(supabase, `/api/shop/products/${product.id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        setNotification({ type: "success", message: `Deleted ${product.name}` });
        setLoading(true);
        fetchProducts();
      } else {
        alert(json.error || "Failed to delete product.");
      }
    } catch {
      alert("Failed to delete product.");
    }
  };

  const uploadImage = async (file: File, target: "cover" | "gallery") => {
    if (!supabase) {
      alert("Supabase storage client not connected.");
      return;
    }
    setUploading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
      const path = `shop/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${cleanName}`;
      const { data, error } = await supabase.storage
        .from("evphotos")
        .upload(path, file, { cacheControl: UPLOAD_CACHE_CONTROL, upsert: true });

      if (error) {
        alert(`Upload failed: ${error.message}`);
        return;
      }

      const publicUrl = supabase.storage.from("evphotos").getPublicUrl(data.path).data.publicUrl;
      if (target === "cover") {
        setField("image", publicUrl);
      } else {
        setForm((prev) => ({ ...prev, gallery_images: [...prev.gallery_images, publicUrl] }));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    if (!Number(form.price)) {
      alert("Please enter a price greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        product_type: form.product_type,
        category: form.category.trim() || "Accessories",
        brand: form.brand.trim(),
        vehicle_model: form.vehicle_model.trim(),
        vehicle_slug: form.vehicle_slug.trim().replace(/^\/+|\/+$/g, "").replace(/^product\//, ""),
        price: Number(form.price),
        mrp: form.mrp === "" ? null : Number(form.mrp),
        sku: form.sku.trim(),
        stock: Number(form.stock) || 0,
        description: form.description,
        image: form.image,
        gallery_images: form.gallery_images,
        highlights: parseLines(form.highlightsText),
        specs: parseSpecs(form.specsText),
        is_active: form.is_active,
        featured: form.featured,
        cod_available: form.cod_available,
        sort_order: Number(form.sort_order) || 0,
      };

      const res = await authedFetch(
        supabase,
        editingId ? `/api/shop/products/${editingId}` : "/api/shop/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!json.ok) {
        alert(json.error || "Could not save the product.");
        return;
      }

      setNotification({
        type: "success",
        message: editingId ? "Product updated." : "Product published to the shop.",
      });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setLoading(true);
      fetchProducts();
    } catch {
      alert("Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (order: ShopOrder, status: ShopOrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      const res = await authedFetch(supabase, `/api/shop/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        alert(json.error || "Could not update the order.");
        fetchOrders();
      }
    } catch {
      alert("Could not update the order.");
      fetchOrders();
    }
  };

  const deleteOrder = async (order: ShopOrder) => {
    if (!confirm(`Delete order ${order.order_number}?`)) return;
    try {
      const res = await authedFetch(supabase, `/api/shop/orders/${order.id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } else {
        alert(json.error || "Could not delete the order.");
      }
    } catch {
      alert("Could not delete the order.");
    }
  };

  const lowStock = products.filter((p) => p.is_active && p.stock <= 3).length;

  return (
    <div className="space-y-5">
      {notification && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <span className="font-semibold">{notification.message}</span>
          <button onClick={() => setNotification(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 w-fit">
        <button
          onClick={() => setSubTab("products")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
            subTab === "products" ? "bg-white text-ink shadow-md" : "text-slate-600 hover:bg-white/70"
          }`}
        >
          <ShoppingBag size={15} /> Products ({products.length})
        </button>
        <button
          onClick={() => setSubTab("orders")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
            subTab === "orders" ? "bg-white text-ink shadow-md" : "text-slate-600 hover:bg-white/70"
          }`}
        >
          <Truck size={15} /> COD Orders
          {orders.length > 0 && (
            <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">{orders.length}</span>
          )}
        </button>
      </div>

      {/* ── Products ── */}
      {subTab === "products" && !showForm && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brand, model, SKU…"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">All types</option>
              {SHOP_PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {lowStock > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
              {lowStock} active {lowStock === 1 ? "product is" : "products are"} low on stock (≤ 3 units).
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs font-bold text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin text-emerald-600" /> Loading products...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{product.name}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              {product.brand || "—"}
                              {product.vehicle_model ? ` · fits ${product.vehicle_model}` : ""}
                              {product.sku ? ` · ${product.sku}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {SHOP_PRODUCT_TYPE_LABEL[product.product_type]}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {formatShopPrice(product.price)}
                        {product.mrp && product.mrp > product.price && (
                          <span className="ml-1 text-[10px] font-normal text-slate-400 line-through">
                            {formatShopPrice(product.mrp)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${product.stock <= 0 ? "text-rose-600" : product.stock <= 3 ? "text-amber-600" : "text-slate-700"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${product.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                          {product.is_active ? "Live" : "Hidden"}
                        </span>
                        {product.featured && (
                          <span className="ml-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/shop`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                            title="View shop"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => startEdit(product)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Edit product"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                        No products yet — use the Add Product button to publish your first listing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Product form ── */}
      {subTab === "products" && showForm && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900">
              {editingId ? `Editing: ${form.name}` : "Add New Shop Product"}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <X size={14} /> Cancel
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Basics */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Product details</p>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="7.2 kW AC Home Charger"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Type</span>
                  <select
                    value={form.product_type}
                    onChange={(e) => setField("product_type", e.target.value as ShopProductType)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  >
                    {SHOP_PRODUCT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {SHOP_PRODUCT_TYPES.find((t) => t.value === form.product_type)?.hint}
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Category</span>
                  <input
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    placeholder="Chargers"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={3}
                  placeholder="What the customer gets, compatibility notes, warranty…"
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Brand</span>
                  <input
                    value={form.brand}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="Tata"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">SKU</span>
                  <input
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                    placeholder="CHG-72KW-01"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Vehicle link */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehicle / model link</p>
              <p className="text-[11px] text-slate-500">
                Optional. Link the product to a vehicle so customers know what it fits.
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Vehicle model</span>
                <input
                  value={form.vehicle_model}
                  onChange={(e) => setField("vehicle_model", e.target.value)}
                  placeholder="Nexon EV"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Model page slug</span>
                <input
                  value={form.vehicle_slug}
                  onChange={(e) => setField("vehicle_slug", e.target.value)}
                  placeholder="tata-nexon-ev"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
                <span className="mt-1 block text-[10px] text-slate-400">Links to /product/&lt;slug&gt;</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Sort order</span>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            {/* Pricing & stock */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pricing & stock</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Price (₹) *</span>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">MRP (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={form.mrp}
                    onChange={(e) => setField("mrp", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Stock units</span>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <div className="space-y-2 pt-1">
                {([
                  ["is_active", "Visible in shop"],
                  ["featured", "Featured"],
                  ["cod_available", "Cash on delivery"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => setField(key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Media */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Images</p>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Package size={18} />
                    </div>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Upload size={14} /> {uploading ? "Uploading…" : "Cover image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, "cover");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <input
                value={form.image}
                onChange={(e) => setField("image", e.target.value)}
                placeholder="…or paste an image URL"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <Plus size={14} /> Add gallery photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files) await uploadImage(file, "gallery");
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              {form.gallery_images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.gallery_images.map((url) => (
                    <div key={url} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Gallery" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setField("gallery_images", form.gallery_images.filter((u) => u !== url))}
                        className="absolute right-0 top-0 rounded-bl-lg bg-black/60 p-0.5 text-white"
                        aria-label="Remove photo"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights & specs */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Details shown on the card</p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Highlights (one per line)</span>
                <textarea
                  value={form.highlightsText}
                  onChange={(e) => setField("highlightsText", e.target.value)}
                  rows={3}
                  placeholder={"IP67 weatherproof\n2-year warranty"}
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Specs (one per line, “Label: Value”)</span>
                <textarea
                  value={form.specsText}
                  onChange={(e) => setField("specsText", e.target.value)}
                  rows={4}
                  placeholder={"Output: 7.2 kW\nCable length: 5 m\nWarranty: 2 years"}
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {editingId ? "Save changes" : "Publish product"}
            </button>
          </div>
        </form>
      )}

      {/* ── Orders ── */}
      {subTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">All statuses</option>
              {SHOP_ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <div className="ml-auto inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <IndianRupee size={13} /> COD only
            </div>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12 text-xs font-bold text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin text-emerald-600" /> Loading orders...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-slate-50/60">
                      <td className="p-3">
                        <p className="font-mono text-[11px] font-bold text-slate-900">{order.order_number}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">{order.customer_name}</p>
                        <p className="text-[11px] text-slate-500">{order.customer_phone}</p>
                        <p className="text-[10px] text-slate-400">
                          {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
                        </p>
                      </td>
                      <td className="p-3">
                        <ul className="space-y-0.5">
                          {order.items.map((item, i) => (
                            <li key={`${order.id}-${i}`} className="text-[11px] text-slate-600">
                              {item.qty} × {item.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{formatShopPrice(order.total)}</td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order, e.target.value as ShopOrderStatus)}
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold outline-none ${STATUS_STYLE[order.status]}`}
                        >
                          {SHOP_ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => deleteOrder(order)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                        <XCircle size={18} className="mx-auto mb-2 text-slate-300" />
                        No COD orders yet. Orders placed from the shop will appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
