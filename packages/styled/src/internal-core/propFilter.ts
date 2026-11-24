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
const EMPTY_VARIANT_KEYS: readonly string[] = [];
const EMPTY_VARIANT_PROPS = Object.freeze({}) as Record<string, string | undefined>;
const EMPTY_DEFAULT_VARIANTS = Object.freeze({}) as Record<string, string>;

export interface SplitPropsResult<P extends Record<string, unknown>> {
  forwardedProps: Omit<P, string>;
  variantProps: Record<string, string | undefined>;
}

export type PropSplitter<P extends Record<string, unknown>> = (props: P) => SplitPropsResult<P>;

function splitWithoutVariants<P extends Record<string, unknown>>(props: P): SplitPropsResult<P> {
  for (const key in props) {
    if (INTERNAL_PROP_KEYS.has(key)) {
      const forwardedProps: Record<string, unknown> = {};
      for (const forwardedKey in props) {
        if (INTERNAL_PROP_KEYS.has(forwardedKey)) continue;
        forwardedProps[forwardedKey] = props[forwardedKey];
      }
      return {
        forwardedProps: forwardedProps as Omit<P, string>,
        variantProps: EMPTY_VARIANT_PROPS,
      };
    }
  }

  return {
    forwardedProps: props as Omit<P, string>,
    variantProps: EMPTY_VARIANT_PROPS,
  };
}

function buildVariantProps(
  entries: Array<[string, string | undefined]>,
): Record<string, string | undefined> {
  let hasValues = false;
  const variantProps: Record<string, string | undefined> = {};

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (value === undefined) continue;
    variantProps[key] = value;
    hasValues = true;
  }

  return hasValues ? variantProps : EMPTY_VARIANT_PROPS;
}

export function createPropSplitter<P extends Record<string, unknown>>(
  variantKeys: readonly string[] = EMPTY_VARIANT_KEYS,
  defaultVariants: Record<string, string> = EMPTY_DEFAULT_VARIANTS,
): PropSplitter<P> {
  switch (variantKeys.length) {
    case 0:
      return splitWithoutVariants;
    case 1: {
      const key0 = variantKeys[0];
      const default0 = defaultVariants[key0];

      return (props: P): SplitPropsResult<P> => {
        const forwardedProps: Record<string, unknown> = {};
        let value0 = default0;

        for (const key in props) {
          if (key === key0) {
            const propValue = props[key];
            value0 = propValue !== undefined ? String(propValue) : default0;
            continue;
          }

          if (INTERNAL_PROP_KEYS.has(key)) continue;
          forwardedProps[key] = props[key];
        }

        return {
          forwardedProps: forwardedProps as Omit<P, string>,
          variantProps: buildVariantProps([[key0, value0]]),
        };
      };
    }
    case 2: {
      const key0 = variantKeys[0];
      const key1 = variantKeys[1];
      const default0 = defaultVariants[key0];
      const default1 = defaultVariants[key1];

      return (props: P): SplitPropsResult<P> => {
        const forwardedProps: Record<string, unknown> = {};
        let value0 = default0;
        let value1 = default1;

        for (const key in props) {
          if (key === key0) {
            const propValue = props[key];
            value0 = propValue !== undefined ? String(propValue) : default0;
            continue;
          }

          if (key === key1) {
            const propValue = props[key];
            value1 = propValue !== undefined ? String(propValue) : default1;
            continue;
          }

          if (INTERNAL_PROP_KEYS.has(key)) continue;
          forwardedProps[key] = props[key];
        }

        return {
          forwardedProps: forwardedProps as Omit<P, string>,
          variantProps: buildVariantProps([
            [key0, value0],
            [key1, value1],
          ]),
        };
      };
    }
    default: {
      const variantKeySet = new Set(variantKeys);
      return (props: P) => splitProps(props, variantKeys, variantKeySet, defaultVariants);
    }
  }
}

/**
 * Single-pass prop splitter for the render hot path.
 *
 * It extracts variant props while simultaneously building the forwarded prop
 * object, avoiding two full passes over props on every render.
 */
export function splitProps<P extends Record<string, unknown>>(
  props: P,
  variantKeys: readonly string[] = EMPTY_VARIANT_KEYS,
  variantKeySet: ReadonlySet<string>,
  defaultVariants: Record<string, string> = EMPTY_DEFAULT_VARIANTS,
): SplitPropsResult<P> {
  if (variantKeys.length === 0) {
    return splitWithoutVariants(props);
  }

  const forwardedProps: Record<string, unknown> = {};
  const variantProps: Record<string, string | undefined> = {};

  for (const key in props) {
    if (variantKeySet.has(key)) {
      const value = props[key];
      variantProps[key] = value !== undefined ? String(value) : defaultVariants[key];
      continue;
    }

    if (INTERNAL_PROP_KEYS.has(key)) continue;

    forwardedProps[key] = props[key];
  }

  for (let i = 0; i < variantKeys.length; i++) {
    const key = variantKeys[i];
    if (variantProps[key] === undefined) {
      variantProps[key] = defaultVariants[key];
    }
  }

  return {
    forwardedProps: forwardedProps as Omit<P, string>,
    variantProps,
  };
}

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
  return splitProps(props, Array.from(variantKeys), variantKeys).forwardedProps;
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
  return splitProps(
    props,
    Array.from(variantKeys),
    variantKeys,
    defaultVariants,
  ).variantProps;
}
