export function asString(input: unknown, fallback = ''): string {
  return typeof input === 'string' ? input : fallback;
}

export function asNumber(input: unknown, fallback = 0): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function asBool(input: unknown, fallback = false): boolean {
  return typeof input === 'boolean' ? input : fallback;
}

export function asArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : [];
}

/** Alias for asNumber -- kept for backward compatibility */
export const safeNumber = asNumber;
