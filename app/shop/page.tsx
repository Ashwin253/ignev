import { getShopProducts } from "../lib/shop";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export const metadata = {
  title: "EV Accessories Shop | EVPLSE",
  description: "Premium EV accessories, spare parts and merchandise. Cash on delivery across India.",
};

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <section className="min-h-screen bg-white py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              EV Accessories
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-500">
              Parts, accessories and gear for your electric vehicle — with cash on delivery.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            Pay on delivery · COD available
          </div>
        </div>

        <ShopClient products={products} />
      </div>
    </section>
  );
}
