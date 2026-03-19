# @rn-styled/core

Internal runtime engine for `@rn-styled/styled`.

This package contains the parser, AST, token resolution, prop filtering, shorthand expansion, and cache logic used by the public `@rn-styled/styled` package.

## Installation

Most apps should install `@rn-styled/styled` instead of this package directly.

```bash
pnpm add @rn-styled/core react react-native
```

## Exposed primitives

- template parsing
- AST node types
- token and variant runtime helpers
- style resolution cache
- prop filtering utilities

## Intended audience

- library maintainers
- advanced consumers building custom wrappers on top of the runtime

If you only want the public styled API, theme helpers, and React components, install `@rn-styled/styled`.
