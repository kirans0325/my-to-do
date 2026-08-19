export type NotificationSoundType = 'bell' | 'digital' | 'crystal' | 'fanfare' | 'pulse';

export interface SoundPreset {
  id: NotificationSoundType;
  name: string;
  emoji: string;
  description: string;
}

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'bell', name: 'Bell Chime', emoji: '🔔', description: 'Harmonic acoustic bell ring' },
  { id: 'digital', name: 'Digital Alarm', emoji: '⏰', description: 'Rhythmic double-tone alert' },
  { id: 'crystal', name: 'Zen Crystal', emoji: '✨', description: 'Calm harmonic crystal chime' },
  { id: 'fanfare', name: 'Victory Fanfare', emoji: '🎺', description: 'Uplifting celebratory arpeggio' },
  { id: 'pulse', name: 'Tech Pulse', emoji: '⚡', description: 'Futuristic swift pop' },
];

let audioCtx: any = null;

const getAudioContext = (): any => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playNotificationSound = (type: NotificationSoundType = 'bell'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'bell': {
        // Multi-tone warm bell chime (523Hz + 1046Hz + 1567Hz)
        [523.25, 1046.5, 1567.98].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.3 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + i * 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.5 + i * 0.3);
        });
        break;
      }

      case 'digital': {
        // High-low rhythmic digital alarm beep
        [0, 0.15, 0.3, 0.45].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 1174.66, now + offset);

          gain.gain.setValueAtTime(0.25, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.11);
        });
        break;
      }

      case 'crystal': {
        // Pure calming crystal bowl tone (528Hz Solfeggio Love frequency)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.1);
        break;
      }

      case 'fanfare': {
        // Uplifting celebration arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);

          gain.gain.setValueAtTime(0.25, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.42);
        });
        break;
      }

      case 'pulse': {
        // Futuristic tech pulse sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
    }
  } catch (err) {
    console.warn('Audio synthesis playback error:', err);
  }
};

export const playTaskCompleteSound = () => playNotificationSound('fanfare');
export const playAlertChime = () => playNotificationSound('digital');
