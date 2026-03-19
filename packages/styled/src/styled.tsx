/**
 * styled() factory — the main public API.
 *
 * Architecture:
 *   styled.Pressable`...`
 *   styled(MyComponent)`...`
 *   styled.Pressable.withConfig({ defaultVariants })`...`
 *   styled(MyComponent).withConfig({ defaultVariants })`...`
 *
 * Each call to the tagged template function:
 *   1. Parses the template ONCE (at module init / first call) into a ParsedTemplate.
 *   2. Returns a React component that, on each render:
 *      a. Reads the current theme from context.
 *      b. Extracts variant props from component props.
 *      c. Calls resolveStyles() → [baseStyle, variantStyle] (both LRU-cached).
 *      d. Filters variant props out of the forwarded props.
 *      e. Renders the underlying component with style=[base, variant, props.style].
 *
 * We use React.forwardRef so refs work transparently.
 */

import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  View,
  Text,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  Switch,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  ActivityIndicatorProps,
  FlatListProps,
  ViewProps,
  TextProps,
  ImageProps,
  ImageBackgroundProps,
  KeyboardAvoidingViewProps,
  PressableProps,
  ScrollViewProps,
  SectionListProps,
  SwitchProps,
  TextInputProps,
  TouchableHighlightProps,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

import {
  parseTemplate,
  resolveStyles,
  filterProps,
  extractVariantProps,
  type BaseTheme,
  type Interpolation,
  type ParsedTemplate,
  type VariantSlot,
} from '@rn-styled/core';

import { useTheme } from './ThemeProvider';

// ---------------------------------------------------------------------------
// Counter for stable componentIds
// ---------------------------------------------------------------------------

let componentCounter = 0;

function nextComponentId(displayName: string): string {
  return `${displayName}_${++componentCounter}`;
}

// ---------------------------------------------------------------------------
// Config type
// ---------------------------------------------------------------------------

export interface StyledConfig {
  /** Default variant values applied when the prop is not provided. */
  defaultVariants?: Record<string, string>;
  /** Custom display name for React DevTools. */
  displayName?: string;
}

// ---------------------------------------------------------------------------
// Extract variant prop types from interpolations array
// ---------------------------------------------------------------------------

/** Given an array of Interpolation, collect VariantSlot types. */
type ExtractVariantSlots<T extends readonly Interpolation[]> = {
  [I in keyof T]: T[I] extends VariantSlot<infer K, infer M>
    ? { [key in K]?: keyof M & string }
    : Record<never, never>;
}[number];

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

type MergeVariantProps<T extends readonly Interpolation[]> = UnionToIntersection<
  ExtractVariantSlots<T>
>;

// ---------------------------------------------------------------------------
// Style prop union
// ---------------------------------------------------------------------------

type AnyStyle = ViewStyle | TextStyle | ImageStyle;

// ---------------------------------------------------------------------------
// Styled component creator
// ---------------------------------------------------------------------------

type ComponentWithStyle<P> = React.ComponentType<P & { style?: StyleProp<AnyStyle> }>;

/**
 * Build the React component from a parsed template + config.
 */
function buildStyledComponent<
  Props extends { style?: StyleProp<AnyStyle> },
  VariantProps extends Record<string, string | undefined>,
>(
  BaseComponent: ComponentWithStyle<Props>,
  template: ParsedTemplate,
  config: StyledConfig,
  displayName: string,
): React.ComponentType<Omit<Props, 'style'> & VariantProps & { style?: StyleProp<AnyStyle> }> {
  const componentId = nextComponentId(config.displayName ?? displayName);
  const variantKeySet = new Set(template.variantKeys);
  const defaultVariants = config.defaultVariants ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StyledComponent = forwardRef<unknown, any>((props, ref) => {
    // 1. Get theme from context
    let theme: BaseTheme;
    try {
      // useTheme throws if outside provider — fall back to empty theme
      // eslint-disable-next-line react-hooks/rules-of-hooks
      theme = useTheme();
    } catch {
      theme = { __id: 'default' };
    }

    // 2. Extract variant props
    const variantProps = extractVariantProps(props, variantKeySet, defaultVariants);

    // 3. Resolve styles (LRU-cached)
    const { base, variant } = resolveStyles(componentId, template, theme, variantProps);

    // 4. Build style array (no flatten — RN handles arrays natively)
    const styleArray =
      variant !== null
        ? [base.base, variant.variant, props.style]
        : [base.base, props.style];

    // 5. Filter variant props from forwarded props
    const forwardedProps = filterProps(props, variantKeySet);

    return (
      <BaseComponent
        {...(forwardedProps as Props)}
        ref={ref}
        style={styleArray}
      />
    );
  });

  StyledComponent.displayName = `styled(${displayName})`;

  return StyledComponent as unknown as React.ComponentType<
    Omit<Props, 'style'> & VariantProps & { style?: StyleProp<AnyStyle> }
  >;
}

