// Simple Audio Context wrapper for sound effects
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playTone = (type: 'correct' | 'wrong' | 'click' | 'win') => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'win') {
      // Simple arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
         const osc2 = ctx.createOscillator();
         const gain2 = ctx.createGain();
         osc2.connect(gain2);
         gain2.connect(ctx.destination);
         osc2.type = 'square';
         osc2.frequency.value = freq;
         gain2.gain.setValueAtTime(0.05, now + i*0.1);
         gain2.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.2);
         osc2.start(now + i*0.1);
         osc2.stop(now + i*0.1 + 0.2);
      });
    }
  } catch (e) {
    console.warn("Audio play failed", e);
  }
};

export const speak = (text: string, pitch: number = 1, rate: number = 1, force: boolean = true) => {
  if (!window.speechSynthesis) return;
  
  if (force) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};