# rn-styled

> A modern, TypeScript-first, React Native–only styling library inspired by styled-components.
> Template-literal DX with compile-time–quality performance.

---

## Philosophy

**Write CSS. Ship performance.**

rn-styled lets you write familiar CSS template literals:

```tsx
const Button = styled.Pressable`
  padding: 12px 24px;
  border-radius: 8px;
  background-color: ${v('tone', {
    primary: 'colors.primary',
    ghost: 'transparent',
  })};
`;

<Button tone="primary" onPress={...}>
  Press me
</Button>
```

Under the hood:

1. The template is **parsed once** (at module init) into an AST.
2. Static declarations become a single `StyleSheet.create`'d base style.
3. Dynamic declarations (token refs and variant slots) are resolved **per render** — but the result is **LRU-cached** by a deterministic key, so the hot path is a Map lookup + array spread.

No CSS injection. No DOM. No web. React Native only.

---

## Installation

```bash
# In your RN project
pnpm add @rn-styled/styled react react-native

# Peer deps are required but already installed in an RN project:
# react, react-native
```

---

## Quick Start

### 1. Create a theme

```ts
// theme.ts
import { createTheme } from '@rn-styled/styled';

export const theme = createTheme({
  __id: 'light-v1',         // ← REQUIRED for stable cache keys
  colors: {
    primary: '#6200EE',
    onPrimary: '#FFFFFF',
    background: '#FFFFFF',
  },
  space: { 2: 8, 3: 12, 4: 16 },
  radii: { md: 8 },
  fontSizes: { md: 14, lg: 18 },
});

export type AppTheme = typeof theme;
```

`__id` must be **unique per theme object**. When you change themes at runtime (dark/light switch), update `__id` so the cache key changes and new styles are computed.

### 2. Wrap your app

```tsx
// App.tsx
import { ThemeProvider } from '@rn-styled/styled';
import { theme } from './theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* your app */}
    </ThemeProvider>
  );
}
```

### 3. Create styled components

```tsx
import { styled, t, v } from '@rn-styled/styled';
import type { AppTheme } from './theme';

// Static + token styles
const Title = styled.Text`
  font-size: ${t<AppTheme>('fontSizes.lg')};
  color: ${t<AppTheme>('colors.primary')};
`;

// Variant-driven component
const Button = styled.Pressable.withConfig({
  defaultVariants: { tone: 'primary' },
})`
  padding: 12px 24px;
  border-radius: ${t<AppTheme>('radii.md')};

  background-color: ${v('tone', {
    primary: 'colors.primary',
    ghost: 'transparent',
  })};
`;

// Usage — tone prop is fully typed!
<Button tone="ghost" onPress={...} />
```

---

## Template Syntax Rules

### Allowed

| Syntax | Example |
|---|---|
| Static CSS declaration | `padding: 16px;` |
| Token reference | `color: ${t('colors.primary')};` |
| Variant slot | `background-color: ${v('tone', { ... })};` |
| Shorthand (multi-value) | `padding: 8px 16px;` |
| Numeric without px | `opacity: 0.8;` |
| Color literals | `background-color: transparent;` |

### Not Allowed (throws in dev)

```ts
// ❌ Arbitrary function interpolation — NOT supported in v1
const Bad = styled.View`
  color: ${(props) => props.color};
`;
// Throws: "[rn-styled] Arbitrary interpolations are not supported..."

// ❌ Two interpolations in one declaration
const Bad2 = styled.View`
  padding: ${t('space.2')} ${t('space.4')};
`;
// Throws: "[rn-styled] Multiple interpolations in a single CSS declaration..."
```

**Why?** Arbitrary interpolations break caching. If you accept `(props) => ...`, the style function runs every render with potentially unique output — no cache key is stable. Use `v()` for anything that changes.

---

## `t()` — Token References

```ts
import { t } from '@rn-styled/styled';

// Generic parameter gives autocomplete for valid token paths
t<AppTheme>('colors.primary')   // ✅ autocomplete works
t<AppTheme>('colors.notexist')  // TypeScript error (with strict types)
```

`t()` returns a `TokenRef` object. The parser detects it and emits a `DynamicDecl` node. At render time, the engine resolves `theme.colors.primary` using the active theme.

If the token path doesn't exist in the theme, a **dev warning** is logged and the raw path string is used as a fallback.

---

## `v()` — Variant Slots

```ts
import { v } from '@rn-styled/styled';

v('tone', {
  primary: 'colors.primary',      // token path → resolved against theme
  ghost: 'transparent',           // CSS literal → used as-is
  computed: (theme) => theme.colors.primary + '80',  // function → called with theme
})
```

