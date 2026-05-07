"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, User, Phone, Mail, MapPin,
  Loader2, CheckCircle2,
} from "lucide-react";
import Image from "next/image";

export type CheckoutProduct = {
  id: number;
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
}: {
  product: CheckoutProduct | null;
  onClose: () => void;
}) {
  const [step, setStep]       = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentId, setPaymentId] = useState("");
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
      // 1. Create Cashfree + WC order server-side
      const orderRes = await fetch("/api/shop/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:   product.id,
          productName: product.name,
          price:       product.priceRaw,
          customer:    form,
        }),
      });

      const orderData = await orderRes.json() as {
        paymentSessionId: string;
        cfOrderId: string;
        wcOrderId: number | null;
        error?: string;
      };

      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error ?? "Failed to create order.");
      }

      // 2. Load Cashfree JS SDK dynamically
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV ?? "sandbox") as "sandbox" | "production",
      });

      // 3. Open Cashfree checkout (drop-in)
      const result = await cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget:   "_modal",   // opens as modal overlay, no page redirect
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Payment failed.");
      }

      if (result.paymentDetails?.paymentStatus !== "SUCCESS") {
        // User closed modal without paying
        setStep("form");
        return;
      }

      // 4. Verify server-side
      const verifyRes = await fetch("/api/shop/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cfOrderId: orderData.cfOrderId,
          wcOrderId: orderData.wcOrderId,
        }),
      });

      const verifyData = await verifyRes.json() as {
        ok?: boolean; paymentId?: string; error?: string;
      };

      if (!verifyRes.ok || !verifyData.ok) {
        throw new Error(verifyData.error ?? "Verification failed.");
      }

      setPaymentId(verifyData.paymentId ?? orderData.cfOrderId);
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStep("error");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-sky-600" />
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

        {/* Product summary */}
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
                <span className="text-sky-600 font-bold">{product.price}</span>
                {product.onSale && product.regularPrice && (
                  <span className="text-xs text-slate-400 line-through">{product.regularPrice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* Form */}
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Phone size={12} /> Phone *
                    </span>
                    <input required type="tel" pattern="[6-9][0-9]{9}" value={form.phone} onChange={set("phone")} placeholder="9876543210"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Mail size={12} /> Email
                    </span>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={12} /> Address *
                  </span>
                  <textarea required value={form.address} onChange={set("address")} rows={2}
                    placeholder="House no., Street, Area"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all resize-none" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 block">City *</span>
                    <input required value={form.city} onChange={set("city")} placeholder="Mumbai"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-600 mb-1.5 block">Pincode *</span>
                    <input required pattern="[1-9][0-9]{5}" value={form.pincode} onChange={set("pincode")} placeholder="400001"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 mb-1.5 block">State *</span>
                  <select required value={form.state} onChange={set("state")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all">
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>

                <button type="submit"
                  className="w-full mt-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 text-sm transition-colors shadow-sm active:scale-[0.98]">
                  Pay {product?.price} with Cashfree →
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  Secured by Cashfree · UPI, Cards, Net Banking, Wallets
                </p>
              </motion.form>
            )}

            {/* Processing */}
            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-64 gap-4 px-6">
                <Loader2 size={36} className="text-sky-500 animate-spin" />
                <p className="text-slate-600 font-medium">Opening payment…</p>
              </motion.div>
            )}

            {/* Success */}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Order placed!</h3>
                  <p className="text-slate-500 text-sm">Payment confirmed. You'll receive a confirmation shortly.</p>
                  {paymentId && (
                    <p className="mt-3 text-xs text-slate-400 font-mono bg-slate-50 rounded-lg px-3 py-2">
                      Payment ID: {paymentId}
                    </p>
                  )}
                </div>
                <button onClick={onClose}
                  className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Continue shopping
                </button>
              </motion.div>
            )}

            {/* Error */}
            {step === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center">
                  <X size={36} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Payment failed</h3>
                  <p className="text-slate-500 text-sm">{errorMsg || "Something went wrong. Please try again."}</p>
                </div>
                <button onClick={() => setStep("form")}
                  className="rounded-full bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-semibold transition-colors">
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
