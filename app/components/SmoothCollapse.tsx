"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function SmoothCollapseEmptyState({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // Start collapsing immediately upon mount
    setShow(false);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
