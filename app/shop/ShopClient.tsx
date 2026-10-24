"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import CheckoutDrawer, { type CheckoutProduct } from "./CheckoutDrawer";
import CurrentOrderPopup from "./CurrentOrderPopup";

type LocalProduct = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
};

export default function ShopClient({ products }: { products: LocalProduct[] }) {
  const [activeProduct, setActiveProduct] = useState<CheckoutProduct | null>(null);

  const openCheckout = (p: LocalProduct) =>
    setActiveProduct({
      id:       0,   // no WC product ID for local products
      name:     p.name,
      price:    `₹${p.price.toLocaleString("en-IN")}`,
      priceRaw: p.price,
      image:    p.image,
    });

  const hasCashfree = !!process.env.NEXT_PUBLIC_CASHFREE_ENV;

  return (
    <>
      {!hasCashfree && <p className="mb-8 max-w-2xl text-sm text-emerald-700">Online payments are temporarily delayed. Cash on delivery is available now.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index }}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex flex-col flex-1 p-5 gap-3">
              <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs leading-5 text-slate-500 line-clamp-2 flex-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                <p className="font-bold text-xl text-slate-900">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
                <button
                  onClick={() => openCheckout(product)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 shadow-sm"
                >
                  <ShoppingCart size={15} /> Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeProduct && (
          <CheckoutDrawer product={activeProduct} onClose={() => setActiveProduct(null)} onOrderPlaced={(order) => window.dispatchEvent(new CustomEvent("evezy:order-placed", { detail: order }))} />
        )}
      </AnimatePresence>
      <CurrentOrderPopup />
    </>
  );
}
