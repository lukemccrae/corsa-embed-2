import { domainConfig } from "../context/DomainContext";

/**
 * Resolve a CDN image key to a full URL.
 * If the key is already an absolute URL, return it as-is.
 */
export function resolveImageUrl(key?: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  const base = domainConfig.cdnBase;
  return base ? `${base}/${key}` : key;
}

/** Generate an avatar placeholder with initials */
export function initialsAvatar(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : displayName.slice(0, 2);
  return initials.toUpperCase();
}
