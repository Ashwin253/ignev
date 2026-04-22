'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { ShoppingCart, Shield, AlertTriangle } from 'lucide-react';
import Script from 'next/script';

const products = [
  { id: 'p1', name: 'Qubo DashCam', price: 13000, description: 'Front Dashboard dashcam for evs', image: 'https://m.media-amazon.com/images/I/71+Czc5WqDL._SL1500_.jpg' },
  { id: 'p2', name: 'Portronics Vayu 3.0 tyre Inflator ', price: 1500, description: 'Heavy-duty Tyre Inflator with 4000 mAh Rechargeable Battery', image: 'https://m.media-amazon.com/images/I/715WjbLrzIL._SL1500_.jpg' },
  { id: 'p3', name: 'OLKINO Tubeless Tyre Puncture Repair Kit ', price: 300, description: 'Complete 12-in-1 Repair Kit: Everything you need in one bag', image: 'https://m.media-amazon.com/images/I/81NapucQCtL._SL1500_.jpg' },
  { id: 'p4', name: 'Dr.Ortho Orthopaedic Car Cushion Pillows', price: 1000, description: 'Dr. Ortho car cushion made with memory foam allows you to sit comfortably and drive without any discomfort.', image: 'https://m.media-amazon.com/images/I/51qRmMt1RhL._SL1003_.jpg' },
];

export default function ShopPage() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleBuy = async (product: typeof products[0]) => {
    setProcessingId(product.id);

    try {
      // 1. Create Order on Backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: product.price }),
      });

      const order = await res.json();

      if (order.error) {
        alert("Failed to initialize payment: " + order.error);
        setProcessingId(null);
        return;
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Should be in .env.local
        amount: order.amount,
        currency: order.currency,
        name: "EVPULSE Marketplace",
        description: `Purchase of ${product.name}`,
        order_id: order.id,
        handler: function (response: any) {
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          // You would typically verify this payment signature on the backend here
        },
        prefill: {
          name: "EVPULSE Customer",
          email: "customer@evezy.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
      });
      paymentObject.open();

    } catch (error) {
      console.error("Razorpay Integration Error:", error);
      alert("Checkout unavailable. Please check your console and API keys.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1115] text-white flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Header />

      <div className="flex-grow pt-32 pb-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6 relative z-10"
          >
            <Shield size={16} />
            <span>Secure Checkout</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6 relative z-10"
          >
            EV Accessories <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Shop</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto relative z-10"
          >
            Enhance your electric vehicle experience with our premium selection of certified parts and accessories. Secure checkout powered by Razorpay.
          </motion.p>
        </div>

        {!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && (
          <div className="mb-12 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl flex items-start gap-3 max-w-3xl mx-auto">
            <AlertTriangle className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold mb-1">Razorpay Keys Missing</p>
              <p className="text-sm opacity-80">To make actual test payments, please add <code className="bg-black/30 px-1.5 py-0.5 rounded">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and <code className="bg-black/30 px-1.5 py-0.5 rounded">RAZORPAY_KEY_SECRET</code> to your <code className="bg-black/30 px-1.5 py-0.5 rounded">.env.local</code> file.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-[#1a1d24] rounded-2xl overflow-hidden border border-white/5 flex flex-col shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="h-56 w-full relative bg-[#1e222b] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d24] to-transparent opacity-80" />
              </div>
              <div className="p-6 flex flex-col flex-grow relative -mt-10 z-10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl leading-tight text-white">{product.name}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{product.description}</p>

                {/* <div className="flex items-center gap-2 text-xs text-emerald-400 mb-6 bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                  <Shield size={12} /> Certified Part
                </div> */}

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Price</p>
                    <p className="font-bold text-2xl text-white">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    onClick={() => handleBuy(product)}
                    disabled={processingId === product.id}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${processingId === product.id ? 'bg-blue-600/50 cursor-wait text-white/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5'}`}
                  >
                    {processingId === product.id ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>
                        <ShoppingCart size={18} /> Buy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
