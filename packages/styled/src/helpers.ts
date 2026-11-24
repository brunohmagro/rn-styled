/**
 * Template literal helpers: t() and v().
 *
 * These helpers produce opaque reference objects (TokenRef / VariantSlot)
 * that the parser recognises and the engine resolves at style-compute time.
 *
 * TypeScript magic:
 *  - t<Theme>('colors.primary') infers a strongly-typed path via DeepKeyOf<Theme>.
 *  - v('tone', { primary: '...', ghost: '...' }) infers the union type
 *    'primary' | 'ghost' as the prop type for `tone`.
 */

import {
  TOKEN_REF_BRAND,
  VARIANT_SLOT_BRAND,
  type BaseTheme,
  type TokenRef,
  type VariantMapping,
  type VariantSlot,
} from './internal-core';

// ---------------------------------------------------------------------------
// Deep path types
// ---------------------------------------------------------------------------

/** Dot-separated paths into a nested object type (up to 4 levels deep). */
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, ...0[]];

/** All dot-separated paths for an object type, recursing up to `D` levels. */
export type DeepKeyOf<T, D extends number = 4> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | Join<K, DeepKeyOf<T[K], Prev[D]>>
          : never;
      }[keyof T]
    : '';

// ---------------------------------------------------------------------------
// t() — token reference
// ---------------------------------------------------------------------------

/**
 * DefaultTheme — extensível via module augmentation.
 *
 * Apps podem declarar:
 *   declare module '@rn-styled/styled' {
 *     interface DefaultTheme extends AppTheme {}
 *   }
 *
 * Para que t() e v() usem o tema da app como padrão de tipo.
 */
export interface DefaultTheme extends BaseTheme {}

/**
 * Creates a typed token reference for use inside styled template literals.
 *
 * @example
 * const Title = styled.Text`
 *   color: ${t<typeof theme>('colors.primary')};
 * `;
 */
export function t<T extends BaseTheme = DefaultTheme>(
  path: DeepKeyOf<T> extends string ? DeepKeyOf<T> : string,
): TokenRef {
  return { _brand: TOKEN_REF_BRAND, path: path as string };
}

// ---------------------------------------------------------------------------
// v() — variant slot
// ---------------------------------------------------------------------------

/**
 * Infer the keys of the variant mapping as a union type.
 * Used to generate typed props on the styled component.
 */
export type InferVariantKeys<M extends Record<string, unknown>> = keyof M & string;

/**
 * Creates a variant slot for use inside styled template literals.
 *
 * @example
 * const Button = styled.Pressable`
 *   background-color: ${v('tone', {
 *     primary: 'colors.primary',
 *     ghost: 'transparent',
 *   })};
 * `;
 * // Button now accepts: tone?: 'primary' | 'ghost'
 */
export function v<
  K extends string,
  M extends VariantMapping<DefaultTheme>,
>(variantKey: K, mapping: M): VariantSlot<K, M> {
  return { _brand: VARIANT_SLOT_BRAND, variantKey, mapping };
}

// ---------------------------------------------------------------------------
// Type utilities exposed for styled component inference
// ---------------------------------------------------------------------------

/**
 * Given a VariantSlot type, extract the union of valid values.
 * e.g. VariantSlot<'tone', { primary: ..., ghost: ... }> → 'primary' | 'ghost'
 */
export type VariantValues<S extends VariantSlot> =
  S extends VariantSlot<string, infer M> ? keyof M & string : never;