// ---------------------------------------------------------------------------
// Tagged template tagged function builder
// ---------------------------------------------------------------------------

/**
 * A "configurable template function" — supports both direct tagged template
 * call and .withConfig() chaining.
 */
interface ConfigurableTemplateFunction<Props extends { style?: StyleProp<AnyStyle> }> {
  <Interps extends readonly Interpolation[]>(
    strings: TemplateStringsArray,
    ...interpolations: Interps
  ): React.ComponentType<
    Omit<Props, 'style'> & MergeVariantProps<Interps> & { style?: StyleProp<AnyStyle> }
  >;

  withConfig(
    config: StyledConfig,
  ): ConfigurableTemplateFunction<Props>;
}

function createConfigurableTemplateFn<Props extends { style?: StyleProp<AnyStyle> }>(
  BaseComponent: ComponentWithStyle<Props>,
  displayName: string,
  config: StyledConfig = {},
): ConfigurableTemplateFunction<Props> {
  function taggedTemplate<Interps extends readonly Interpolation[]>(
    strings: TemplateStringsArray,
    ...interpolations: Interps
  ): React.ComponentType<
    Omit<Props, 'style'> & MergeVariantProps<Interps> & { style?: StyleProp<AnyStyle> }
  > {
    const template = parseTemplate(strings, interpolations as unknown as Interpolation[]);
    return buildStyledComponent<Props, Record<string, string | undefined>>(
      BaseComponent,
      template,
      config,
      displayName,
    ) as unknown as React.ComponentType<
      Omit<Props, 'style'> & MergeVariantProps<Interps> & { style?: StyleProp<AnyStyle> }
    >;
  }

  taggedTemplate.withConfig = (newConfig: StyledConfig) =>
    createConfigurableTemplateFn(BaseComponent, displayName, { ...config, ...newConfig });

  return taggedTemplate as ConfigurableTemplateFunction<Props>;
}

// ---------------------------------------------------------------------------
// styled() function
// ---------------------------------------------------------------------------

/**
 * Core styled() function for arbitrary components.
 *
 * @example
 * const MyButton = styled(TouchableOpacity)`
 *   padding: 12px;
 * `;
 */
function styledFn<Props extends { style?: StyleProp<AnyStyle> }>(
  BaseComponent: ComponentWithStyle<Props>,
): ConfigurableTemplateFunction<Props> {
  const displayName =
    (BaseComponent as { displayName?: string }).displayName ||
    (BaseComponent as { name?: string }).name ||
    'Component';
  return createConfigurableTemplateFn(BaseComponent, displayName);
}

// ---------------------------------------------------------------------------
// Convenience properties: styled.View, styled.Text, etc.
// ---------------------------------------------------------------------------

type StyledFactory = typeof styledFn & {
  View: ConfigurableTemplateFunction<ViewProps & { style?: StyleProp<ViewStyle> }>;
  Text: ConfigurableTemplateFunction<TextProps & { style?: StyleProp<TextStyle> }>;
  Image: ConfigurableTemplateFunction<ImageProps & { style?: StyleProp<ImageStyle> }>;
  ImageBackground: ConfigurableTemplateFunction<
    ImageBackgroundProps & { style?: StyleProp<ViewStyle> }
  >;
  Pressable: ConfigurableTemplateFunction<PressableProps & { style?: StyleProp<ViewStyle> }>;
  TouchableOpacity: ConfigurableTemplateFunction<
    TouchableOpacityProps & { style?: StyleProp<ViewStyle> }
  >;
  TouchableHighlight: ConfigurableTemplateFunction<
    TouchableHighlightProps & { style?: StyleProp<ViewStyle> }
  >;
  ScrollView: ConfigurableTemplateFunction<ScrollViewProps & { style?: StyleProp<ViewStyle> }>;
  SafeAreaView: ConfigurableTemplateFunction<ViewProps & { style?: StyleProp<ViewStyle> }>;
  KeyboardAvoidingView: ConfigurableTemplateFunction<
    KeyboardAvoidingViewProps & { style?: StyleProp<ViewStyle> }
  >;
  ActivityIndicator: ConfigurableTemplateFunction<
    ActivityIndicatorProps & { style?: StyleProp<ViewStyle> }
  >;
  TextInput: ConfigurableTemplateFunction<TextInputProps & { style?: StyleProp<TextStyle> }>;
  Switch: ConfigurableTemplateFunction<SwitchProps & { style?: StyleProp<ViewStyle> }>;
  FlatList: ConfigurableTemplateFunction<FlatListProps<unknown> & { style?: StyleProp<ViewStyle> }>;
  SectionList: ConfigurableTemplateFunction<
    SectionListProps<unknown> & { style?: StyleProp<ViewStyle> }
  >;
};

