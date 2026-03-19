/**
 * createTheme — preserves literal types and ensures __id is present.
 *
 * Usage:
 *   const theme = createTheme({
 *     __id: 'light-v1',
 *     colors: { primary: '#6200EE', surface: '#FFFFFF' },
 *     space: { 1: 4, 2: 8, 3: 12, 4: 16 },
 *   });
 *
 * The generic `<const T>` constraint preserves string/number literal types,
 * enabling autocomplete for token paths throughout the library.
 */

import type { BaseTheme } from '@rn-styled/core';

export type Theme<T extends BaseTheme> = T;

/**
 * Creates a typed theme object.
 * Use `as const` in the argument (or the generic `<const T>` parameter) to
 * preserve literal types for full token-path autocomplete.
 */
export function createTheme<const T extends BaseTheme>(theme: T): T {
  if (__DEV__ && !theme.__id) {
    console.warn(
      `[rn-styled] createTheme: theme is missing "__id". ` +
        `Add a unique string __id to enable stable variant-style caching when ` +
        `switching themes at runtime.`,
    );
  }
  return theme;
}

// Ambient declaration for __DEV__
declare const __DEV__: boolean;
