'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { playClickSound, playTabSound, playHaptic } from '../lib/feedback';

interface FeedbackContextType {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: "light" | "dark";
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  triggerFeedback: (type: 'click' | 'tab') => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  // Use state with default values, and load from localStorage in useEffect to avoid SSR mismatch
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [theme, setThemeState] = useState<"light" | "dark">("dark");
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
        const storedTheme = localStorage.getItem('theme_preference');

        if (storedSound !== null) {
          setSoundEnabledState(storedSound === 'true');
        }
        if (storedHaptics !== null) {
          setHapticsEnabledState(storedHaptics === 'true');
        }
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(storedTheme);
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setThemeState(systemTheme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(systemTheme);
        }
      } catch (e) {
        console.warn('Could not read feedback settings from localStorage', e);
      }
      setIsLoaded(true);
    }
  }, []);

  // Listen to browser/system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme_preference');
      // Only update if the user has not explicitly set a manual preference
      if (!storedTheme) {
        const systemTheme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
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

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme_preference', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const triggerFeedback = (type: 'click' | 'tab') => {
    try {
      if (soundEnabled) {
        if (type === 'click') playClickSound();
        else playTabSound();
      }
      if (hapticsEnabled) {
        playHaptic(type);
      }
    } catch (e) {
      console.warn('Feedback trigger failed:', e);
    }
  };

  // 1. Auto-trigger feedback on route change (e.g., tab changes via page navigation)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    triggerFeedback('tab');
  }, [pathname]);

  // 2. Global event listener to automatically intercept clicks on buttons, links, and tabs
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      try {
        let target = e.target as HTMLElement | null;
        let shouldFeedback = false;
        let feedbackType: 'click' | 'tab' = 'click';

        // Traverse up the DOM to find interactive components
        while (target && target !== document.body) {
          const tagName = target.tagName;
          const role = target.getAttribute('role');
          const hasFeedbackAttr = target.hasAttribute('data-feedback');
          const feedbackValue = target.getAttribute('data-feedback');

          // Check if element is interactive
          if (
            tagName === 'BUTTON' ||
            tagName === 'A' ||
            role === 'button' ||
            role === 'tab' ||
            hasFeedbackAttr
          ) {
            // Skip if disabled
            if (
              target.hasAttribute('disabled') ||
              target.getAttribute('aria-disabled') === 'true' ||
              target.classList.contains('pointer-events-none')
            ) {
              break;
            }

            shouldFeedback = true;

            // If the element has specific tab traits, play a tab sound instead of a standard click
            if (
              role === 'tab' ||
              feedbackValue === 'tab' ||
              target.classList.contains('tab-item') ||
              // Check for common tab button styling or text
              (tagName === 'BUTTON' && typeof target.className === 'string' && target.className.includes('tab'))
            ) {
              feedbackType = 'tab';
            }
            break;
          }

          target = target.parentElement;
        }

        if (shouldFeedback) {
          // Trigger both audio and haptic vibration if enabled
          if (soundEnabled) {
            if (feedbackType === 'click') playClickSound();
            else playTabSound();
          }
          if (hapticsEnabled) {
            playHaptic(feedbackType);
          }
        }
      } catch (err) {
        console.warn('Error in global feedback click handler:', err);
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [soundEnabled, hapticsEnabled]);

  return (
    <FeedbackContext.Provider
      value={{
        soundEnabled,
        hapticsEnabled,
        theme,
        setSoundEnabled,
        setHapticsEnabled,
        setTheme,
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
