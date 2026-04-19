"use client";

import { motion } from "framer-motion";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Image/Video representation */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/50 to-dark z-10" />
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938cb?auto=format&fit=crop&q=80&w=2072"
          alt="Premium EV"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-glass text-secondary border border-secondary/30 text-sm font-medium mb-6">
            The Future of Mobility is Here
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Drive <span className="text-primary">Electric.</span> <br className="hidden md:block" />
            Buy <span className="text-secondary">Smart.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Buy, rent, sell and service EV & Hybrid vehicles in one place. Experience seamless automotive transition.
          </p>

          {/* Search Bar */}
          <div className="glass-panel p-3 md:p-4 rounded-2xl md:rounded-full max-w-4xl mx-auto shadow-2xl mb-12">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 bg-dark/50 rounded-xl md:rounded-full px-5 py-3 border border-white/5 flex items-center">
                <Search size={20} className="text-gray-400 mr-3" />
                <select className="bg-transparent border-none outline-none w-full text-white appearance-none cursor-pointer">
                  <option value="" className="bg-dark text-gray-400">All Brands</option>
                  <option value="tata" className="bg-dark text-white">Tata</option>
                  <option value="mg" className="bg-dark text-white">MG</option>
                  <option value="tesla" className="bg-dark text-white">Tesla</option>
                </select>
              </div>

              <div className="flex-1 bg-dark/50 rounded-xl md:rounded-full px-5 py-3 border border-white/5 flex items-center">
                <SlidersHorizontal size={20} className="text-gray-400 mr-3" />
                <select className="bg-transparent border-none outline-none w-full text-white appearance-none cursor-pointer">
                  <option value="" className="bg-dark text-gray-400">Vehicle Type</option>
                  <option value="suv" className="bg-dark text-white">SUV</option>
                  <option value="sedan" className="bg-dark text-white">Sedan</option>
                  <option value="2w" className="bg-dark text-white">2 Wheeler</option>
                </select>
              </div>

              <div className="flex-1 bg-dark/50 rounded-xl md:rounded-full px-5 py-3 border border-white/5 flex items-center">
                <MapPin size={20} className="text-gray-400 mr-3" />
                <select className="bg-transparent border-none outline-none w-full text-white appearance-none cursor-pointer">
                  <option value="" className="bg-dark text-gray-400">Location</option>
                  <option value="delhi" className="bg-dark text-white">Delhi NCR</option>
                  <option value="mumbai" className="bg-dark text-white">Mumbai</option>
                  <option value="bangalore" className="bg-dark text-white">Bangalore</option>
                </select>
              </div>

              <button className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-xl md:rounded-full transition-all shadow-[0_0_15px_rgba(0,123,255,0.3)] md:w-auto w-full">
                Search
              </button>
            </div>
          </div>

          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-white text-dark font-semibold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors shadow-xl">
              Explore Cars
            </button>
            <button className="w-full sm:w-auto glass-panel text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors">
              Get Assist
            </button>
          </div> */}
        </motion.div>
      </div>
    </section>
  );
}
