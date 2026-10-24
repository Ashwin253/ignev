"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

// Hook that any input can use for per-field voice
export function useVoiceDictation() {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);

  const startForField = useCallback((fieldId: string, onText: (text: string) => void) => {
    // Stop any existing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (activeFieldId === fieldId) {
      // Toggle off
      setActiveFieldId(null);
      return;
    }

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported. Use Chrome.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.trim();
      callbackRef.current?.(text);
    };

    recognition.onend = () => setActiveFieldId(null);
    recognition.onerror = () => setActiveFieldId(null);

    callbackRef.current = onText;
    recognition.start();
    recognitionRef.current = recognition;
    setActiveFieldId(fieldId);
  }, [activeFieldId]);

  return { activeFieldId, startForField };
}

// Mic button component for inside inputs
export function MicButton({ fieldId, isActive, onTap }: { fieldId: string; isActive: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onTap(); }}
      className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-full transition-all ${
        isActive ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-ink-mute hover:bg-emerald-100 hover:text-emerald-600"
      }`}
      title={isActive ? "Stop" : "Speak"}
    >
      {isActive ? <MicOff size={11} /> : <Mic size={11} />}
    </button>
  );
}
