'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('AudioContext creation failed or blocked:', e);
      return null;
    }
  }
  return audioCtx;
}

/**
 * Synthesizes a crisp, short click/tick sound using Web Audio API.
 * This guarantees zero latency, works instantly on interaction, and requires no assets.
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sine wave is clean and minimalist
    osc.type = 'sine';
    
    const now = ctx.currentTime;
    
    // Quick organic pitch slide from 1200Hz to 350Hz
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);

    // Fast decay envelope (35ms duration)
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (error) {
    console.warn('Failed to play click sound:', error);
  }
}

/**
 * Synthesizes a warmer, ascending tab-switch sound using Web Audio API.
 */
export function playTabSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Triangle wave gives a softer, warmer, premium tone
    osc.type = 'triangle';
    
    const now = ctx.currentTime;
    
    // Soft ascending pitch slide from 500Hz to 800Hz
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

    // Smooth envelope decay (70ms duration)
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (error) {
    console.warn('Failed to play tab sound:', error);
  }
}

/**
 * Triggers standard browser vibration if available.
 */
export function playHaptic(type: 'click' | 'tab') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    if (type === 'click') {
      // Very short 10ms tap
      navigator.vibrate(10);
    } else if (type === 'tab') {
      // 15ms tap, 25ms pause, 15ms tap (double tap feeling)
      navigator.vibrate([15, 25, 15]);
    }
  } catch (error) {
    console.warn('Failed to trigger vibration:', error);
  }
}
