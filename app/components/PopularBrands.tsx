"use client";

import { motion } from "framer-motion";

const brands = [
  { name: "Tata", logo: "TATA" },
  { name: "MG", logo: "MG" },
  { name: "Mahindra", logo: "MAHINDRA" },
  { name: "BYD", logo: "BYD" },
  { name: "Hyundai", logo: "HYUNDAI" },
  { name: "Ather", logo: "ATHER" },
  { name: "Ola", logo: "OLA" },
  // { name: "TVS", logo: "TVS" },
];

export default function PopularBrands() {
  return (
    <section className="py-20 bg-dark border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold mb-10 text-gray-300">Trusted by Top Brands</h2>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
          {brands.map((brand, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              viewport={{ once: true }}
              key={brand.name}
              className="px-6 py-4 glass-panel rounded-xl grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105 hover:border-primary/50 cursor-pointer"
            >
              <span className="text-xl font-black tracking-widest text-white/80 hover:text-white transition-colors">
                {brand.logo}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
