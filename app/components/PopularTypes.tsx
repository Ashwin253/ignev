"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    id: 1,
    title: "2 Wheeler EV",
    desc: "Commute smart and save daily.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "3 Wheeler EV",
    desc: "Perfect for commercial needs.",
    image: "https://mahindralastmilemobility.com/assets/front/images/treo-metal/slider/1.png", // using auto rickshaw proxy image
  },
  {
    id: 3,
    title: "Cars / SUVs",
    desc: "Experience luxury and space.",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800", // using tesla proxy image
  },
];

export default function PopularTypes() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Popular <span className="text-primary">Categories</span></h2>
            <p className="text-slate-600 max-w-xl">Find the perfect electric vehicle category that fits your lifestyle, business, or family needs.</p>
          </div>
          <button className="hidden md:flex items-center text-sky-600 hover:text-sky-700 font-medium transition-colors">
            View All <ArrowRight size={20} className="ml-2" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              key={cat.id}
              className="group rounded-3xl overflow-hidden relative glass-panel aspect-[4/5] md:aspect-auto md:h-[450px] border border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"
            >
              <div className="absolute inset-0 z-0">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/20 to-transparent" />
              </div>
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{cat.title}</h3>
                <p className="text-slate-100 mb-6">{cat.desc}</p>
                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium px-6 py-3 rounded-full hover:bg-white hover:text-dark transition-all flex items-center justify-between w-full">
                  <span>Explore</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="md:hidden w-full mt-8 flex items-center justify-center text-secondary font-medium py-4 border border-secondary/20 rounded-full">
          View All Categories <ArrowRight size={20} className="ml-2" />
        </button>
      </div>
    </section>
  );
}
