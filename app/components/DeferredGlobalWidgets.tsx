"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const AssistPopup = dynamic(() => import("./AssistPopup"), { ssr: false });
const BestOfferPopup = dynamic(() => import("./BestOfferPopup"), { ssr: false });
const AiChatPopup = dynamic(() => import("./AiChatPopup"), { ssr: false });
const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

export default function DeferredGlobalWidgets() {
  const [loadAssist, setLoadAssist] = useState(false);
  const [loadOffer, setLoadOffer] = useState(false);
  const [loadChat, setLoadChat] = useState(false);
  const [loadPalette, setLoadPalette] = useState(false);
  const [openAssist, setOpenAssist] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openPalette, setOpenPalette] = useState(false);
  const paletteLoaded = useRef(false);

  useEffect(() => {
    const onAssist = () => {
      setOpenAssist(true);
      setLoadAssist(true);
    };
    const onChat = () => {
      setOpenChat(true);
      setLoadChat(true);
    };
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
      setLoadAssist(true);
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
      {loadAssist && <AssistPopup openOnMount={openAssist} />}
      {loadOffer && <BestOfferPopup />}
      {loadChat && <AiChatPopup openOnMount={openChat} />}
      {loadPalette && <CommandPalette openOnMount={openPalette} />}
    </>
  );
}
