"use client";

import { useState } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export default function AssistPopup() {
  const [isOpen, setIsOpen] = useState(false);
  // Replace with actual Formspree form ID
  const [state, handleSubmit] = useForm("xjvqzzrz"); 

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-primary to-blue-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(0,123,255,0.5)] hover:scale-110 transition-transform flex items-center justify-center group"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-4 bg-dark/90 backdrop-blur-sm border border-white/10 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need Help?
        </span>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-10"
            >
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">Get Assist</h3>
                  <p className="text-sm text-gray-400 mt-1">Leave your details and our EV expert will call you back.</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {state.succeeded ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Request Submitted!</h4>
                    <p className="text-gray-400">Our team will get back to you shortly.</p>
                    <button 
                      onClick={() => { setIsOpen(false); /* Reset logic could go here */ }}
                      className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                          id="name"
                          type="text" 
                          name="name"
                          required
                          className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="John Doe"
                        />
                        <ValidationError prefix="Name" field="name" errors={state.errors} className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                        <input
                          id="phone"
                          type="tel" 
                          name="phone"
                          required
                          className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="+91 XXXXX XXXXX"
                        />
                        <ValidationError prefix="Phone" field="phone" errors={state.errors} className="text-red-500 text-sm mt-1" />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input
                          id="email"
                          type="email" 
                          name="email"
                          required
                          className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          placeholder="john@example.com"
                        />
                        <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="interest" className="block text-sm font-medium text-gray-400 mb-1">Interested In</label>
                      <select 
                        id="interest"
                        name="interest"
                        required
                        className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
                      >
                        <option value="" disabled selected>Select an option</option>
                        <option value="Buy">Buy an EV</option>
                        <option value="Rent">Rent an EV</option>
                        <option value="Sell">Sell my EV</option>
                        <option value="Insurance">EV Insurance</option>
                        <option value="Service">EV Service/Maintenance</option>
                      </select>
                      <ValidationError prefix="Interest" field="interest" errors={state.errors} className="text-red-500 text-sm mt-1" />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-1">Message (Optional)</label>
                      <textarea
                        id="message"
                        name="message"
                        rows={3}
                        className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                        placeholder="Tell us what you're looking for..."
                      ></textarea>
                      <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-sm mt-1" />
                    </div>

                    <button
                      type="submit"
                      disabled={state.submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(0,123,255,0.3)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                      {state.submitting ? "Submitting..." : "Request Callback"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
