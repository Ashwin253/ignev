"use client";

import { motion } from "framer-motion";
import EnquiryForm from "./EnquiryForm";

export default function ContactForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
    >
      <EnquiryForm
        source="Contact Us Page"
        title="Get in Touch"
        subtitle="Have a question or want to work together? Drop us a line and our team will get back to you shortly."
        buttonText="Send Message"
        includeInterest
      />
    </motion.div>
  );
}
