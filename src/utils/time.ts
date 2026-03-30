/**
 * Parses a date value (ISO string, numeric epoch string, or Date) into
 * milliseconds since epoch. Returns null for missing or invalid input.
 */
export function parseDateTime(
  value: string | Date | null | undefined,
): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return isNaN(ms) ? null : ms;
  }
  // Try ISO / human-readable string first
  const fromStr = new Date(value).getTime();
  if (!isNaN(fromStr)) return fromStr;
  // Fallback: numeric epoch string (e.g. "1704067200000")
  const fromNum = Number(value);
  if (!isNaN(fromNum)) return fromNum;
  return null;
}

export function toDDHHMMSS(secs: number) {
  const isNegative = secs < 0;
  const absoluteSecs = Math.abs(Math.round(secs));

  const days = Math.floor(absoluteSecs / 86400);
  const hours = Math.floor((absoluteSecs % 86400) / 3600);
  const minutes = Math.floor((absoluteSecs % 3600) / 60);
  const seconds = absoluteSecs % 60;

  const formattedDays = days.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  const timeString = `${formattedDays}d ${formattedHours}h ${formattedMinutes}m ${formattedSeconds}s`;

  return isNegative ? `- ${timeString}` : timeString;
}


export function toDDHHMM(secs: number) {
  const isNegative = secs < 0;
  const absoluteSecs = Math.abs(Math.round(secs));

  const days = Math.floor(absoluteSecs / 86400);
  const hours = Math.floor((absoluteSecs % 86400) / 3600);
  const minutes = Math.floor((absoluteSecs % 3600) / 60);

  const formattedDays = days.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");

  const timeString = `${formattedDays}d ${formattedHours}h ${formattedMinutes}m`;

  return isNegative ? `- ${timeString}` : timeString;
}
