/**
 * Compatibility layer: auto-detect whether to use server API or local IndexedDB.
 *
 * In V2.0 architecture, the server API is the primary data store.
 * The old IndexedDB path is kept for:
 * 1. Migration source (reading old data)
 * 2. Test environment (fake-indexeddb)
 * 3. Offline fallback
 */

// Detect if we're in a test environment (fake-indexeddb)
const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

// Detect if server is available (not in test mode, and we're running with the proxy)
let serverChecked = false;
let serverAvailable = false;

export async function checkServerAvailable(): Promise<boolean> {
  if (isTestEnv) return false;
  if (serverChecked) return serverAvailable;

  try {
    const res = await fetch('/api/settings/default', { method: 'GET', signal: AbortSignal.timeout(2000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
  serverChecked = true;
  return serverAvailable;
}

export function useServer(): boolean {
  return !isTestEnv && serverAvailable;
}

/**
 * Mark the server as available (called after successful connection).
 */
export function markServerAvailable(): void {
  serverAvailable = true;
  serverChecked = true;
}
