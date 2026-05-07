"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { ShoppingBag, Tag } from "lucide-react";
import CheckoutDrawer, { type CheckoutProduct } from "./CheckoutDrawer";
import { formatWooPrice } from "../lib/woocommerce";
import type { WooProduct } from "../lib/woocommerce";

export default function WooShopClient({ products }: { products: WooProduct[] }) {
  const [activeProduct, setActiveProduct] = useState<CheckoutProduct | null>(null);

  const openCheckout = (p: WooProduct) => {
    const price = p.price || p.regular_price;
    setActiveProduct({
      id:           p.id,
      name:         p.name,
      price:        formatWooPrice(price),
      priceRaw:     parseFloat(price) || 0,
      image:        p.images[0]?.src ?? "",
      regularPrice: p.on_sale ? formatWooPrice(p.regular_price) : undefined,
      onSale:       p.on_sale,
    });
  };

  if (products.length === 0) {
    return (
      <div className="py-24 text-center text-slate-400">
        <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">No products found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const image = product.images[0];
          const price = product.price || product.regular_price;
          const inStock = product.stock_status === "instock";
          const cat = product.categories[0];

          return (
            <div
              key={product.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {image ? (
                  <Image
                    src={image.src}
                    alt={image.alt || product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-slate-300" />
                  </div>
                )}
                {product.on_sale && (
                  <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    SALE
                  </span>
                )}
                {!inStock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                      Out of stock
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-5 gap-3">
                {cat && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                    <Tag size={10} /> {cat.name}
                  </span>
                )}
                <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
                  {product.name}
                </h3>
                {product.short_description && (
                  <p
                    className="text-xs leading-5 text-slate-500 line-clamp-2 flex-1"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                  />
                )}

                {/* Price + CTA */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                  <div>
                    <p className="font-bold text-xl text-slate-900">
                      {formatWooPrice(price)}
                    </p>
                    {product.on_sale && product.regular_price && (
                      <p className="text-xs text-slate-400 line-through">
                        {formatWooPrice(product.regular_price)}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => inStock && openCheckout(product)}
                    disabled={!inStock}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      inStock
                        ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sm active:scale-95"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingBag size={15} />
                    {inStock ? "Buy Now" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout drawer */}
      <AnimatePresence>
        {activeProduct && (
          <CheckoutDrawer
            product={activeProduct}
            onClose={() => setActiveProduct(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
