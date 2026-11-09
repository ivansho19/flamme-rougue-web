import { hasFlag } from 'country-flag-icons';

/** Normalize API country values to ISO 3166-1 alpha-2. */
export function normalizeCountryCode(code: unknown): string {
  return String(code ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Public asset URL for a country flag SVG, or null when unsupported/missing.
 * Flags are copied from `country-flag-icons/3x2` into `/assets/flags`.
 */
export function getCountryFlagAssetUrl(code: unknown): string | null {
  const normalized = normalizeCountryCode(code);
  if (!/^[A-Z]{2}$/.test(normalized) || !hasFlag(normalized)) {
    return null;
  }
  return `assets/flags/${normalized}.svg`;
}
