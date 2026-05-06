import { ShoppingBag, ExternalLink } from "lucide-react";
import { fetchWooProducts, wcEnabled, type WooProduct } from "../lib/woocommerce";
import ShopClient from "./ShopClient";

// Local fallback products (Razorpay checkout)
const localProducts = [
  {
    id: "p1",
    name: "Qubo DashCam",
    price: 13000,
    description: "Front dashboard dashcam for EVs",
    image: "https://m.media-amazon.com/images/I/71+Czc5WqDL._SL1500_.jpg",
  },
  {
    id: "p2",
    name: "Portronics Vayu 3.0 Tyre Inflator",
    price: 1500,
    description: "Heavy-duty tyre inflator with 4000 mAh rechargeable battery",
    image: "https://m.media-amazon.com/images/I/715WjbLrzIL._SL1500_.jpg",
  },
  {
    id: "p3",
    name: "OLKINO Tubeless Tyre Puncture Repair Kit",
    price: 300,
    description: "Complete 12-in-1 repair kit — everything you need in one bag",
    image: "https://m.media-amazon.com/images/I/81NapucQCtL._SL1500_.jpg",
  },
  {
    id: "p4",
    name: "Dr.Ortho Orthopaedic Car Cushion",
    price: 1000,
    description: "Memory foam car cushion for comfortable long drives",
    image: "https://m.media-amazon.com/images/I/51qRmMt1RhL._SL1003_.jpg",
  },
];

export default async function ShopPage() {
  // Try WooCommerce first; fall back to local list
  const wooProducts = await fetchWooProducts(20);
  const isWoo = wcEnabled() && wooProducts !== null;

  return (
    <div className="flex-grow pt-32 pb-24 px-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6 relative z-10">
          <ShoppingBag size={16} />
          <span>{isWoo ? "WooCommerce Store" : "Secure Checkout"}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
          EV Accessories{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Shop
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto relative z-10">
          {isWoo
            ? "Products powered by your WooCommerce store. Checkout handled by WooCommerce."
            : "Enhance your EV experience with premium accessories. Secure checkout powered by Razorpay."}
        </p>

        {isWoo && (
          <a
            href={process.env.NEXT_PUBLIC_WC_STORE_URL ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-sky-400 hover:text-sky-300 transition-colors relative z-10"
          >
            Visit full store <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Product grid */}
      {isWoo ? (
        <WooGrid products={wooProducts!} />
      ) : (
        <ShopClient products={localProducts} />
      )}
    </div>
  );
}

// ── WooCommerce product grid (server component, links to WC checkout) ────────
function WooGrid({ products }: { products: WooProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="text-center text-gray-400 py-20">
        No products found in your WooCommerce store.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => {
        const image = product.images[0];
        const price = parseFloat(product.price || product.regular_price || "0");
        const salePrice = product.sale_price
          ? parseFloat(product.sale_price)
          : null;
        const inStock = product.stock_status === "instock";

        return (
          <div
            key={product.id}
            className="bg-[#1a1d24] rounded-2xl overflow-hidden border border-white/5 flex flex-col shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="h-56 w-full relative bg-[#1e222b] overflow-hidden">
              {image ? (
                <img
                  src={image.src}
                  alt={image.alt || product.name}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <ShoppingBag size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d24] to-transparent opacity-80" />
            </div>

            <div className="p-6 flex flex-col flex-grow relative -mt-10 z-10">
              <h3 className="font-bold text-xl leading-tight text-white mb-2">
                {product.name}
              </h3>
              {product.short_description && (
                <p
                  className="text-gray-400 text-sm mb-4 flex-grow leading-relaxed line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: product.short_description,
                  }}
                />
              )}

              <div className="flex items-end justify-between mt-auto">
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
                    Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-2xl text-white">
                      ₹{price.toLocaleString("en-IN")}
                    </p>
                    {salePrice && (
                      <p className="text-sm text-gray-500 line-through">
                        ₹{parseFloat(product.regular_price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={`${product.permalink}?add-to-cart=${product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    inStock
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {inStock ? (
                    <>
                      <ShoppingBag size={18} /> Buy
                    </>
                  ) : (
                    "Out of stock"
                  )}
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
