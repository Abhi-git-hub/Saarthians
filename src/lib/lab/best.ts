// Local-only best-score memory. Device entertainment state, never an
// official record; every function degrades silently without storage.

export function readBest(game: string): number | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`saarthians-lab-best:${game}`);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeBest(game: string, value: number): number | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const previous = readBest(game);
    if (previous === null || value > previous) {
      window.localStorage.setItem(`saarthians-lab-best:${game}`, String(value));
      return value;
    }
    return previous;
  } catch {
    return null;
  }
}

export function readPlayedCount(): number {
  try {
    if (typeof window === "undefined" || !window.localStorage) return 0;
    return Number(window.localStorage.getItem("saarthians-lab-plays") ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function countPlay(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem("saarthians-lab-plays", String(readPlayedCount() + 1));
  } catch {
    // Ignore.
  }
}
