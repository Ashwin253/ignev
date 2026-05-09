'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Zap, ShoppingBag, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Shop', href: '/shop', icon: ShoppingBag, color: 'bg-emerald-500' },
  { name: 'Map', href: '/map', icon: Map, color: 'bg-blue-500' },
  { name: 'Quick', href: '/service', icon: Zap, color: 'bg-amber-500' },
];

export default function FloatingMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden flex flex-col items-end gap-3">
      {/* Expanded Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  transition={{ delay: (navItems.length - index - 1) * 0.05 }}
                >
                  <Link 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="bg-slate-900/90 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.name}
                    </span>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border border-white/20 transition-transform active:scale-95 ${item.color} ${isActive ? 'ring-4 ring-white/30' : ''}`}>
                      <Icon size={24} className="text-white" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(163,255,18,0.4)] border border-white/20 transition-all duration-300 active:scale-90 ${isOpen ? 'bg-slate-800 rotate-0' : 'bg-secondary'}`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {isOpen ? <X size={32} className="text-white" /> : <Zap size={32} className="text-black fill-black" />}
        </motion.div>
      </button>

      {/* Backdrop for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-[2px]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
