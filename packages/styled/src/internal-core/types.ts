/**
 * Core type definitions for rn-styled.
 *
 * Architecture note: we separate the "authoring" helpers (TokenRef, VariantSlot)
 * from the "resolved" runtime shapes (ASTNode, ResolvedStyle) to keep the parser
 * and engine boundaries clear.
 */

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/** Minimum shape every theme must satisfy at runtime. */
export interface BaseTheme {
  /** Stable identifier used as part of cache keys. Warn if missing. */
  __id?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Token helpers (t())
// ---------------------------------------------------------------------------

export const TOKEN_REF_BRAND = '__rnStyled_TokenRef__' as const;

/** Opaque reference produced by t('colors.primary'). */
export interface TokenRef {
  readonly _brand: typeof TOKEN_REF_BRAND;
  readonly path: string;
}

// ---------------------------------------------------------------------------
// Variant helpers (v())
// ---------------------------------------------------------------------------

export const VARIANT_SLOT_BRAND = '__rnStyled_VariantSlot__' as const;

/**
 * Each entry in the variant mapping can be:
 *  - a token path string  ('colors.primary', 'space.3')
 *  - a raw literal        ('transparent', 12, '#fff', ...)
 *  - a theme function     (theme) => value
 */
export type VariantMappingValue<T extends BaseTheme> =
  | string
  | number
  | ((theme: T) => string | number);

export type VariantMapping<T extends BaseTheme> = Record<string, VariantMappingValue<T>>;

/** Opaque slot produced by v('tone', { primary: 'colors.primary', ... }). */
export interface VariantSlot<
  K extends string = string,
  M extends VariantMapping<BaseTheme> = VariantMapping<BaseTheme>,
> {
  readonly _brand: typeof VARIANT_SLOT_BRAND;
  readonly variantKey: K;
  readonly mapping: M;
}

// ---------------------------------------------------------------------------
// AST nodes
// ---------------------------------------------------------------------------

/** A static CSS declaration whose value is already a primitive. */
export interface StaticDecl {
  readonly kind: 'static';
  readonly propKey: string; // camelCase RN property name
  readonly value: string | number;
}

/**
 * A dynamic declaration whose value depends on a token or variant slot.
 * Resolved at style-compute time, NOT at parse time.
 */
export interface DynamicDecl {
  readonly kind: 'dynamic';
  readonly propKey: string;
  readonly slot: TokenRef | VariantSlot;
}

export type ASTNode = StaticDecl | DynamicDecl;

// ---------------------------------------------------------------------------
// Compiled dynamic nodes
// ---------------------------------------------------------------------------

export interface CompiledTokenDynamicDecl {
  readonly kind: 'token';
  readonly propKey: string;
  readonly path: string;
  readonly pathSegments: readonly string[];
}

export interface CompiledVariantLiteralValue {
  readonly kind: 'literal';
  readonly value: string | number;
}

export interface CompiledVariantTokenValue {
  readonly kind: 'token';
  readonly path: string;
  readonly pathSegments: readonly string[];
}

export interface CompiledVariantResolverValue {
  readonly kind: 'theme-fn';
  readonly resolver: (theme: unknown) => string | number;
}

export type CompiledVariantValue =
  | CompiledVariantLiteralValue
  | CompiledVariantTokenValue
  | CompiledVariantResolverValue;

export interface CompiledVariantDynamicDecl {
  readonly kind: 'variant';
  readonly propKey: string;
  readonly variantKey: string;
  readonly mapping: Readonly<Record<string, CompiledVariantValue>>;
}

export type CompiledDynamicNode = CompiledTokenDynamicDecl | CompiledVariantDynamicDecl;

// ---------------------------------------------------------------------------
// Resolved styles
// ---------------------------------------------------------------------------

/** Flat style object compatible with React Native's StyleSheet.create. */
export type RNStyleObject = Record<string, string | number | undefined>;

// ---------------------------------------------------------------------------
// Parsed template result
// ---------------------------------------------------------------------------

export interface ParsedTemplate {
  /** Ordered list of AST nodes extracted from the template. */
  readonly nodes: readonly ASTNode[];
  /** Static declarations extracted once during template parsing. */
  readonly staticNodes: readonly StaticDecl[];
  /** Dynamic declarations that must be resolved at render time. */
  readonly dynamicNodes: readonly DynamicDecl[];
  /** Runtime-optimized metadata for dynamic declarations. */
  readonly compiledDynamicNodes: readonly CompiledDynamicNode[];
  /** Precomputed static style object for the template. */
  readonly staticStyle: RNStyleObject;
  /** Whether the template contains any dynamic declarations. */
  readonly hasDynamic: boolean;
  /** All variant slot keys referenced in this template, e.g. ['tone', 'size']. */
  readonly variantKeys: readonly string[];
}

// ---------------------------------------------------------------------------
// Interpolation value (what goes between template string segments)
// ---------------------------------------------------------------------------

export type Interpolation = TokenRef | VariantSlot | string | number;
