# Performance

`@rn-styled/styled` is designed to preserve template-literal DX while keeping most styling work outside the render hot path.

## Current benchmark summary

The latest local benchmark run produced this scorecard:

| Library | Normalized score | Average total time | Scenario wins |
|---|---:|---:|---:|
| `@rn-styled/styled` | `6.00` | `1601 ms` | `6` |
| `styled-components/native` | `7.23` | `1836 ms` | `0` |

Interpretation:

- lower normalized score is better
- `@rn-styled/styled` was about `17.0%` better on normalized score
- `@rn-styled/styled` was about `12.8%` better on average total time
- the current run ended `6 x 0` in scenario wins

## Scenarios covered

| Scenario | What it stresses | Latest winner |
|---|---|---|
| `Mount 120 Cards` | mount cost across many styled nodes | `@rn-styled/styled` |
| `Update Variants` | repeated variant prop changes | `@rn-styled/styled` |
| `Swap Theme` | theme context updates and token re-resolution | `@rn-styled/styled` |
| `Mount FlatList` | list item mount overhead | `@rn-styled/styled` |
| `Reorder FlatList` | reorder cost in a virtualized list | `@rn-styled/styled` |
| `12 Sequential Updates` | sustained repeated rerenders | `@rn-styled/styled` |

## What the benchmark means

These results support a narrow and defensible claim:

> In our local React Native Release/Hermes benchmark harness, `@rn-styled/styled` outperformed `styled-components/native` across the measured scenarios.

These results do not mean:

- every real-world app will see the exact same percentage gain
- list-heavy screens will always improve by the same amount
- React Native rendering cost disappears just because styling is faster

## Methodology notes

For comparisons to be meaningful, keep these constraints stable:

- same app and same scenario implementations for both libraries
- same React Native and React versions
- same JS engine, preferably Hermes
- same device or simulator
- Release builds, not Debug builds
- multiple runs, comparing medians or normalized score instead of a single lucky run

For a reproducible checklist, see [BENCHMARK.md](./BENCHMARK.md).

## Why `@rn-styled/styled` can be faster

The library is optimized around a few principles:

- templates are parsed once into internal metadata
- static style data is precomputed and cached
- dynamic style resolution uses deterministic cache keys
- variant prop extraction and prop forwarding are split in a single pass
- common style compositions are reused when no inline `style` override is present
- token paths are precompiled so repeated theme lookups do less work

## Recommended wording for GitHub and npm

Use wording like this:

> `@rn-styled/styled` keeps the styled-components authoring model for React Native, but with a runtime designed around cache-friendly theme and variant resolution. In our local Release/Hermes benchmark harness, it outperformed `styled-components/native` in 6 of 6 measured scenarios and delivered about 12.8% lower average total time in the latest run.

Avoid wording like this:

- "always faster than styled-components"
- "guaranteed performance improvement in every app"
- "zero-cost runtime"
