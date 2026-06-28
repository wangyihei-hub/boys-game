export type SoundName = 'correct' | 'wrong' | 'win' | 'click' | 'levelup';

let audioCtx: AudioContext | null = null;
let enabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function playTone(frequency: number, type: OscillatorType, duration: number, delay = 0) {
  const ctx = getAudioContext();
  if (!ctx || !enabled) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime + delay);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration);
}

export function playSound(name: SoundName) {
  const ctx = getAudioContext();
  if (!ctx || !enabled) return;

  // Resume audio context if suspended (required after user gesture on some browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  switch (name) {
    case 'click':
      playTone(600, 'sine', 0.08);
      break;
    case 'correct':
      playTone(880, 'sine', 0.15);
      playTone(1100, 'sine', 0.2, 0.12);
      break;
    case 'wrong':
      playTone(220, 'sawtooth', 0.25);
      break;
    case 'win':
      playTone(523, 'sine', 0.15);
      playTone(659, 'sine', 0.15, 0.15);
      playTone(784, 'sine', 0.15, 0.3);
      playTone(1047, 'sine', 0.4, 0.45);
      break;
    case 'levelup':
      playTone(440, 'sine', 0.15);
      playTone(554, 'sine', 0.15, 0.15);
      playTone(659, 'sine', 0.3, 0.3);
      break;
  }
}
