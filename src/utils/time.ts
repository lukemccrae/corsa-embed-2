/** Format seconds → "h:mm:ss" or "m:ss" */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return "--";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Format metres → "X.XX km" */
export function formatDistance(metres?: number): string {
  if (metres === undefined || metres === null) return "--";
  return `${(metres / 1000).toFixed(2)} km`;
}

/** Format a pace in seconds/km → "m:ss /km" */
export function formatPace(secPerKm?: number): string {
  if (!secPerKm) return "--";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

/** Format an ISO timestamp to a readable local string */
export function formatTimestamp(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

/** Relative time from now (e.g. "3 min ago") */
export function relativeTime(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatTimestamp(iso);
}
