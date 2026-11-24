/**
 * Mapping from CSS kebab-case property names to React Native camelCase keys.
 *
 * Only properties that React Native actually supports are listed here.
 * Any CSS property not in this map will produce a dev warning and be skipped.
 */

export const KEBAB_TO_RN: Readonly<Record<string, string>> = {
  // Layout
  'align-content': 'alignContent',
  'align-items': 'alignItems',
  'align-self': 'alignSelf',
  'aspect-ratio': 'aspectRatio',
  bottom: 'bottom',
  direction: 'direction',
  display: 'display',
  flex: 'flex',
  'flex-basis': 'flexBasis',
  'flex-direction': 'flexDirection',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'flex-wrap': 'flexWrap',
  gap: 'gap',
  'column-gap': 'columnGap',
  'row-gap': 'rowGap',
  height: 'height',
  'justify-content': 'justifyContent',
  left: 'left',
  'max-height': 'maxHeight',
  'max-width': 'maxWidth',
  'min-height': 'minHeight',
  'min-width': 'minWidth',
  overflow: 'overflow',
  position: 'position',
  right: 'right',
  top: 'top',
  width: 'width',
  'z-index': 'zIndex',

  // Margin (individual — shorthands are expanded before lookup)
  margin: 'margin',
  'margin-bottom': 'marginBottom',
  'margin-end': 'marginEnd',
  'margin-horizontal': 'marginHorizontal',
  'margin-left': 'marginLeft',
  'margin-right': 'marginRight',
  'margin-start': 'marginStart',
  'margin-top': 'marginTop',
  'margin-vertical': 'marginVertical',

  // Padding (individual — shorthands expanded before lookup)
  padding: 'padding',
  'padding-bottom': 'paddingBottom',
  'padding-end': 'paddingEnd',
  'padding-horizontal': 'paddingHorizontal',
  'padding-left': 'paddingLeft',
  'padding-right': 'paddingRight',
  'padding-start': 'paddingStart',
  'padding-top': 'paddingTop',
  'padding-vertical': 'paddingVertical',

  // Border
  'border-bottom-color': 'borderBottomColor',
  'border-bottom-end-radius': 'borderBottomEndRadius',
  'border-bottom-left-radius': 'borderBottomLeftRadius',
  'border-bottom-right-radius': 'borderBottomRightRadius',
  'border-bottom-start-radius': 'borderBottomStartRadius',
  'border-bottom-width': 'borderBottomWidth',
  'border-color': 'borderColor',
  'border-end-color': 'borderEndColor',
  'border-end-width': 'borderEndWidth',
  'border-left-color': 'borderLeftColor',
  'border-left-width': 'borderLeftWidth',
  'border-radius': 'borderRadius',
  'border-right-color': 'borderRightColor',
  'border-right-width': 'borderRightWidth',
  'border-start-color': 'borderStartColor',
  'border-start-width': 'borderStartWidth',
  'border-style': 'borderStyle',
  'border-top-color': 'borderTopColor',
  'border-top-end-radius': 'borderTopEndRadius',
  'border-top-left-radius': 'borderTopLeftRadius',
  'border-top-right-radius': 'borderTopRightRadius',
  'border-top-start-radius': 'borderTopStartRadius',
  'border-top-width': 'borderTopWidth',
  'border-width': 'borderWidth',

  // Background / Color
  'background-color': 'backgroundColor',
  color: 'color',
  opacity: 'opacity',

  // Shadow (iOS)
  'shadow-color': 'shadowColor',
  'shadow-offset': 'shadowOffset',
  'shadow-opacity': 'shadowOpacity',
  'shadow-radius': 'shadowRadius',

  // Elevation (Android)
  elevation: 'elevation',

  // Transform
  transform: 'transform',

  // Text
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'include-font-padding': 'includeFontPadding',
  'letter-spacing': 'letterSpacing',
  'line-height': 'lineHeight',
  'text-align': 'textAlign',
  'text-align-vertical': 'textAlignVertical',
  'text-decoration-color': 'textDecorationColor',
  'text-decoration-line': 'textDecorationLine',
  'text-decoration-style': 'textDecorationStyle',
  'text-shadow-color': 'textShadowColor',
  'text-shadow-offset': 'textShadowOffset',
  'text-shadow-radius': 'textShadowRadius',
  'text-transform': 'textTransform',
  'writing-direction': 'writingDirection',

  // Image
  'resize-mode': 'resizeMode',
  'object-fit': 'objectFit',
  'tint-color': 'tintColor',
  'overlay-color': 'overlayColor',

  // Backface
  'backface-visibility': 'backfaceVisibility',
};

/** Convert a kebab-case CSS property to its RN camelCase equivalent. */
export function kebabToRN(kebab: string): string | undefined {
  return KEBAB_TO_RN[kebab];
}

/** Parse a raw CSS value string into a number or string. */
export function parseCSSValue(raw: string): string | number {
  const trimmed = raw.trim();
  // Strip trailing 'px' and attempt numeric parse
  const noPx = trimmed.replace(/px$/i, '');
  const num = Number(noPx);
  if (!isNaN(num) && noPx !== '') return num;
  return trimmed;
}
