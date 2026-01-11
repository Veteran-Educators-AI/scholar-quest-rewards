import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create AudioContext lazily (required for mobile)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (mobile browsers require user interaction)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant notification chime
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Pleasant bell-like tone
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.2); // E6
      
      oscillator.type = 'sine';
      
      // Envelope for a soft chime
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }, []);

  const triggerVibration = useCallback(() => {
    try {
      // Check if Vibration API is supported
      if ('vibrate' in navigator) {
        // Short vibration pattern: vibrate 100ms, pause 50ms, vibrate 100ms
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.log('Vibration not available:', error);
    }
  }, []);

  const notifyUser = useCallback(() => {
    playNotificationSound();
    triggerVibration();
  }, [playNotificationSound, triggerVibration]);

  return { playNotificationSound, triggerVibration, notifyUser };
}
