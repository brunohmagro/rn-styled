/**
 * Template parser → AST.
 *
 * The template is presented as the standard tagged-template tuple:
 *   strings: TemplateStringsArray
 *   interpolations: Interpolation[]
 *
 * Grammar (simplified):
 *   template    := declaration*
 *   declaration := propName ':' value ';'
 *   propName    := kebab-case identifier
 *   value       := staticValue | dynamicPlaceholder
 *   staticValue := any CSS literal (string, number, color, …)
 *
 * Dynamic placeholders are represented by the index in `interpolations`.
 * Between each consecutive pair of strings there is exactly one interpolation.
 *
 * Parsing strategy:
 * 1. Interleave strings and interpolations into a flat token stream where
 *    interpolations are kept as sentinel objects.
 * 2. Split on ';' boundaries to get per-declaration chunks.
 * 3. For each chunk, extract the property name (always static string) and value.
 * 4. If the value is a sentinel (TokenRef or VariantSlot), emit DynamicDecl.
 *    If it is a plain CSS string/number, try shorthand expansion then emit StaticDecl(s).
 * 5. If value is anything else (function, object not recognized), throw in __DEV__.
 */

import {
  TOKEN_REF_BRAND,
  VARIANT_SLOT_BRAND,
  type ASTNode,
  type DynamicDecl,
  type Interpolation,
  type ParsedTemplate,
  type StaticDecl,
  type TokenRef,
  type VariantSlot,
} from './types';
import { tryExpandShorthand } from './shorthands';
import { kebabToRN, parseCSSValue } from './platform';

// ---------------------------------------------------------------------------
// Internal: interleaved token stream
// ---------------------------------------------------------------------------

type TextToken = { kind: 'text'; value: string };
type SlotToken = { kind: 'slot'; interp: Interpolation };
type Token = TextToken | SlotToken;

function buildTokenStream(
  strings: TemplateStringsArray,
  interpolations: Interpolation[],
): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < strings.length; i++) {
    if (strings[i]) tokens.push({ kind: 'text', value: strings[i] });
    if (i < interpolations.length) {
      tokens.push({ kind: 'slot', interp: interpolations[i] });
    }
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Internal: split token stream into declaration-level chunks
// ---------------------------------------------------------------------------

/** A "chunk" is a list of tokens between two ';' boundaries. */
type DeclChunk = Token[];

function splitIntoDeclarations(tokens: Token[]): DeclChunk[] {
  const chunks: DeclChunk[] = [];
  let current: Token[] = [];

  for (const token of tokens) {
    if (token.kind === 'text') {
      // A single text token may contain multiple ';' separators
      const parts = token.value.split(';');
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i > 0) {
          // We crossed a ';' — flush the current chunk
          if (current.length > 0) {
            chunks.push(current);
          }
          current = [];
        }
        if (part) {
          current.push({ kind: 'text', value: part });
        }
      }
    } else {
      current.push(token);
    }
  }
  // Trailing chunk without ';' is still valid
  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Internal: parse a single declaration chunk
// ---------------------------------------------------------------------------

type RawDecl =
  | { kind: 'static'; kebabKey: string; rawValue: string }
  | { kind: 'dynamic'; kebabKey: string; slot: TokenRef | VariantSlot };

