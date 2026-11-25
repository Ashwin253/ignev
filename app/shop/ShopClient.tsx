"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ShoppingBag, PackageX, Wrench, Car, Shirt } from "lucide-react";
import CheckoutDrawer, { type CheckoutProduct } from "./CheckoutDrawer";
import CurrentOrderPopup from "./CurrentOrderPopup";
import {
  formatShopPrice,
  SHOP_PRODUCT_TYPE_LABEL,
  type ShopProduct,
  type ShopProductType,
} from "../lib/shop";

const TYPE_ICON: Record<ShopProductType, React.ReactNode> = {
  accessory: <Wrench size={12} />,
  vehicle: <Car size={12} />,
  spare_part: <Wrench size={12} />,
  merch: <Shirt size={12} />,
};

export default function ShopClient({ products }: { products: ShopProduct[] }) {
  const [activeProduct, setActiveProduct] = useState<CheckoutProduct | null>(null);

  const openCheckout = (p: ShopProduct) =>
    setActiveProduct({
      id: p.id,
      name: p.name,
      price: formatShopPrice(p.price),
      priceRaw: p.price,
      image: p.image,
      regularPrice: p.mrp && p.mrp > p.price ? formatShopPrice(p.mrp) : undefined,
      onSale: Boolean(p.mrp && p.mrp > p.price),
    });

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 py-20 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-800">No products in the shop yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          The team is stocking the shelves — check back soon.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => {
          const outOfStock = product.stock <= 0;
          const onSale = Boolean(product.mrp && product.mrp > product.price);

          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                {product.image ? (
                  // Plain <img>: product images can point at hosts outside the
                  // next/image allowlist, and we don't want a bad URL to break the grid.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-slate-300" />
                  </div>
                )}

                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                  {TYPE_ICON[product.product_type]}
                  {SHOP_PRODUCT_TYPE_LABEL[product.product_type]}
                </span>

                {onSale && !outOfStock && (
                  <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    SALE
                  </span>
                )}

                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                      <PackageX size={13} /> Out of stock
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {product.brand && <span>{product.brand}</span>}
                  {product.brand && product.category && <span>·</span>}
                  <span>{product.category}</span>
                </div>

                <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="line-clamp-2 flex-1 text-xs leading-5 text-slate-500">
                    {product.description}
                  </p>
                )}

                {product.vehicle_model && (
                  <div className="text-[11px] font-semibold text-emerald-700">
                    {product.vehicle_slug ? (
                      <Link href={`/product/${product.vehicle_slug}`} className="hover:underline">
                        Fits {product.vehicle_model} →
                      </Link>
                    ) : (
                      <span>Fits {product.vehicle_model}</span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                  <div>
                    <p className="text-xl font-bold text-slate-900">{formatShopPrice(product.price)}</p>
                    {onSale && product.mrp && (
                      <p className="text-xs text-slate-400 line-through">{formatShopPrice(product.mrp)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openCheckout(product)}
                    disabled={outOfStock}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <ShoppingCart size={15} /> Buy Now
                  </button>
                </div>

                {!outOfStock && product.stock <= 5 && (
                  <p className="text-[11px] font-semibold text-amber-600">Only {product.stock} left</p>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {activeProduct && (
          <CheckoutDrawer
            product={activeProduct}
            onClose={() => setActiveProduct(null)}
            onOrderPlaced={(order) =>
              window.dispatchEvent(new CustomEvent("evezy:order-placed", { detail: order }))
            }
          />
        )}
      </AnimatePresence>
      <CurrentOrderPopup />
    </>
  );
}
