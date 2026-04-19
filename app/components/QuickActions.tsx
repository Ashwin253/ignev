"use client";

import { motion } from "framer-motion";
import { CarFront, Zap, FileCheck, ShieldCheck, Wrench } from "lucide-react";

const actions = [
  { id: 1, title: "Buy", icon: CarFront, desc: "New & Used EVs", color: "from-blue-500/20 to-primary/20", borderColor: "hover:border-primary", shadow: "hover:shadow-[0_0_30px_rgba(0,123,255,0.3)]" },
  { id: 2, title: "Rent", icon: Zap, desc: "Flexible Plans", color: "from-green-500/20 to-secondary/20", borderColor: "hover:border-secondary", shadow: "hover:shadow-[0_0_30px_rgba(163,255,18,0.3)]" },
  { id: 3, title: "Sell", icon: FileCheck, desc: "Best Valuation", color: "from-purple-500/20 to-purple-600/20", borderColor: "hover:border-purple-500", shadow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]" },
  { id: 4, title: "Insurance", icon: ShieldCheck, desc: "EV Specific", color: "from-orange-500/20 to-orange-600/20", borderColor: "hover:border-orange-500", shadow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]" },
  { id: 5, title: "Service", icon: Wrench, desc: "Expert Care", color: "from-teal-500/20 to-teal-600/20", borderColor: "hover:border-teal-500", shadow: "hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]" },
];

export default function QuickActions() {
  return (
    <section className="py-20 bg-dark relative z-20 -mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {actions.map((action, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              key={action.id}
              className={`glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group border border-white/10 ${action.borderColor} ${action.shadow} hover:-translate-y-2`}
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{action.title}</h3>
              <p className="text-sm text-gray-400">{action.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