const styled = styledFn as StyledFactory;

/**
 * Cria uma fábrica de styled() estendida com atalhos baseados
 * nos componentes fornecidos pelo host (app).
 *
 * Isso evita que a biblioteca precise resolver 'react-native'
 * por conta própria em ambientes onde o módulo ainda não existe.
 */
export function createStyledFromHost(
  components: Partial<{
    View: React.ComponentType<ViewProps & { style?: StyleProp<ViewStyle> }>;
    Text: React.ComponentType<TextProps & { style?: StyleProp<TextStyle> }>;
    Image: React.ComponentType<ImageProps & { style?: StyleProp<ImageStyle> }>;
    ImageBackground: React.ComponentType<ImageBackgroundProps & { style?: StyleProp<ViewStyle> }>;
    Pressable: React.ComponentType<PressableProps & { style?: StyleProp<ViewStyle> }>;
    TouchableOpacity: React.ComponentType<
      TouchableOpacityProps & { style?: StyleProp<ViewStyle> }
    >;
    TouchableHighlight: React.ComponentType<
      TouchableHighlightProps & { style?: StyleProp<ViewStyle> }
    >;
    ScrollView: React.ComponentType<ScrollViewProps & { style?: StyleProp<ViewStyle> }>;
    SafeAreaView: React.ComponentType<ViewProps & { style?: StyleProp<ViewStyle> }>;
    KeyboardAvoidingView: React.ComponentType<
      KeyboardAvoidingViewProps & { style?: StyleProp<ViewStyle> }
    >;
    ActivityIndicator: React.ComponentType<
      ActivityIndicatorProps & { style?: StyleProp<ViewStyle> }
    >;
    TextInput: React.ComponentType<TextInputProps & { style?: StyleProp<TextStyle> }>;
    Switch: React.ComponentType<SwitchProps & { style?: StyleProp<ViewStyle> }>;
    FlatList: React.ComponentType<FlatListProps<unknown> & { style?: StyleProp<ViewStyle> }>;
    SectionList: React.ComponentType<
      SectionListProps<unknown> & { style?: StyleProp<ViewStyle> }
    >;
  }>,
): StyledFactory {
  const extended = styledFn as StyledFactory;

  if (components.View) {
    extended.View = createConfigurableTemplateFn(
      components.View as unknown as ComponentWithStyle<ViewProps & { style?: StyleProp<ViewStyle> }>,
      'View',
    );
  }

  if (components.Text) {
    extended.Text = createConfigurableTemplateFn(
      components.Text as unknown as ComponentWithStyle<TextProps & { style?: StyleProp<TextStyle> }>,
      'Text',
    );
  }

  if (components.Image) {
    extended.Image = createConfigurableTemplateFn(
      components.Image as unknown as ComponentWithStyle<
        ImageProps & { style?: StyleProp<ImageStyle> }
      >,
      'Image',
    );
  }

  if (components.ImageBackground) {
    extended.ImageBackground = createConfigurableTemplateFn(
      components.ImageBackground as unknown as ComponentWithStyle<
        ImageBackgroundProps & { style?: StyleProp<ViewStyle> }
      >,
      'ImageBackground',
    );
  }

  if (components.Pressable) {
    extended.Pressable = createConfigurableTemplateFn(
      components.Pressable as unknown as ComponentWithStyle<
        PressableProps & { style?: StyleProp<ViewStyle> }
      >,
      'Pressable',
    );
  }

  if (components.TouchableOpacity) {
    extended.TouchableOpacity = createConfigurableTemplateFn(
      components.TouchableOpacity as unknown as ComponentWithStyle<
        TouchableOpacityProps & { style?: StyleProp<ViewStyle> }
      >,
      'TouchableOpacity',
    );
  }

  if (components.TouchableHighlight) {
    extended.TouchableHighlight = createConfigurableTemplateFn(
      components.TouchableHighlight as unknown as ComponentWithStyle<
        TouchableHighlightProps & { style?: StyleProp<ViewStyle> }
      >,
      'TouchableHighlight',
    );
  }

  if (components.ScrollView) {
    extended.ScrollView = createConfigurableTemplateFn(
      components.ScrollView as unknown as ComponentWithStyle<
        ScrollViewProps & { style?: StyleProp<ViewStyle> }
      >,
      'ScrollView',
    );
  }

  if (components.SafeAreaView) {
    extended.SafeAreaView = createConfigurableTemplateFn(
      components.SafeAreaView as unknown as ComponentWithStyle<
        ViewProps & { style?: StyleProp<ViewStyle> }
      >,
      'SafeAreaView',
    );
  }

  if (components.KeyboardAvoidingView) {
    extended.KeyboardAvoidingView = createConfigurableTemplateFn(
      components.KeyboardAvoidingView as unknown as ComponentWithStyle<
        KeyboardAvoidingViewProps & { style?: StyleProp<ViewStyle> }
      >,
      'KeyboardAvoidingView',
    );
  }

  if (components.ActivityIndicator) {
    extended.ActivityIndicator = createConfigurableTemplateFn(
      components.ActivityIndicator as unknown as ComponentWithStyle<
        ActivityIndicatorProps & { style?: StyleProp<ViewStyle> }
      >,
      'ActivityIndicator',
    );
  }

  if (components.TextInput) {
    extended.TextInput = createConfigurableTemplateFn(
      components.TextInput as unknown as ComponentWithStyle<
        TextInputProps & { style?: StyleProp<TextStyle> }
      >,
      'TextInput',
    );
  }

  if (components.Switch) {
    extended.Switch = createConfigurableTemplateFn(
      components.Switch as unknown as ComponentWithStyle<
        SwitchProps & { style?: StyleProp<ViewStyle> }
      >,
      'Switch',
    );
  }

  if (components.FlatList) {
    extended.FlatList = createConfigurableTemplateFn(
      components.FlatList as unknown as ComponentWithStyle<
        FlatListProps<unknown> & { style?: StyleProp<ViewStyle> }
      >,
      'FlatList',
    );
  }

  if (components.SectionList) {
    extended.SectionList = createConfigurableTemplateFn(
      components.SectionList as unknown as ComponentWithStyle<
        SectionListProps<unknown> & { style?: StyleProp<ViewStyle> }
      >,
      'SectionList',
    );
  }

  return extended;
}

