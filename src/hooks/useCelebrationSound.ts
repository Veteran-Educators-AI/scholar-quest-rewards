import { useCallback, useRef } from "react";

export function useCelebrationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCelebrationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Victory fanfare notes (C major arpeggio going up with harmonics)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },      // C5
        { freq: 659.25, time: 0.1, duration: 0.15 },    // E5
        { freq: 783.99, time: 0.2, duration: 0.15 },    // G5
        { freq: 1046.50, time: 0.3, duration: 0.4 },    // C6 (hold)
        { freq: 1318.51, time: 0.5, duration: 0.3 },    // E6
        { freq: 1567.98, time: 0.7, duration: 0.5 },    // G6 (finale)
      ];

      notes.forEach(({ freq, time, duration }) => {
        // Main tone
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);
        oscillator.type = 'sine';
        
        // Soft attack, gentle decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        
        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + duration);

        // Add shimmer harmonic (octave above, quieter)
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        
        shimmer.frequency.setValueAtTime(freq * 2, ctx.currentTime + time);
        shimmer.type = 'sine';
        
        shimmerGain.gain.setValueAtTime(0, ctx.currentTime + time);
        shimmerGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + time + 0.02);
        shimmerGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration * 0.8);
        
        shimmer.start(ctx.currentTime + time);
        shimmer.stop(ctx.currentTime + time + duration);
      });

      // Add a subtle sparkle effect at the end
      for (let i = 0; i < 5; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        const sparkleTime = 0.9 + i * 0.08;
        const sparkleFreq = 2000 + Math.random() * 2000;
        
        sparkle.frequency.setValueAtTime(sparkleFreq, ctx.currentTime + sparkleTime);
        sparkle.type = 'sine';
        
        sparkleGain.gain.setValueAtTime(0, ctx.currentTime + sparkleTime);
        sparkleGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + sparkleTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sparkleTime + 0.15);
        
        sparkle.start(ctx.currentTime + sparkleTime);
        sparkle.stop(ctx.currentTime + sparkleTime + 0.15);
      }
    } catch (error) {
      console.log('Celebration sound not available:', error);
    }
  }, []);

  const triggerCelebrationVibration = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        // Celebratory pattern: quick bursts
        navigator.vibrate([50, 30, 50, 30, 100, 50, 150]);
      }
    } catch (error) {
      console.log('Vibration not available:', error);
    }
  }, []);

  const celebrate = useCallback(() => {
    playCelebrationSound();
    triggerCelebrationVibration();
  }, [playCelebrationSound, triggerCelebrationVibration]);

  return { playCelebrationSound, triggerCelebrationVibration, celebrate };
}
