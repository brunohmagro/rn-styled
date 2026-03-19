# @rn-styled/styled

TypeScript-first styling library for React Native with template-literal syntax, typed themes, typed variants, and cached runtime style resolution.

## Installation

```bash
pnpm add @rn-styled/styled react react-native
```

## Quick start

```tsx
import { ThemeProvider, createTheme, styled, t, v } from '@rn-styled/styled';

const theme = createTheme({
  __id: 'light-v1',
  colors: {
    primary: '#245CFF',
    onPrimary: '#FFFFFF',
    background: '#F7F9FF',
  },
  space: { 3: 12, 4: 16 },
  radii: { md: 12 },
  fontSizes: { md: 16, lg: 22 },
});

type AppTheme = typeof theme;

const Button = styled.Pressable.withConfig({
  defaultVariants: { tone: 'primary' },
})`
  padding-vertical: ${t<AppTheme>('space.3')};
  padding-horizontal: ${t<AppTheme>('space.4')};
  border-radius: ${t<AppTheme>('radii.md')};
  background-color: ${v('tone', {
    primary: 'colors.primary',
    ghost: 'transparent',
  })};
`;

const Label = styled.Text`
  color: ${v('tone', {
    primary: 'colors.onPrimary',
    ghost: 'colors.primary',
  })};
  font-size: ${t<AppTheme>('fontSizes.md')};
`;

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Button tone="primary">
        <Label tone="primary">Press me</Label>
      </Button>
    </ThemeProvider>
  );
}
```

## What it includes

- `styled` factory for React Native components and custom components with `style`
- `createTheme` for typed theme creation
- `ThemeProvider` and `useTheme`
- `t()` for typed token references
- `v()` for typed variant slots
- `withConfig()` for default variants and display names

## Package structure

- `@rn-styled/styled`: public package most apps should install
- `@rn-styled/core`: lower-level parser/runtime package used internally

## Notes

- `theme.__id` should be unique per theme instance so cached variant styles stay correct when switching themes.
- Prefer `v()` for dynamic style branches instead of arbitrary function interpolations.
- For components without a direct `styled.X` shortcut, use `styled(Component)` if the component accepts a `style` prop.
