import { Capacitor } from '@capacitor/core'

/**
 * Keep iOS status bar behavior deterministic across all routes/components.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return
  }
  // Status bar behavior is configured statically in capacitor.config.ts.
  // Some simulator/runtime combos report plugin methods as UNIMPLEMENTED.
}
