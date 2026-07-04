'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { playClickSound, playTabSound, playHaptic } from '../lib/feedback';

interface FeedbackContextType {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  triggerFeedback: (type: 'click' | 'tab') => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  // Use state with default values, and load from localStorage in useEffect to avoid SSR mismatch
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setIsMobile(window.innerWidth < 768);
        const storedSound = localStorage.getItem('feedback_sound_enabled');
        const storedHaptics = localStorage.getItem('feedback_haptics_enabled');

        if (storedSound !== null) {
          setSoundEnabledState(storedSound === 'true');
        }
        if (storedHaptics !== null) {
          setHapticsEnabledState(storedHaptics === 'true');
        }
      } catch (e) {
        console.warn('Could not read feedback settings from localStorage', e);
      }
      setIsLoaded(true);
    }
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('feedback_sound_enabled', String(enabled));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const setHapticsEnabled = (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('feedback_haptics_enabled', String(enabled));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const triggerFeedback = (type: 'click' | 'tab') => {
    // Audio and haptics feedback disabled globally across all devices
  };

  // 1. Auto-trigger feedback on route change
  useEffect(() => {
    // Route feedback disabled globally
  }, [pathname]);

  // 2. Global event listener
  useEffect(() => {
    // Global click listener disabled globally
  }, []);

  return (
    <FeedbackContext.Provider
      value={{
        soundEnabled,
        hapticsEnabled,
        setSoundEnabled,
        setHapticsEnabled,
        triggerFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
