import type { DistractionMatch, SiteListMap } from "./types";

/**
 * Extracts the hostname from a URL string, stripping protocol and www. prefix.
 * Returns null for invalid URLs.
 */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Checks whether a domain matches any distraction site list, including subdomain matching.
 * e.g., "m.facebook.com" matches "facebook.com"
 * Returns { category, domain } or null.
 */
export function isDistractionSite(
  domain: string,
  siteListMap: SiteListMap
): DistractionMatch | null {
  for (const [category, domains] of Object.entries(siteListMap)) {
    if (domains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
      return { category: category as DistractionMatch["category"], domain };
    }
  }
  return null;
}

/**
 * Validates a domain string for use in site lists.
 * Rejects empty strings, strings with spaces, strings without a TLD (no dot),
 * and special-character-only strings.
 */
export function validateDomain(input: string): boolean {
  if (!input || input.trim().length === 0) return false;
  if (/\s/.test(input)) return false;
  if (!input.includes(".")) return false;
  if (!/[a-zA-Z0-9]/.test(input)) return false;
  return true;
}
