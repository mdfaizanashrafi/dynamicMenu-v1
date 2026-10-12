/**
 * Google Maps integration — the only externally-specified integration
 * (ARCHITECTURE.md review flow, PHASES.md §9/§13: redirect the customer to
 * the restaurant's Google Maps review destination; never claim a review was
 * posted). Core review logic talks to this module only, so the provider can
 * be swapped or extended without touching the order/review domain
 * (ARCHITECTURE.md §46 constraint 11).
 */

/** Hosts we will redirect customers to. Anything else is rejected. */
const ALLOWED_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.co.in",
];

/**
 * Validate a restaurant-configured Google Maps URL. Only Google-owned hosts
 * are accepted so a stored profile value can never become an open redirect.
 * Returns the normalized URL, or null when unset/invalid.
 */
export function normalizeGoogleMapsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * The customer-facing review redirect target. Redirect-only by design:
 * DynamicMenu cannot verify a review was actually posted, so callers may
 * only ever record that the redirect happened (see reviews.service).
 */
export function reviewRedirectUrl(googleMapsUrl: string | null | undefined): string | null {
  return normalizeGoogleMapsUrl(googleMapsUrl);
}
