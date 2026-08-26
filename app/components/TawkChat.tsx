"use client";

import { useEffect } from "react";

export default function TawkChat() {
  useEffect(() => {
    // Check if script is already added
    if (document.getElementById("tawk-script")) return;

    // Set up Tawk_API globally
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_API.customStyle = {
      visibility: {
        desktop: { position: 'br', xOffset: 20, yOffset: 20 },
        mobile: { position: 'br', xOffset: 10, yOffset: 10 },
      }
    };

    (window as any).Tawk_API.onChatMaximized = function() {
      document.documentElement.classList.add("tawk-maximized");
    };
    (window as any).Tawk_API.onChatMinimized = function() {
      document.documentElement.classList.remove("tawk-maximized");
    };

    // Hide Tawk widget when Ask Plse chat is open (to avoid overlap)
    (window as any).Tawk_API.onLoad = function() {
      (window as any).Tawk_API.showWidget();
    };
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a4b596cb225131d45677f55/1jsr5al0h";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    const s0 = document.getElementsByTagName("script")[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }

    return () => {
      document.documentElement.classList.remove("tawk-maximized");
    };
  }, []);

  return null;
}
