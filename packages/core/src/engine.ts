/**
 * Style resolution engine.
 *
 * 1. A partir de um ParsedTemplate, constrói um estilo base contendo
 *    apenas declarações estáticas e o cacheia.
 * 2. Para cada combinação de tema + variantes, resolve as declarações
 *    dinâmicas e cacheia o resultado.
 * 3. resolveStyles() devolve { base, variant } pronto para uso em:
 *      style={[base.base, variant?.variant, props.style]}
 *
 * Nota: Não usamos StyleSheet.create porque em RN 0.81 + Expo + bridgeless,
 * PlatformConstants pode não estar disponível, causando crash. Objetos plain
 * funcionam perfeitamente em style={[...]} — StyleSheet.create é só otimização.
 */

import { LRUCache } from './cache';
import { isTokenRef, isVariantSlot } from './ast';
import { resolveToken, isTokenPath } from './tokens';
import type { BaseTheme, ParsedTemplate, RNStyleObject, StaticDecl } from './types';

// ---------------------------------------------------------------------------
// Tipos e caches
// ---------------------------------------------------------------------------

export type RegisteredStyle = { [key: string]: RNStyleObject };

/** Strong cache: componentId -> estilo base registrado. */
const baseStyleCache = new Map<string, RegisteredStyle>();

/** LRU cache: chave completa -> estilo de variantes registrado. */
const variantStyleCache = new LRUCache<RegisteredStyle>(800);

/** Retorna objeto de estilo no formato { [key]: styleObj }. */
function registerStyle(key: string, styleObj: RNStyleObject): RegisteredStyle {
  return { [key]: styleObj };
}

// ---------------------------------------------------------------------------
// Base style
// ---------------------------------------------------------------------------

/**
 * Constrói e cacheia o estilo base de um componente.
 * Chamado apenas uma vez por componentId.
 */
export function getBaseStyle(componentId: string, template: ParsedTemplate): RegisteredStyle {
  const cached = baseStyleCache.get(componentId);
  if (cached) return cached;

  const styleObj: RNStyleObject = {};
  for (const node of template.nodes) {
    if (node.kind === 'static') {
      (styleObj as Record<string, unknown>)[(node as StaticDecl).propKey] = (node as StaticDecl).value;
    }
  }

  const registered = registerStyle('base', styleObj);
  baseStyleCache.set(componentId, registered);
  return registered;
}

// ---------------------------------------------------------------------------
// Variant style cache key
// ---------------------------------------------------------------------------

export function buildVariantCacheKey(
  componentId: string,
  themeId: string,
  variantProps: Record<string, string | undefined>,
): string {
  const parts = Object.entries(variantProps)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);

  return `${componentId}|${themeId}|${parts.join('|')}`;
}

// ---------------------------------------------------------------------------
// Variant style
// ---------------------------------------------------------------------------

/**
 * Resolve as declarações dinâmicas para um conjunto de variantes + tema.
 * Devolve um estilo registrado ou null se não houver nada dinâmico.
 */
export function getVariantStyle<T extends BaseTheme>(
  componentId: string,
  template: ParsedTemplate,
  theme: T,
  variantProps: Record<string, string | undefined>,
): RegisteredStyle | null {
  const hasDynamic = template.nodes.some((n) => n.kind === 'dynamic');
  if (!hasDynamic) return null;

  const themeId = theme.__id ?? 'default';
  const cacheKey = buildVariantCacheKey(componentId, themeId, variantProps);

  const cached = variantStyleCache.get(cacheKey);
  if (cached) return cached;

  const styleObj: RNStyleObject = {};

  for (const node of template.nodes) {
    if (node.kind !== 'dynamic') continue;

    const { propKey, slot } = node;

    if (isTokenRef(slot)) {
      const value = resolveToken(theme, slot.path);
      (styleObj as Record<string, unknown>)[propKey] = value;
    } else if (isVariantSlot(slot)) {
      const selectedValue = variantProps[slot.variantKey];
      const mappingEntry = selectedValue !== undefined ? slot.mapping[selectedValue] : undefined;

      if (mappingEntry === undefined) {
        continue;
      }

      let resolved: string | number;
      if (typeof mappingEntry === 'function') {
        resolved = mappingEntry(theme);
      } else if (typeof mappingEntry === 'string' && isTokenPath(mappingEntry)) {
        resolved = resolveToken(theme, mappingEntry);
      } else {
        resolved = mappingEntry as string | number;
      }

      (styleObj as Record<string, unknown>)[propKey] = resolved;
    }
  }

  const registered = registerStyle('variant', styleObj);
  variantStyleCache.set(cacheKey, registered);
  return registered;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export interface ResolvedStyles {
  base: RegisteredStyle;
  variant: RegisteredStyle | null;
}

export function resolveStyles<T extends BaseTheme>(
  componentId: string,
  template: ParsedTemplate,
  theme: T,
  variantProps: Record<string, string | undefined>,
): ResolvedStyles {
  if (__DEV__ && !theme.__id) {
    console.warn(
      `[rn-styled] Theme is missing "__id". ` +
        `Variant styles will all share the same cache slot, which may cause ` +
        `incorrect styles when switching themes. Add a unique __id to your theme.`,
    );
  }

  const base = getBaseStyle(componentId, template);
  const variant = getVariantStyle(componentId, template, theme, variantProps);
  return { base, variant };
}

declare const __DEV__: boolean;

