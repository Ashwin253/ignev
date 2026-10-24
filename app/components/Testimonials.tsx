"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    role: "Nexon EV Owner",
    text: "EVPLSE made buying my first EV a breeze. Their expert advice on home charging setup was invaluable. Highly recommended for first-time buyers!",
    rating: 5,
  },
  {
    id: 2,
    name: "Priya Patel",
    role: "Ather 450X Owner",
    text: "Got the best exchange value for my old petrol scooter. The entire process from valuation to new delivery took less than 48 hours.",
    rating: 5,
  },
  {
    id: 3,
    name: "Vikram Singh",
    role: "EV Fleet Operator",
    text: "We source our commercial 3-wheelers exclusively through EVPLSE. Their financing options and dedicated service support keep our fleet running.",
    rating: 5,
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#0a0c0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Hear from our <span className="text-secondary">Community</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">Join thousands of satisfied customers who have made the switch to electric with EVPLSE.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              key={t.id}
              className="glass-panel p-8 rounded-3xl relative"
            >
              <Quote className="absolute top-6 right-6 text-white/10" size={48} />
              <div className="flex mb-6">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} size={18} className="text-yellow-400 fill-yellow-400 mr-1" />
                ))}
              </div>
              <p className="text-gray-300 mb-8 italic relative z-10">"{t.text}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-dark font-bold text-lg mr-4">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
