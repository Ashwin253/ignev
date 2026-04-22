"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Users, Banknote } from "lucide-react";

const features = [
  {
    id: 1,
    title: "Trusted Deals",
    desc: "Every vehicle goes through a rigorous 150-point inspection process ensuring you get exactly what you pay for.",
    icon: CheckCircle2,
    color: "text-blue-400"
  },
  {
    id: 2,
    title: "EV Experts",
    desc: "Our specialized team understands EV battery health, charging infrastructure, and software updates better than anyone.",
    icon: Users,
    color: "text-green-400"
  },
  {
    id: 3,
    title: "Easy Financing",
    desc: "Get instant approval for EV loans with lower interest rates and flexible EMIs tailored for electric vehicles.",
    icon: Banknote,
    color: "text-purple-400"
  }
];

export default function WhyEVPULSE() {
  return (
    <section className="py-24 bg-[#0f1115] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose <span className="text-gradient">EVPULSE</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">We are India's first dedicated platform solving the unique challenges of buying, owning, and selling electric vehicles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              viewport={{ once: true }}
              key={feature.id}
              className="glass-panel p-8 rounded-3xl hover:bg-white/[0.05] transition-colors border border-white/5"
            >
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${feature.color}`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
