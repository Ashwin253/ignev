"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Buy", href: "#buy" },
  { name: "Rent", href: "#rent" },
  { name: "Sell", href: "#sell" },
  { name: "Insurance", href: "#insurance" },
  { name: "Service", href: "#service" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
        isScrolled ? "bg-dark/80 backdrop-blur-md border-glass-border shadow-lg" : "bg-transparent py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 font-bold text-3xl tracking-tight z-50">
            <span className="text-primary">Ign</span>
            <span className="text-secondary">EV</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-4 z-50">
            <button className="hidden md:block bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(0,123,255,0.4)] hover:shadow-[0_0_20px_rgba(0,123,255,0.6)]">
              Get Assist
            </button>
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-dark/95 backdrop-blur-lg border-b border-glass-border shadow-xl md:hidden"
          >
            <div className="px-4 py-6 space-y-4 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg text-gray-300 hover:text-white transition-colors px-4 py-2"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-glass-border">
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-full transition-all shadow-[0_0_15px_rgba(0,123,255,0.4)]">
                  Get Assist
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
