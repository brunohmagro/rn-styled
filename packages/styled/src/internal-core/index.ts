/**
 * Internalized core runtime used by @rn-styled/styled.
 */

// Types
export type {
  BaseTheme,
  TokenRef,
  VariantSlot,
  VariantMapping,
  VariantMappingValue,
  ASTNode,
  StaticDecl,
  DynamicDecl,
  ParsedTemplate,
  RNStyleObject,
  Interpolation,
} from './types';

export { TOKEN_REF_BRAND, VARIANT_SLOT_BRAND } from './types';

// AST / Parser
export { parseTemplate, isTokenRef, isVariantSlot } from './ast';

// Cache
export { LRUCache } from './cache';

// Tokens
export { resolveToken, resolveTokenSegments, getTokenPathSegments, isTokenPath } from './tokens';

// Platform
export { kebabToRN, parseCSSValue, KEBAB_TO_RN } from './platform';

// Shorthands
export { expandPadding, expandMargin, expandBorderRadius, tryExpandShorthand } from './shorthands';

// Engine
export {
  getBaseStyle,
  getVariantStyle,
  buildVariantCacheKey,
  getCachedComposedStyle,
  resolveStyles,
} from './engine';
export type { ResolvedStyles } from './engine';

// Prop filtering
export { createPropSplitter, splitProps, filterProps, extractVariantProps } from './propFilter';
