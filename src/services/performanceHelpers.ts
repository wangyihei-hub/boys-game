export function throttle<T extends (...args: unknown[]) => void>(fn: T, limitMs: number): T {
  let last = 0;
  return function (...args: unknown[]) {
    const now = Date.now();
    if (now - last >= limitMs) {
      last = now;
      fn(...args);
    }
  } as T;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, waitMs: number): T {
  let timer: number | null = null;
  return function (...args: unknown[]) {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
    }, waitMs);
  } as T;
}

export function scheduleIdle<T>(fn: () => T): Promise<T> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(fn()));
    } else {
      setTimeout(() => resolve(fn()), 1);
    }
  });
}

export function rafThrottle<T extends (...args: unknown[]) => void>(fn: T): T {
  let rafId: number | null = null;
  return function (...args: unknown[]) {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      fn(...args);
    });
  } as T;
}