let _StyledView:
  | ConfigurableTemplateFunction<ViewProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledText:
  | ConfigurableTemplateFunction<TextProps & { style?: StyleProp<TextStyle> }>
  | null = null;
let _StyledImage:
  | ConfigurableTemplateFunction<ImageProps & { style?: StyleProp<ImageStyle> }>
  | null = null;
let _StyledImageBackground:
  | ConfigurableTemplateFunction<ImageBackgroundProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledPressable:
  | ConfigurableTemplateFunction<PressableProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledTouchableOpacity:
  | ConfigurableTemplateFunction<TouchableOpacityProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledTouchableHighlight:
  | ConfigurableTemplateFunction<TouchableHighlightProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledScrollView:
  | ConfigurableTemplateFunction<ScrollViewProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledSafeAreaView:
  | ConfigurableTemplateFunction<ViewProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledKeyboardAvoidingView:
  | ConfigurableTemplateFunction<KeyboardAvoidingViewProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledActivityIndicator:
  | ConfigurableTemplateFunction<ActivityIndicatorProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledTextInput:
  | ConfigurableTemplateFunction<TextInputProps & { style?: StyleProp<TextStyle> }>
  | null = null;
let _StyledSwitch:
  | ConfigurableTemplateFunction<SwitchProps & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledFlatList:
  | ConfigurableTemplateFunction<FlatListProps<unknown> & { style?: StyleProp<ViewStyle> }>
  | null = null;
let _StyledSectionList:
  | ConfigurableTemplateFunction<SectionListProps<unknown> & { style?: StyleProp<ViewStyle> }>
  | null = null;

