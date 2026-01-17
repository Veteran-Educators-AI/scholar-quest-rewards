import { useCallback, useRef } from "react";

export function useQuizSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    return ctx;
  }, []);

  const playCorrectSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Bright, cheerful ascending notes (success chime)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.12 },    // C5
        { freq: 659.25, time: 0.08, duration: 0.12 }, // E5
        { freq: 783.99, time: 0.16, duration: 0.2 },  // G5
      ];

      notes.forEach(({ freq, time, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        
        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + duration);
      });

      // Add a shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.2);
      shimmer.type = 'sine';
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
      shimmerGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.22);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      shimmer.start(ctx.currentTime + 0.2);
      shimmer.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.log('Correct sound not available:', error);
    }
  }, [getAudioContext]);

  const playIncorrectSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Descending minor notes (soft buzzer)
      const notes = [
        { freq: 349.23, time: 0, duration: 0.15 },    // F4
        { freq: 311.13, time: 0.1, duration: 0.2 },   // Eb4
      ];

      notes.forEach(({ freq, time, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        
        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + duration);
      });
    } catch (error) {
      console.log('Incorrect sound not available:', error);
    }
  }, [getAudioContext]);

  const playStreakSound = useCallback((streakCount: number) => {
    try {
      const ctx = getAudioContext();
      
      // Higher pitched, more exciting as streak increases
      const baseFreq = 523.25 + (streakCount * 50); // Gets higher with streak
      const notes = [
        { freq: baseFreq, time: 0, duration: 0.1 },
        { freq: baseFreq * 1.25, time: 0.06, duration: 0.1 },
        { freq: baseFreq * 1.5, time: 0.12, duration: 0.15 },
        { freq: baseFreq * 2, time: 0.18, duration: 0.25 },
      ];

      notes.forEach(({ freq, time, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(Math.min(freq, 2000), ctx.currentTime + time);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        
        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + duration);
      });

      // Add sparkle effects for high streaks
      if (streakCount >= 3) {
        for (let i = 0; i < Math.min(streakCount, 5); i++) {
          const sparkle = ctx.createOscillator();
          const sparkleGain = ctx.createGain();
          
          sparkle.connect(sparkleGain);
          sparkleGain.connect(ctx.destination);
          
          const sparkleTime = 0.3 + i * 0.05;
          const sparkleFreq = 1500 + Math.random() * 1500;
          
          sparkle.frequency.setValueAtTime(sparkleFreq, ctx.currentTime + sparkleTime);
          sparkle.type = 'sine';
          
          sparkleGain.gain.setValueAtTime(0, ctx.currentTime + sparkleTime);
          sparkleGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + sparkleTime + 0.01);
          sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sparkleTime + 0.1);
          
          sparkle.start(ctx.currentTime + sparkleTime);
          sparkle.stop(ctx.currentTime + sparkleTime + 0.1);
        }
      }
    } catch (error) {
      console.log('Streak sound not available:', error);
    }
  }, [getAudioContext]);

  const playCompletionSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Grand victory fanfare
      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },      // C5
        { freq: 659.25, time: 0.1, duration: 0.15 },    // E5
        { freq: 783.99, time: 0.2, duration: 0.15 },    // G5
        { freq: 1046.50, time: 0.3, duration: 0.4 },    // C6 (hold)
        { freq: 1318.51, time: 0.5, duration: 0.3 },    // E6
        { freq: 1567.98, time: 0.7, duration: 0.5 },    // G6 (finale)
      ];

      notes.forEach(({ freq, time, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
        
        oscillator.start(ctx.currentTime + time);
        oscillator.stop(ctx.currentTime + time + duration);

        // Harmonics
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        
        harmonic.connect(harmonicGain);
        harmonicGain.connect(ctx.destination);
        
        harmonic.frequency.setValueAtTime(freq * 2, ctx.currentTime + time);
        harmonic.type = 'sine';
        
        harmonicGain.gain.setValueAtTime(0, ctx.currentTime + time);
        harmonicGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + time + 0.02);
        harmonicGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration * 0.8);
        
        harmonic.start(ctx.currentTime + time);
        harmonic.stop(ctx.currentTime + time + duration);
      });

      // Sparkle finish
      for (let i = 0; i < 8; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        const sparkleTime = 1.0 + i * 0.06;
        const sparkleFreq = 2000 + Math.random() * 2000;
        
        sparkle.frequency.setValueAtTime(sparkleFreq, ctx.currentTime + sparkleTime);
        sparkle.type = 'sine';
        
        sparkleGain.gain.setValueAtTime(0, ctx.currentTime + sparkleTime);
        sparkleGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + sparkleTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sparkleTime + 0.12);
        
        sparkle.start(ctx.currentTime + sparkleTime);
        sparkle.stop(ctx.currentTime + sparkleTime + 0.12);
      }
    } catch (error) {
      console.log('Completion sound not available:', error);
    }
  }, [getAudioContext]);

  const playTimeoutSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Clock-like tick followed by low tone
      const tick = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tick.connect(tickGain);
      tickGain.connect(ctx.destination);
      tick.frequency.setValueAtTime(1000, ctx.currentTime);
      tick.type = 'square';
      tickGain.gain.setValueAtTime(0.1, ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      tick.start(ctx.currentTime);
      tick.stop(ctx.currentTime + 0.05);

      // Low warning tone
      const warning = ctx.createOscillator();
      const warningGain = ctx.createGain();
      warning.connect(warningGain);
      warningGain.connect(ctx.destination);
      warning.frequency.setValueAtTime(220, ctx.currentTime + 0.1);
      warning.type = 'triangle';
      warningGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      warningGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.12);
      warningGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      warning.start(ctx.currentTime + 0.1);
      warning.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.log('Timeout sound not available:', error);
    }
  }, [getAudioContext]);

  return { 
    playCorrectSound, 
    playIncorrectSound, 
    playStreakSound, 
    playCompletionSound,
    playTimeoutSound 
  };
}
