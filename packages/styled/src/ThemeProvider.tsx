/**
 * ThemeProvider + useTheme hook.
 *
 * Standard React Context pattern.  We use a single context with no
 * selector optimisation at this layer — if you need fine-grained
 * re-renders, wrap ThemeProvider with your own memoised sub-contexts.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import type { BaseTheme } from './internal-core';

const DEFAULT_THEME: BaseTheme = Object.freeze({ __id: 'default' });
const ThemeContext = createContext<BaseTheme>(DEFAULT_THEME);

ThemeContext.displayName = 'RnStyledThemeContext';

export interface ThemeProviderProps<T extends BaseTheme> {
  theme: T;
  children: ReactNode;
}

export function ThemeProvider<T extends BaseTheme>({
  theme,
  children,
}: ThemeProviderProps<T>): React.JSX.Element {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the current theme. Throws if called outside ThemeProvider.
 *
 * Generic parameter lets callers cast to their own theme type:
 *   const theme = useTheme<typeof myTheme>();
 */
export function useTheme<T extends BaseTheme = BaseTheme>(): T {
  const ctx = useContext(ThemeContext);
  if (ctx === DEFAULT_THEME) {
    throw new Error(
      `[rn-styled] useTheme() called outside of <ThemeProvider>. ` +
        `Wrap your component tree with <ThemeProvider theme={…}>.`,
    );
  }
  return ctx as T;
}

export function useThemeOrDefault<T extends BaseTheme = BaseTheme>(): T {
  return useContext(ThemeContext) as T;
}
