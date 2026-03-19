/**
 * Prop filtering utilities.
 *
 * Variant props (tone, size, …) must NOT be forwarded to the underlying
 * React Native component, which would result in a "unknown prop" warning.
 *
 * We build a Set of variant keys from the ParsedTemplate and use it to
 * strip those keys from the props object before forwarding.
 *
 * Internal props added by rn-styled (_variantProps, etc.) are also stripped.
 */

/** Keys that rn-styled injects internally and must never reach the native layer. */
const INTERNAL_PROP_KEYS = new Set(['_rnStyled', '__themeId']);

/**
 * Filter out variant prop keys and internal props from a props object.
 * Returns a new object (shallow copy) without the filtered keys.
 *
 * We use a tight loop instead of reduce/Object.fromEntries to minimise
 * per-render allocations.
 */
export function filterProps<P extends Record<string, unknown>>(
  props: P,
  variantKeys: ReadonlySet<string>,
): Omit<P, string> {
  const out: Record<string, unknown> = {};
  for (const key in props) {
    if (variantKeys.has(key)) continue;
    if (INTERNAL_PROP_KEYS.has(key)) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    out[key] = (props as any)[key];
  }
  return out as Omit<P, string>;
}

/**
 * Build a record of variant prop values from the full props object,
 * using only the keys declared in variantKeys.
 */
export function extractVariantProps(
  props: Record<string, unknown>,
  variantKeys: ReadonlySet<string>,
  defaultVariants: Record<string, string> = {},
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of variantKeys) {
    const value = props[key];
    out[key] = value !== undefined ? String(value) : defaultVariants[key];
  }
  return out;
}
