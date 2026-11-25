"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, User, Phone, Mail, MapPin,
  Loader2, CheckCircle2, Banknote,
} from "lucide-react";
import Image from "next/image";

export type CheckoutProduct = {
  id: string | number;
  name: string;
  price: string;
  priceRaw: number;
  image: string;
  regularPrice?: string;
  onSale?: boolean;
};

type CustomerForm = {
  name: string; email: string; phone: string;
  address: string; city: string; state: string; pincode: string;
};

type Step = "form" | "processing" | "success" | "error";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

export default function CheckoutDrawer({
  product,
  onClose,
  onOrderPlaced,
}: {
  product: CheckoutProduct | null;
  onClose: () => void;
  onOrderPlaced?: (order: { id: string; productName: string; price: string; paymentMethod: "cod" }) => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [form, setForm] = useState<CustomerForm>({
    name: "", email: "", phone: "",
    address: "", city: "", state: "Maharashtra", pincode: "",
  });

  const set = (f: keyof CustomerForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setStep("processing");
    setErrorMsg("");

    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productId: String(product.id),
              name: product.name,
              price: product.priceRaw,
              qty: 1,
              image: product.image,
            },
          ],
          customer: form,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        order?: { id: string; order_number: string; total: number };
        error?: string;
      };

      if (!res.ok || !data.ok || !data.order) {
        throw new Error(data.error ?? "Could not place the order.");
      }

      setOrderNumber(data.order.order_number);
      onOrderPlaced?.({
        id: data.order.order_number,
        productName: product.name,
        price: product.price,
        paymentMethod: "cod",
      });
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStep("error");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {product && (
          <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
              {product.image && (
                <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 line-clamp-1">{product.name}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-emerald-600 font-bold">{product.price}</span>
                {product.onSale && product.regularPrice && (
                  <span className="text-xs text-slate-400 line-through">{product.regularPrice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="px-6 py-6 space-y-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Delivery details
                </p>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Full name *
                  </span>
                  <input required value={form.name} onChange={set("name")} placeholder="Rahul Sharma"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Phone size={12} /> Phone *
                    </span>
                    <input required type="tel" pattern="[6-9][0-9]{9}" value={form.phone} onChange={set("phone")} placeholder="9876543210"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Mail size={12} /> Email
                    </span>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={12} /> Address *
                  </span>
                  <textarea required value={form.address} onChange={set("address")} rows={2}
                    placeholder="House no., Street, Area"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 block">City *</span>
                    <input required value={form.city} onChange={set("city")} placeholder="Mumbai"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 block">Pincode *</span>
                    <input required pattern="[1-9][0-9]{5}" value={form.pincode} onChange={set("pincode")} placeholder="400001"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 mb-1.5 block">State *</span>
                  <select required value={form.state} onChange={set("state")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all">
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-700">
                  <Banknote size={15} /> Cash on delivery
                </div>

                <button type="submit"
                  className="w-full mt-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-sm transition-colors shadow-sm active:scale-[0.98]">
                  Place COD order · {product?.price}
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  Pay in cash when your order is delivered. No advance payment needed.
                </p>
              </motion.form>
            )}

            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4 px-6">
                <Loader2 size={36} className="text-emerald-500 animate-spin" />
                <p className="text-slate-600 font-medium">Placing your order...</p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Order placed!</h3>
                  <p className="text-slate-500 text-sm">
                    Your COD order is confirmed. Pay when it is delivered.
                  </p>
                  {orderNumber && (
                    <p className="mt-3 text-xs text-slate-400 font-mono bg-slate-50 rounded-lg px-3 py-2">
                      Order ID: {orderNumber}
                    </p>
                  )}
                </div>
                <button onClick={onClose}
                  className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Continue shopping
                </button>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center">
                  <X size={36} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Could not place order</h3>
                  <p className="text-slate-500 text-sm">{errorMsg || "Something went wrong. Please try again."}</p>
                </div>
                <button onClick={() => setStep("form")}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-sm font-semibold transition-colors">
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}
