# API Reference — rn-styled

---

## `createTheme<const T>(theme: T): T`

Creates a typed theme. The `<const T>` generic preserves string/number literal types, enabling autocomplete throughout the library.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `theme` | `T extends BaseTheme` | ✅ | Your theme object |

**`theme.__id`** — A unique string identifier for this theme. Used as part of the variant style cache key. Required for correct behaviour when switching themes at runtime. A dev warning is logged if missing.

```ts
const theme = createTheme({
  __id: 'light-v1',
  colors: { primary: '#6200EE' },
  space: { 4: 16 },
});
```

---

## `ThemeProvider`

```tsx
<ThemeProvider theme={theme}>
  {children}
</ThemeProvider>
```

**Props**

| Name | Type | Required |
|---|---|---|
| `theme` | `T extends BaseTheme` | ✅ |
| `children` | `ReactNode` | ✅ |

---

## `useTheme<T>(): T`

Returns the current theme. Throws if called outside `<ThemeProvider>`.

```ts
const theme = useTheme<typeof myTheme>();
theme.colors.primary; // fully typed
```

---

## `t<Theme>(path): TokenRef`

Creates a token reference. The path is resolved against the active theme at render time and the result is cached.

```ts
t<AppTheme>('colors.primary')   // TokenRef { path: 'colors.primary' }
t<AppTheme>('space.4')          // TokenRef { path: 'space.4' }
```

**TypeScript:** The generic `<Theme>` parameter enables autocomplete and type checking for valid dot-separated paths in your theme.

**Fallback:** If the path does not exist in the theme, the raw path string is used and a dev warning is logged.

---

## `v<K, M>(variantKey, mapping): VariantSlot<K, M>`

Creates a variant slot. The component automatically gains a typed prop matching `variantKey`.

```ts
v('tone', {
  primary: 'colors.primary',     // token path
  ghost: 'transparent',          // CSS literal
  custom: (theme) => theme.colors.primary + 'CC',  // theme function
})
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `variantKey` | `string` | Prop name on the resulting component |
| `mapping` | `Record<string, string \| number \| (theme) => string \| number>` | Variant value map |

**Mapping value types**

- **Token path** (`'colors.primary'`): Detected automatically via heuristic (contains `.`, not a color literal). Resolved against theme.
- **CSS literal** (`'transparent'`, `'#fff'`, `12`): Used as-is.
- **Theme function** (`(theme) => value`): Called with the active theme. Must be pure. Result is cached along with the variant style.

---

## `styled`

The main factory. Supports three call signatures:

### `styled.View\`...\``

Shorthand for built-in RN components:

```ts
styled.View`...`
styled.Text`...`
styled.Image`...`
styled.Pressable`...`
styled.ScrollView`...`
```

### `styled(Component)\`...\``

For arbitrary components:

```ts
import { TouchableOpacity } from 'react-native';

const MyButton = styled(TouchableOpacity)`
  padding: 12px;
`;
```

The component must accept a `style` prop of type `StyleProp<ViewStyle | TextStyle | ImageStyle>`.

### `.withConfig(config)\`...\``

Chainable configuration before the tagged template:

```ts
const Button = styled.Pressable.withConfig({
  defaultVariants: { tone: 'primary', size: 'md' },
  displayName: 'Button',
})`
  ...
`;
```

**Config options**

| Key | Type | Description |
|---|---|---|
| `defaultVariants` | `Record<string, string>` | Default values for variant props |
| `displayName` | `string` | Component name in React DevTools |

---

## Type Utilities

### `DeepKeyOf<T, D?>`

All dot-separated paths into a nested type, up to depth `D` (default 4).

```ts
type Paths = DeepKeyOf<{ colors: { primary: string; secondary: string } }>;
// → 'colors' | 'colors.primary' | 'colors.secondary'
```

### `BaseTheme`

Minimum theme shape:

```ts
interface BaseTheme {
  __id?: string;
  [key: string]: unknown;
}
```

### `TokenRef`

Opaque object returned by `t()`. Do not construct manually.

### `VariantSlot<K, M>`

Opaque object returned by `v()`. Do not construct manually.

---

## Cache Key Format

```
"<componentId>|<themeId>|<variantKey>=<value>[|...]"
```

- `componentId`: Auto-generated stable string per component template (`View_1`, `Pressable_2`, …).
- `themeId`: `theme.__id` or `'default'` if missing.
- Variant entries are sorted lexicographically for determinism.

**Example:**
```
"Pressable_3|light-v1|size=lg|tone=primary"
```

---

## AST Node Types

```ts
// Static declaration — no theme dependency
interface StaticDecl {
  kind: 'static';
  propKey: string;   // camelCase RN property
  value: string | number;
}

// Dynamic declaration — depends on token or variant
interface DynamicDecl {
  kind: 'dynamic';
  propKey: string;
  slot: TokenRef | VariantSlot;
}
```

---

## Supported CSS Properties

All properties that React Native's StyleSheet supports are mapped. Key mappings:

| CSS | React Native |
|---|---|
| `background-color` | `backgroundColor` |
| `border-radius` | `borderRadius` |
| `flex-direction` | `flexDirection` |
| `align-items` | `alignItems` |
| `justify-content` | `justifyContent` |
| `font-size` | `fontSize` |
| `font-weight` | `fontWeight` |
| `text-align` | `textAlign` |
| `padding-vertical` | `paddingVertical` |
| `padding-horizontal` | `paddingHorizontal` |
| `z-index` | `zIndex` |

Unsupported properties (CSS selectors, pseudo-classes, `@media`, `calc()`, etc.) are not supported and will produce a dev warning.

---

## Error Messages

| Message | Cause | Fix |
|---|---|---|
| `Arbitrary interpolations … are not supported` | `${props => ...}` in template | Use `v()` for variants |
| `Multiple interpolations in a single CSS declaration` | Two `t()`/`v()` in one property | Split into two declarations |
| `Unknown CSS property "…"` | CSS property not in RN | Use the RN property name directly (camelCase) |
| `Token path "…" not found` | `t('path.notexist')` | Check your theme structure |
| `useTheme() called outside of <ThemeProvider>` | Hook used without provider | Wrap with `<ThemeProvider>` |
| `Theme is missing "__id"` | No `__id` in theme | Add `__id: 'my-theme-id'` to theme |
