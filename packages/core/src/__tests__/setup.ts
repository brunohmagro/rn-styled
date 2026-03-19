/**
 * Vitest setup for @rn-styled/core
 *
 * We need to mock React Native's StyleSheet since we're running in Node.
 */
import { vi } from 'vitest';

// Mock react-native
vi.mock('react-native', () => {
  let idCounter = 0;
  const registered: Record<number, Record<string, unknown>> = {};

  return {
    StyleSheet: {
      create: (styles: Record<string, Record<string, unknown>>) => {
        const out: Record<string, number> = {};
        for (const [key, style] of Object.entries(styles)) {
          const id = ++idCounter;
          registered[id] = style;
          out[key] = id;
        }
        // Return the original object for easier test assertions
        // In a real RN app, StyleSheet.create returns an object of numbers (style IDs).
        // For tests, returning the style objects directly is simpler.
        return styles;
      },
      flatten: (style: unknown) => style,
    },
  };
});