function parseDeclaration(chunk: DeclChunk): RawDecl | null {
  // Collect text parts until the first ':', that gives us the property name.
  // After the ':', the remainder is the value (may contain a slot token).
  let colonSeen = false;
  let propRaw = '';
  let valueRaw = '';
  let dynamicSlot: TokenRef | VariantSlot | null = null;
  let hasExtraInterp = false;

  for (const token of chunk) {
    if (token.kind === 'text') {
      if (!colonSeen) {
        const colonIdx = token.value.indexOf(':');
        if (colonIdx !== -1) {
          colonSeen = true;
          propRaw += token.value.slice(0, colonIdx);
          valueRaw += token.value.slice(colonIdx + 1);
        } else {
          propRaw += token.value;
        }
      } else {
        valueRaw += token.value;
      }
    } else {
      // Slot token
      const interp = token.interp;
      if (!colonSeen) {
        // A slot before ':' is not a valid property name
        if (__DEV__) {
          throw new Error(
            `[rn-styled] Interpolation in property name position is not supported.`,
          );
        }
        return null;
      }

      if (isTokenRef(interp) || isVariantSlot(interp)) {
        if (dynamicSlot !== null) {
          // Two slots in one value is not supported
          if (__DEV__) {
            throw new Error(
              `[rn-styled] Multiple interpolations in a single CSS declaration are not supported. ` +
                `Use one v() or t() per property.`,
            );
          }
          return null;
        }
        dynamicSlot = interp;
      } else {
        // Arbitrary interpolation (function, object, etc.)
        if (__DEV__) {
          throw new Error(
            `[rn-styled] Arbitrary interpolations (e.g. \${props => ...}) are not supported in ` +
              `rn-styled v1. Use v() for variants or t() for tokens instead.\n` +
              `Found: ${JSON.stringify(interp)}`,
          );
        }
        hasExtraInterp = true;
      }
    }
  }

  if (hasExtraInterp) return null;

  const kebabKey = propRaw.trim().toLowerCase();
  if (!kebabKey) return null;

  if (dynamicSlot) {
    return { kind: 'dynamic', kebabKey, slot: dynamicSlot };
  }

  const rawValue = valueRaw.trim();
  if (!rawValue) return null;

  return { kind: 'static', kebabKey, rawValue };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export function isTokenRef(v: unknown): v is TokenRef {
  return typeof v === 'object' && v !== null && (v as TokenRef)._brand === TOKEN_REF_BRAND;
}

export function isVariantSlot(v: unknown): v is VariantSlot {
  return (
    typeof v === 'object' && v !== null && (v as VariantSlot)._brand === VARIANT_SLOT_BRAND
  );
}

// ---------------------------------------------------------------------------
// Public: parse tagged template → ParsedTemplate
// ---------------------------------------------------------------------------

export function parseTemplate(
  strings: TemplateStringsArray,
  interpolations: Interpolation[],
): ParsedTemplate {
  const tokens = buildTokenStream(strings, interpolations);
  const declChunks = splitIntoDeclarations(tokens);

  const nodes: ASTNode[] = [];
  const variantKeySet = new Set<string>();

  for (const chunk of declChunks) {
    // Skip empty/whitespace-only chunks
    const hasContent = chunk.some(
      (t) => t.kind === 'slot' || (t.kind === 'text' && t.value.trim() !== ''),
    );
    if (!hasContent) continue;

    const raw = parseDeclaration(chunk);
    if (!raw) continue;

    if (raw.kind === 'dynamic') {
      const rnKey = kebabToRN(raw.kebabKey);
      if (!rnKey) {
        if (__DEV__) {
          console.warn(
            `[rn-styled] Unknown CSS property "${raw.kebabKey}" — skipping.`,
          );
        }
        continue;
      }
      const decl: DynamicDecl = { kind: 'dynamic', propKey: rnKey, slot: raw.slot };
      nodes.push(decl);

      if (isVariantSlot(raw.slot)) {
        variantKeySet.add(raw.slot.variantKey);
      }
    } else {
      // Try shorthand expansion first
      const expanded = tryExpandShorthand(raw.kebabKey, raw.rawValue);
      if (expanded) {
        for (const [expandedKey, expandedVal] of expanded) {
          // expandedKey is already camelCase from the expander
          nodes.push({ kind: 'static', propKey: expandedKey, value: expandedVal } as StaticDecl);
        }
      } else {
        const rnKey = kebabToRN(raw.kebabKey);
        if (!rnKey) {
          if (__DEV__) {
            console.warn(
              `[rn-styled] Unknown CSS property "${raw.kebabKey}" — skipping.`,
            );
          }
          continue;
        }
        const value = parseCSSValue(raw.rawValue);
        nodes.push({ kind: 'static', propKey: rnKey, value } as StaticDecl);
      }
    }
  }

  return { nodes, variantKeys: [...variantKeySet] };
}

// Ambient declaration for __DEV__
declare const __DEV__: boolean;
