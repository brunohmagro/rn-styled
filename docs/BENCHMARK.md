# Benchmark Reproduction

This document defines the benchmark protocol used to compare `@rn-styled/styled` with `styled-components/native`.

## Goal

Measure relative styling overhead under the same React Native app, same React Native version, same React version, same JS engine, and the same workloads.

## Required constraints

Keep these variables fixed between runs:

- same device or simulator
- same React Native version
- same React version
- same Hermes/JSC choice
- same app code and scenario logic
- Release builds only
- no debugger attached
- no Metro dev transforms influencing execution

## Workloads

Run the same scenarios for both libraries:

| Scenario | Purpose |
|---|---|
| `Mount 120 Cards` | measures mount overhead across many styled nodes |
| `Update Variants` | measures repeated variant prop changes |
| `Swap Theme` | measures theme update propagation and token re-resolution |
| `Mount FlatList` | measures list item mount overhead |
| `Reorder FlatList` | measures reorder cost in a virtualized list |
| `12 Sequential Updates` | measures sustained repeated rerenders |

## Recommended protocol

1. Use a dedicated benchmark app with two implementations of the same UI:
   - one using `@rn-styled/styled`
   - one using `styled-components/native`
2. Keep component trees, props, theme shape, and scenario code identical.
3. Run on Release builds with Hermes enabled.
4. Execute multiple runs per scenario.
5. Compare medians or normalized score instead of a single run.

## What to capture

Record at minimum:

- library name
- normalized score
- average total time
- scenario wins
- device or simulator model
- OS version
- React Native version
- React version
- JS engine
- benchmark date

## Reporting guidance

Good wording:

> In our local React Native Release/Hermes benchmark harness, `@rn-styled/styled` outperformed `styled-components/native` across the measured scenarios.

Avoid:

- "always faster"
- "guaranteed faster in every app"
- "zero runtime cost"
