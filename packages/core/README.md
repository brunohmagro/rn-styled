# @rn-styled/core

Internal runtime engine for `@rn-styled/styled`.
This package is private to the monorepo and is not published on npm.

This package contains the parser, AST, token resolution, prop filtering, shorthand expansion, and cache logic used by the public `@rn-styled/styled` package.

## Exposed primitives

- template parsing
- AST node types
- token and variant runtime helpers
- style resolution cache
- prop filtering utilities

## Intended audience

- library maintainers
- contributors working inside this monorepo

If you want the public styled API, theme helpers, and React components, install `@rn-styled/styled`.