Object.defineProperty(styled, 'View', {
  get() {
    if (!_StyledView) {
      _StyledView = createConfigurableTemplateFn(
        View as unknown as ComponentWithStyle<
          ViewProps & { style?: StyleProp<ViewStyle> }
        >,
        'View',
      );
    }
    return _StyledView;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'Text', {
  get() {
    if (!_StyledText) {
      _StyledText = createConfigurableTemplateFn(
        Text as unknown as ComponentWithStyle<
          TextProps & { style?: StyleProp<TextStyle> }
        >,
        'Text',
      );
    }
    return _StyledText;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'Image', {
  get() {
    if (!_StyledImage) {
      _StyledImage = createConfigurableTemplateFn(
        Image as unknown as ComponentWithStyle<
          ImageProps & { style?: StyleProp<ImageStyle> }
        >,
        'Image',
      );
    }
    return _StyledImage;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'ImageBackground', {
  get() {
    if (!_StyledImageBackground) {
      _StyledImageBackground = createConfigurableTemplateFn(
        ImageBackground as unknown as ComponentWithStyle<
          ImageBackgroundProps & { style?: StyleProp<ViewStyle> }
        >,
        'ImageBackground',
      );
    }
    return _StyledImageBackground;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'Pressable', {
  get() {
    if (!_StyledPressable) {
      _StyledPressable = createConfigurableTemplateFn(
        Pressable as unknown as ComponentWithStyle<
          PressableProps & { style?: StyleProp<ViewStyle> }
        >,
        'Pressable',
      );
    }
    return _StyledPressable;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'TouchableOpacity', {
  get() {
    if (!_StyledTouchableOpacity) {
      _StyledTouchableOpacity = createConfigurableTemplateFn(
        TouchableOpacity as unknown as ComponentWithStyle<
          TouchableOpacityProps & { style?: StyleProp<ViewStyle> }
        >,
        'TouchableOpacity',
      );
    }
    return _StyledTouchableOpacity;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'TouchableHighlight', {
  get() {
    if (!_StyledTouchableHighlight) {
      _StyledTouchableHighlight = createConfigurableTemplateFn(
        TouchableHighlight as unknown as ComponentWithStyle<
          TouchableHighlightProps & { style?: StyleProp<ViewStyle> }
        >,
        'TouchableHighlight',
      );
    }
    return _StyledTouchableHighlight;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'ScrollView', {
  get() {
    if (!_StyledScrollView) {
      _StyledScrollView = createConfigurableTemplateFn(
        ScrollView as unknown as ComponentWithStyle<
          ScrollViewProps & { style?: StyleProp<ViewStyle> }
        >,
        'ScrollView',
      );
    }
    return _StyledScrollView;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'SafeAreaView', {
  get() {
    if (!_StyledSafeAreaView) {
      _StyledSafeAreaView = createConfigurableTemplateFn(
        SafeAreaView as unknown as ComponentWithStyle<
          ViewProps & { style?: StyleProp<ViewStyle> }
        >,
        'SafeAreaView',
      );
    }
    return _StyledSafeAreaView;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'KeyboardAvoidingView', {
  get() {
    if (!_StyledKeyboardAvoidingView) {
      _StyledKeyboardAvoidingView = createConfigurableTemplateFn(
        KeyboardAvoidingView as unknown as ComponentWithStyle<
          KeyboardAvoidingViewProps & { style?: StyleProp<ViewStyle> }
        >,
        'KeyboardAvoidingView',
      );
    }
    return _StyledKeyboardAvoidingView;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'ActivityIndicator', {
  get() {
    if (!_StyledActivityIndicator) {
      _StyledActivityIndicator = createConfigurableTemplateFn(
        ActivityIndicator as unknown as ComponentWithStyle<
          ActivityIndicatorProps & { style?: StyleProp<ViewStyle> }
        >,
        'ActivityIndicator',
      );
    }
    return _StyledActivityIndicator;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'TextInput', {
  get() {
    if (!_StyledTextInput) {
      _StyledTextInput = createConfigurableTemplateFn(
        TextInput as unknown as ComponentWithStyle<
          TextInputProps & { style?: StyleProp<TextStyle> }
        >,
        'TextInput',
      );
    }
    return _StyledTextInput;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'Switch', {
  get() {
    if (!_StyledSwitch) {
      _StyledSwitch = createConfigurableTemplateFn(
        Switch as unknown as ComponentWithStyle<
          SwitchProps & { style?: StyleProp<ViewStyle> }
        >,
        'Switch',
      );
    }
    return _StyledSwitch;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'FlatList', {
  get() {
    if (!_StyledFlatList) {
      _StyledFlatList = createConfigurableTemplateFn(
        FlatList as unknown as ComponentWithStyle<
          FlatListProps<unknown> & { style?: StyleProp<ViewStyle> }
        >,
        'FlatList',
      );
    }
    return _StyledFlatList;
  },
  enumerable: true,
});

Object.defineProperty(styled, 'SectionList', {
  get() {
    if (!_StyledSectionList) {
      _StyledSectionList = createConfigurableTemplateFn(
        SectionList as unknown as ComponentWithStyle<
          SectionListProps<unknown> & { style?: StyleProp<ViewStyle> }
        >,
        'SectionList',
      );
    }
    return _StyledSectionList;
  },
  enumerable: true,
});

export { styled };
export type { ConfigurableTemplateFunction, StyledFactory };
