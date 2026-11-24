/**
 * CSS shorthand expanders for the RN subset.
 *
 * React Native does NOT support true CSS shorthand properties like
 * `padding: 12px 16px;` in its style system — those must be expanded
 * to individual properties (paddingVertical/paddingHorizontal or
 * paddingTop/paddingRight/paddingBottom/paddingLeft).
 *
 * We expand common shorthands here so template authors can write
 * familiar CSS and get correct RN styles.
 */

export type ShorthandExpansion = Array<[string, string | number]>;

/**
 * Parses a space-separated list of 1-4 numeric values (with optional px suffix)
 * following CSS box model rules:
 *   1 value  -> all four sides
 *   2 values -> [vertical, horizontal]
 *   3 values -> [top, horizontal, bottom]
 *   4 values -> [top, right, bottom, left]
 */
function parseBoxValues(raw: string): [number, number, number, number] | null {
  const parts = raw
    .trim()
    .split(/\s+/)
    .map((p) => {
      const n = parseFloat(p.replace(/px$/i, ''));
      return isNaN(n) ? null : n;
    });

  if (parts.some((p) => p === null)) return null;
  const nums = parts as number[];

  if (nums.length === 1) return [nums[0], nums[0], nums[0], nums[0]];
  if (nums.length === 2) return [nums[0], nums[1], nums[0], nums[1]];
  if (nums.length === 3) return [nums[0], nums[1], nums[2], nums[1]];
  if (nums.length === 4) return [nums[0], nums[1], nums[2], nums[3]];
  return null;
}

/**
 * Expand `padding: <values>` into individual padding properties.
 */
export function expandPadding(raw: string): ShorthandExpansion | null {
  const values = parseBoxValues(raw);
  if (!values) return null;
  const [top, right, bottom, left] = values;
  return [
    ['paddingTop', top],
    ['paddingRight', right],
    ['paddingBottom', bottom],
    ['paddingLeft', left],
  ];
}

/**
 * Expand `margin: <values>` into individual margin properties.
 */
export function expandMargin(raw: string): ShorthandExpansion | null {
  const values = parseBoxValues(raw);
  if (!values) return null;
  const [top, right, bottom, left] = values;
  return [
    ['marginTop', top],
    ['marginRight', right],
    ['marginBottom', bottom],
    ['marginLeft', left],
  ];
}

/**
 * Expand `border-radius: <values>` into individual corner properties.
 */
export function expandBorderRadius(raw: string): ShorthandExpansion | null {
  const values = parseBoxValues(raw);
  if (!values) return null;
  const [tl, tr, br, bl] = values;
  return [
    ['borderTopLeftRadius', tl],
    ['borderTopRightRadius', tr],
    ['borderBottomRightRadius', br],
    ['borderBottomLeftRadius', bl],
  ];
}

/**
 * Dispatcher: given a (already kebab->camel converted) key and raw value string,
 * return expanded declarations or null if not a handled shorthand.
 *
 * Called BEFORE camelCase conversion when we still have the original kebab key.
 */
export function tryExpandShorthand(
  kebabKey: string,
  rawValue: string,
): ShorthandExpansion | null {
  // Only try expansion when raw value has multiple whitespace-separated tokens
  const hasSingleValue = !/\s/.test(rawValue.trim());
  if (hasSingleValue) return null;

  switch (kebabKey) {
    case 'padding':
      return expandPadding(rawValue);
    case 'margin':
      return expandMargin(rawValue);
    case 'border-radius':
      return expandBorderRadius(rawValue);
    default:
      return null;
  }
}
