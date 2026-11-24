/**
 * Token resolution utilities.
 *
 * A token path like 'colors.primary' is a dot-separated accessor
 * into the theme object. We walk the path and return the leaf value.
 */

import type { BaseTheme } from './types';

const tokenPathSegmentsCache = new Map<string, readonly string[]>();

export function getTokenPathSegments(path: string): readonly string[] {
  const cached = tokenPathSegmentsCache.get(path);
  if (cached) return cached;

  const segments = Object.freeze(path.split('.')) as readonly string[];
  tokenPathSegmentsCache.set(path, segments);
  return segments;
}

export function resolveTokenSegments(
  theme: BaseTheme,
  path: string,
  segments: readonly string[],
): string | number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = theme;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (current == null || typeof current !== 'object') {
      if (__DEV__) {
        console.warn(
          `[rn-styled] Token path "${path}" not found in theme. ` +
            `Make sure your theme contains the key path.`,
        );
      }
      return path;
    }
    current = current[seg];
  }

  if (current === undefined) {
    if (__DEV__) {
      console.warn(
        `[rn-styled] Token "${path}" resolved to undefined. ` +
          `Returning raw path as fallback.`,
      );
    }
    return path;
  }

  if (typeof current !== 'string' && typeof current !== 'number') {
    if (__DEV__) {
      console.warn(
        `[rn-styled] Token "${path}" resolved to a non-primitive value (${typeof current}). ` +
          `Only string/number values are valid style tokens.`,
      );
    }
    return String(current);
  }

  return current;
}

/**
 * Resolves a dot-separated token path against the theme.
 * Returns the value if found, or the raw path string if missing
 * (with a dev warning).
 */
export function resolveToken(theme: BaseTheme, path: string): string | number {
  return resolveTokenSegments(theme, path, getTokenPathSegments(path));
}

/**
 * Detects whether a raw string looks like a token path (e.g. "colors.primary")
 * rather than a CSS literal (e.g. "transparent", "#fff", "12px").
 *
 * Heuristic: contains a dot AND does not start with '#', 'rgb', 'rgba', 'hsl'.
 */
export function isTokenPath(value: string): boolean {
  if (!value.includes('.')) return false;
  const lower = value.toLowerCase().trimStart();
  if (lower.startsWith('#')) return false;
  if (lower.startsWith('rgb') || lower.startsWith('hsl')) return false;
  // numbers with decimals like "1.5" are not token paths
  if (/^\d/.test(lower)) return false;
  return true;
}

// Ambient declaration for __DEV__ (provided by RN bundler / vitest setup).
declare const __DEV__: boolean;
