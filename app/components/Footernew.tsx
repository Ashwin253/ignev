"use client";

import Link from "next/link";
import { Globe, Share2, MessageSquare, Hash, Mail, Phone, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/nearme")) {
    return null;
  }

  return (
    <footer className="bg-[#a1d3fc] pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center font-bold text-3xl tracking-tight">
              {/* <span className="text-primary">EV</span>
              <span className="text-secondary">Plse</span> */}
            <img src="/evplselogo.png" alt="IgnEV Logo" className="h-16 w-auto" loading="lazy" />
            </Link>
            <p className="text-gray-400">
              India's premier marketplace for electric and hybrid vehicles. Making sustainable mobility accessible to everyone.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"><Globe size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"><Share2 size={18} /></a>
              {/* <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"><MessageSquare size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"><Hash size={18} /></a> */}
            {/* <a href="/team" className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"><MessageSquare size={10} />Team</a> */}
            </div>
          </div>

          {/* Quick Links */}
          {/* <div>
            <h3 className="text-lg font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {['Buy', 'Rent', 'Sell', 'Insurance', 'Service'].map((link) => (
                <li key={link}>
                  <Link href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-secondary transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-secondary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-secondary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          {/* <div>
            <h3 className="text-lg font-bold text-white mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={20} className="text-primary mr-3 mt-1 shrink-0" />
                <span className="text-gray-400">123 EV Park, Tech Hub Road, Bangalore, Karnataka 560001</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="text-primary mr-3 shrink-0" />
                <span className="text-gray-400">+91 1800-EV-SMART</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="text-primary mr-3 shrink-0" />
                <span className="text-gray-400">evplseadmin@gmail.com</span>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} EVPULSE Future Mobility. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Designed for the future.</p>
        </div>
      </div>
    </footer>
  );
}
