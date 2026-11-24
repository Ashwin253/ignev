"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const AskPlseWidget = dynamic(() => import("./AskPlseWidget"), { ssr: false });
const BestOfferPopup = dynamic(() => import("./BestOfferPopup"), { ssr: false });
const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

type WidgetTab = "chat" | "assist";

export default function DeferredGlobalWidgets() {
  const [loadWidget, setLoadWidget] = useState(false);
  const [loadOffer, setLoadOffer] = useState(false);
  const [loadPalette, setLoadPalette] = useState(false);
  const [openSignal, setOpenSignal] = useState<{ tab: WidgetTab; n: number } | null>(null);
  const [openPalette, setOpenPalette] = useState(false);
  const paletteLoaded = useRef(false);
  const signalCount = useRef(0);

  useEffect(() => {
    // Each open event bumps the counter so repeat opens re-trigger the widget.
    const open = (tab: WidgetTab) => {
      signalCount.current += 1;
      setOpenSignal({ tab, n: signalCount.current });
      setLoadWidget(true);
    };
    const onAssist = () => open("assist");
    const onChat = () => open("chat");
    const onPalette = () => {
      setOpenPalette(true);
      paletteLoaded.current = true;
      setLoadPalette(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (paletteLoaded.current) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenPalette(true);
        paletteLoaded.current = true;
        setLoadPalette(true);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpenPalette(true);
        paletteLoaded.current = true;
        setLoadPalette(true);
      }
    };
    window.addEventListener("open-assist", onAssist);
    window.addEventListener("open-ai-chat", onChat);
    window.addEventListener("open-command-palette", onPalette);
    window.addEventListener("keydown", onKey);

    const idle = window.setTimeout(() => {
      setLoadWidget(true);
      setLoadOffer(true);
    }, 3000);

    return () => {
      window.clearTimeout(idle);
      window.removeEventListener("open-assist", onAssist);
      window.removeEventListener("open-ai-chat", onChat);
      window.removeEventListener("open-command-palette", onPalette);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      {loadWidget && <AskPlseWidget openSignal={openSignal} />}
      {loadOffer && <BestOfferPopup />}
      {loadPalette && <CommandPalette openOnMount={openPalette} />}
    </>
  );
}
