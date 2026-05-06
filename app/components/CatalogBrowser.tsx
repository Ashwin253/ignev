"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Search, Send } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";

function toSlug(brand: string, name: string) {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export type CatalogItem = {
  name: string;
  brand: string;
  type: string;
  pricing: string;
  photo: string;
};

const categoryOptions = [
  { value: "all", label: "All" },
  { value: "Electric Car", label: "Cars" },
  { value: "Electric Scooter", label: "2 Wheelers" },
  { value: "Electric Auto", label: "Autos" },
  { value: "Electric Cargo Auto", label: "Cargo Autos" },
];

const brandOptions = ["all", "Tata", "MG", "Mahindra", "Hyundai", "Ola Electric", "Ather", "Bajaj", "Honda", "TVS", "Toyota", "Suzuki", "Piaggio", "Euler Motors"];

function matchesPrice(item: CatalogItem, bucket: string) {
  if (bucket === "all") return true;
  const price = item.pricing.toLowerCase();
  if (bucket === "below-5") return price.includes("lakh") && !price.includes("+");
  if (bucket === "5-15") return price.includes("1") || price.includes("2") || price.includes("3") || price.includes("4") || price.includes("5");
  return true;
}

export default function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [price, setPrice] = useState("all");

  const filteredItems = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !lowered ||
        item.name.toLowerCase().includes(lowered) ||
        item.brand.toLowerCase().includes(lowered) ||
        item.type.toLowerCase().includes(lowered);

      const matchesCategory = category === "all" || item.type === category;
      const matchesBrand = brand === "all" || item.brand === brand;
      const matchesPriceBucket = matchesPrice(item, price);

      return matchesQuery && matchesCategory && matchesBrand && matchesPriceBucket;
    });
  }, [brand, category, items, price, query]);

  return (
    <div className="space-y-8">
      {/* Category Pills - Scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setCategory(option.value)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border shrink-0 ${
              category === option.value
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] md:p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] xl:grid-cols-[2.5fr_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by model, brand or type"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter size={18} className="text-slate-400" />
            <select value={brand} onChange={(event) => setBrand(event.target.value)} className="w-full bg-transparent text-sm outline-none">
              {brandOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All brands" : option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter size={18} className="text-slate-400" />
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="all">All prices</option>
              <option value="below-5">Budget</option>
              <option value="5-15">Mid range</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filteredItems.length}</span> results
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <Link
            key={`${item.brand}-${item.name}`}
            href={`/product/${toSlug(item.brand, item.name)}`}
            className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-shadow flex flex-col h-full"
          >
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              <Image
                src={item.photo}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex-grow space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{item.brand}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{item.name}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {item.type}
                </span>
              </div>
              <p className="text-sm text-slate-500">{item.pricing}</p>
            </div>
            <div className="p-4 pt-0">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerEnquiryModal(`${item.brand} ${item.name}`);
                }}
                className="w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary transition-colors active:scale-[0.98]"
              >
                Enquire Now <Send size={14} />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
