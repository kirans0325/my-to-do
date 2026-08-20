import { Platform } from 'react-native';

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

// Pure JS Base64 encoder (works on both Web and React Native Native without relying on window.btoa)
const base64Encode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || ((map = '='), i % 1); output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error("'base64Encode' failed: The string contains characters outside Latin1 range.");
    }
    block = (block << 8) | charCode;
  }
  return output;
};

// Helper: Generate a valid 16-bit Mono PCM WAV base64 Data URI
const generateWavDataUri = (
  sampleRate: number,
  durationSec: number,
  generator: (t: number) => number
): string => {
  try {
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true);

    // Write PCM audio samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.max(-1, Math.min(1, generator(t)));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    // Convert buffer to binary string
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Safely encode to base64
    const b64 = typeof btoa === 'function' ? btoa(binary) : base64Encode(binary);
    return 'data:audio/wav;base64,' + b64;
  } catch (e) {
    return '';
  }
};

const SAMPLE_RATE = 22050;
const WAV_CACHE: Partial<Record<NotificationSoundType, string>> = {};

const getWavForPreset = (type: NotificationSoundType): string => {
  if (WAV_CACHE[type]) return WAV_CACHE[type]!;

  let uri = '';
  switch (type) {
    case 'bell':
      uri = generateWavDataUri(SAMPLE_RATE, 1.2, (t) => {
        const env = Math.exp(-3.5 * t);
        return (
          env *
          (0.5 * Math.sin(2 * Math.PI * 523.25 * t) +
            0.3 * Math.sin(2 * Math.PI * 1046.5 * t) +
            0.2 * Math.sin(2 * Math.PI * 1567.98 * t))
        );
      });
      break;

    case 'digital':
      uri = generateWavDataUri(SAMPLE_RATE, 0.8, (t) => {
        const pulse = Math.floor(t * 8) % 2 === 0 ? 1 : 0;
        const freq = t < 0.4 ? 880 : 1174.66;
        return pulse * 0.4 * Math.sin(2 * Math.PI * freq * t);
      });
      break;

    case 'crystal':
      uri = generateWavDataUri(SAMPLE_RATE, 1.5, (t) => {
        const env = Math.exp(-2.0 * t);
        return env * 0.6 * Math.sin(2 * Math.PI * 528.0 * t);
      });
      break;

    case 'fanfare':
      uri = generateWavDataUri(SAMPLE_RATE, 1.2, (t) => {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        const step = Math.min(3, Math.floor(t / 0.15));
        const freq = notes[step];
        const subT = t - step * 0.15;
        const env = Math.exp(-4.0 * subT);
        return env * 0.5 * Math.sin(2 * Math.PI * freq * t);
      });
      break;

    case 'pulse':
      uri = generateWavDataUri(SAMPLE_RATE, 0.4, (t) => {
        const freq = 400 + t * 2000;
        const env = Math.exp(-6.0 * t);
        return env * 0.5 * Math.sin(2 * Math.PI * freq * t);
      });
      break;
  }

  WAV_CACHE[type] = uri;
  return uri;
};

// Web Audio API context safe initializer
let audioCtx: any = null;

const getUnlockedAudioContext = (): any => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }
  } catch (e) {}
  return audioCtx;
};

// Only attach browser window event listeners if running on Web platform
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  try {
    const unlock = () => {
      getUnlockedAudioContext();
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('touchend', unlock);
        window.removeEventListener('click', unlock);
      }
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  } catch (e) {}
}

export const playNotificationSound = (type: NotificationSoundType = 'bell'): void => {
  try {
    // Only attempt web audio if running in browser/web environment
    if (Platform.OS === 'web') {
      const wavUri = getWavForPreset(type);
      if (wavUri && typeof Audio !== 'undefined') {
        try {
          const audio = new Audio(wavUri);
          audio.volume = 1.0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              playViaWebAudio(type);
            });
          }
          return;
        } catch (e) {
          playViaWebAudio(type);
          return;
        }
      }
      playViaWebAudio(type);
    }
  } catch (err) {
    // Graceful silent fallback without crashing app
  }
};

const playViaWebAudio = (type: NotificationSoundType): void => {
  try {
    const ctx = getUnlockedAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case 'bell': {
        [523.25, 1046.5, 1567.98].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.35 / (i + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + i * 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.5 + i * 0.3);
        });
        break;
      }
      case 'digital': {
        [0, 0.15, 0.3, 0.45].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 1174.66, now + offset);
          gain.gain.setValueAtTime(0.3, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.11);
        });
        break;
      }
      case 'crystal': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.1);
        break;
      }
      case 'fanfare': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.42);
        });
        break;
      }
      case 'pulse': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
    }
  } catch (err) {
    // Graceful fallback
  }
};

export const playTaskCompleteSound = () => playNotificationSound('fanfare');
export const playAlertChime = () => playNotificationSound('digital');
export const playSnoozeSound = () => playNotificationSound('crystal');
