import Link from "next/link";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { fetchWooProducts, wcEnabled } from "../lib/woocommerce";
import WooShopClient from "./WooShopClient";
import ShopClient from "./ShopClient";

export const metadata = {
  title: "EV Accessories Shop | EVPULSE",
  description: "Premium EV accessories. Secure on-page checkout powered by Razorpay.",
};

// ── Local fallback products ───────────────────────────────────────────────────
const localProducts = [
  { id: "p1", name: "Qubo DashCam",                      price: 13000, description: "Front dashboard dashcam for EVs",                             image: "https://m.media-amazon.com/images/I/71+Czc5WqDL._SL1500_.jpg" },
  { id: "p2", name: "Portronics Vayu 3.0 Tyre Inflator", price: 1500,  description: "Heavy-duty tyre inflator with 4000 mAh rechargeable battery", image: "https://m.media-amazon.com/images/I/715WjbLrzIL._SL1500_.jpg" },
  { id: "p3", name: "OLKINO Puncture Repair Kit",         price: 300,   description: "Complete 12-in-1 tubeless tyre repair kit",                  image: "https://m.media-amazon.com/images/I/81NapucQCtL._SL1500_.jpg" },
  { id: "p4", name: "Dr.Ortho Car Cushion",               price: 1000,  description: "Memory foam orthopaedic car cushion",                        image: "https://m.media-amazon.com/images/I/51qRmMt1RhL._SL1003_.jpg" },
];

export default async function ShopPage() {
  const isWoo = wcEnabled();
  const wooProducts = isWoo ? await fetchWooProducts(40) : null;

  return (
    <section className="bg-white min-h-screen py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {/* <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm mb-4">
              <ShoppingBag size={13} />
              {isWoo ? "WooCommerce Store" : "Accessories Shop"}
            </span> */}
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              EV Accessories
            </h1>
            {/* <p className="mt-3 text-slate-500 text-base max-w-xl">
              {isWoo
                ? "Live products from your WooCommerce store — checkout happens right here, no redirects."
                : "Premium EV accessories with secure on-page checkout."}
            </p> */}
          </div>
          {/* <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
          >
            Browse EVs →
          </Link> */}
        </div>

        {/* WC not configured notice */}
        {!isWoo && (
          <div className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 max-w-2xl">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 mb-1">WooCommerce not connected</p>
              <p className="text-amber-700">
                Add <code className="bg-amber-100 px-1 rounded text-xs">WC_BASE_URL</code>,{" "}
                <code className="bg-amber-100 px-1 rounded text-xs">WC_CONSUMER_KEY</code>, and{" "}
                <code className="bg-amber-100 px-1 rounded text-xs">WC_CONSUMER_SECRET</code>{" "}
                to <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code>.
                Showing local fallback products.
              </p>
            </div>
          </div>
        )}

        {/* Products */}
        {isWoo && wooProducts ? (
          <WooShopClient products={wooProducts} />
        ) : (
          <ShopClient products={localProducts} />
        )}

      </div>
    </section>
  );
}