Each key in the mapping becomes a valid value for the `tone` prop. TypeScript infers the union automatically:

```ts
const Button = styled.Pressable`...${v('tone', { primary: ..., ghost: ... })}...`;
// Button accepts: tone?: 'primary' | 'ghost'
```

### Mapping value types

| Type | Example | Behaviour |
|---|---|---|
| Token path string | `'colors.primary'` | Resolved via `resolveToken(theme, path)` |
| CSS literal | `'transparent'`, `'#fff'`, `12` | Used directly |
| Theme function | `(theme) => theme.colors.primary` | Called with active theme; must be pure |

> **Theme functions** in variant mappings are allowed but must be pure (only depend on `theme`, never on props or external state). They are called at cache-miss time and the result is cached.

---

## `withConfig()` — Default Variants

```ts
const Button = styled.Pressable.withConfig({
  defaultVariants: { tone: 'primary', size: 'md' },
})`
  ...
`;

// tone and size are optional in JSX (defaults apply)
<Button onPress={...} />            // uses tone='primary', size='md'
<Button tone="ghost" onPress={...} /> // overrides tone
```

`withConfig()` is chainable on both `styled.X` and `styled(Component)`:

```ts
styled(MyCustomView).withConfig({ defaultVariants: { variant: 'outlined' } })`...`
```

---

## Style Prop Merging

```tsx
<Button
  tone="primary"
  style={{ marginTop: 16 }}   // ← merged last, highest specificity
/>
```

Internally, the style is composed as:

```ts
style={[baseStyle, variantStyle, props.style]}
```

- `baseStyle` — static declarations, StyleSheet.create'd once.
- `variantStyle` — dynamic declarations resolved for current variants + theme, cached.
- `props.style` — user-provided overrides, always wins.

No `StyleSheet.flatten` is called. Arrays are natively understood by RN.

---

## Prop Filtering

Variant props (`tone`, `size`, etc.) are automatically stripped before the underlying component receives its props. This prevents the React Native "unknown prop" warning.

```tsx
// ✅ Clean — no unknown prop warnings
<ButtonContainer tone="primary" onPress={...} />
// ButtonContainer's underlying Pressable only receives: { onPress, style }
```

---

## Animations

Do **not** put animated values inside template literals. Pass them via `style` prop:

```tsx
// ✅ Correct
const AnimatedBox = styled.View`
  flex: 1;
  background-color: ${t('colors.surface')};
`;

const animatedStyle = useAnimatedStyle(() => ({
  opacity: progress.value,
}));

<AnimatedBox style={animatedStyle} />

// ❌ Wrong (will throw in dev)
const Bad = styled.View`
  opacity: ${animatedValue};
`;
```

---

## Best Practices

1. **Always set `__id` on your theme.** Without it, switching themes causes all variants to share a cache slot.
2. **Use `v()` for anything dynamic.** Never use `${props => ...}` — it throws in dev.
3. **Use `withConfig({ defaultVariants })` instead of prop defaults** inside the component — this way the default is applied at the style-resolution level, not in JSX.
4. **Keep token paths stable.** Renaming token paths invalidates the TypeScript types; update all usages.
5. **One `v()` or `t()` per declaration.** `padding: ${t('space.2')} ${t('space.4')}` is not supported; use `paddingVertical`/`paddingHorizontal` with separate declarations.
6. **Prefer shorthand padding/margin in multi-value form** for succinct layout: `padding: 8px 16px;` expands to four individual props automatically.

---

## Performance Notes

| Operation | Frequency | Cost |
|---|---|---|
| Template parsing (AST) | Once per module | O(n) in template length |
| Base style creation | Once per component | `StyleSheet.create` |
| Variant style resolution | Once per unique (component + theme + variants) combo | LRU-cached |
| Per-render work | Every render | Map lookup + array creation |

**Cache eviction:** The LRU cache holds 800 entries per cache instance. In a typical app with ~50 styled components × ~3 variants × ~5 values = ~750 combinations, this comfortably fits. You can increase the limit by modifying the `LRUCache` constructor call in `engine.ts`.

---

## Roadmap

- [ ] **Babel plugin** — static extraction of `StaticDecl` nodes at build time, eliminating runtime parsing entirely for static templates.
- [ ] **Reanimated integration** — first-class `useAnimatedStyle` helper that merges cleanly with the variant style array.
- [ ] **React Native Web support** — optional adapter that maps RN styles to CSS-in-JS for web targets.
- [ ] **Responsive variants** — `v('size', { sm: ..., md: ... }, { breakpoints: ... })` with Dimensions-based resolution.
- [ ] **Global style registry** — `injectGlobal` equivalent for text defaults and box-sizing normalisation.
