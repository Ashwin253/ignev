"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { triggerEnquiryModal } from "./EnquiryModal";

const brands = [
  { name: "Tata Motors", logo: "/brands/tataev.webp" },
  { name: "Mahindra", logo: "/brands/mahindra.png" },
  { name: "BYD", logo: "/brands/byd.png" },
  { name: "Ather", logo: "/brands/ather.png" },
  { name: "Bajaj Motors", logo: "/brands/bajajmotors.png" },
  { name: "TVS", logo: "/brands/tvs.png" },
];

export default function PopularBrands() {
  return (
    <section className="py-20 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm">
              <BadgeCheck size={14} />
              Popular brands
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              viewport={{ once: true }}
              onClick={() => triggerEnquiryModal(`Brand: ${brand.name}`)}
              className="group flex flex-col items-center justify-center gap-3 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] cursor-pointer rounded-2xl border border-transparent hover:border-slate-100"
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                width={50}
                height={50}
                className="object-contain w-[50px] h-[50px] grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
