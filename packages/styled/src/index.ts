/**
 * @rn-styled/styled — public API
 *
 * This is the primary package users install.
 */

// Theme
export { createTheme } from './createTheme';
export type { Theme } from './createTheme';

// Provider + hook
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';

// Helpers
export { t, v } from './helpers';
export type { DeepKeyOf, InferVariantKeys, VariantValues, DefaultTheme } from './helpers';

// styled factory
export { styled, createStyledFromHost } from './styled';
export type { StyledConfig, ConfigurableTemplateFunction, StyledFactory } from './styled';

// Re-export core types that users may need
export type {
  BaseTheme,
  TokenRef,
  VariantSlot,
  VariantMapping,
  ParsedTemplate,
} from './internal-core';
