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
import { resolveTokenSegments } from './tokens';
import type { BaseTheme, ParsedTemplate, RNStyleObject } from './types';

// ---------------------------------------------------------------------------
// Tipos e caches
// ---------------------------------------------------------------------------

export type RegisteredStyle = { [key: string]: RNStyleObject };

/** Strong cache: componentId -> estilo base registrado. */
const baseStyleCache = new Map<string, RegisteredStyle>();

/** LRU cache: chave completa -> estilo de variantes registrado. */
const variantStyleCache = new LRUCache<RegisteredStyle>(800);
const variantPairStyleCache = new WeakMap<RegisteredStyle, readonly [RNStyleObject, RNStyleObject]>();

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

  const registered = registerStyle('base', template.staticStyle);
  baseStyleCache.set(componentId, registered);
  return registered;
}

// ---------------------------------------------------------------------------
// Variant style cache key
// ---------------------------------------------------------------------------

export function buildVariantCacheKey(
  componentId: string,
  themeId: string,
  variantKeys: readonly string[],
  variantProps: Record<string, string | undefined>,
): string {
  let cacheKey = `${componentId}|${themeId}`;
  for (let i = 0; i < variantKeys.length; i++) {
    const key = variantKeys[i];
    const value = variantProps[key];
    if (value !== undefined) {
      cacheKey += `|${key}=${value}`;
    }
  }
  return cacheKey;
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
  if (!template.hasDynamic) return null;

  const themeId = theme.__id ?? 'default';
  const cacheKey = buildVariantCacheKey(componentId, themeId, template.variantKeys, variantProps);

  const cached = variantStyleCache.get(cacheKey);
  if (cached) return cached;

  const styleObj: RNStyleObject = {};

  for (const node of template.compiledDynamicNodes) {
    const { propKey } = node;

    if (node.kind === 'token') {
      const value = resolveTokenSegments(theme, node.path, node.pathSegments);
      (styleObj as Record<string, unknown>)[propKey] = value;
    } else {
      const selectedValue = variantProps[node.variantKey];
      const mappingEntry = selectedValue !== undefined ? node.mapping[selectedValue] : undefined;

      if (mappingEntry === undefined) {
        continue;
      }

      let resolved: string | number;
      if (mappingEntry.kind === 'theme-fn') {
        resolved = mappingEntry.resolver(theme);
      } else if (mappingEntry.kind === 'token') {
        resolved = resolveTokenSegments(theme, mappingEntry.path, mappingEntry.pathSegments);
      } else {
        resolved = mappingEntry.value;
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

export function getCachedComposedStyle(
  base: RegisteredStyle,
  variant: RegisteredStyle | null,
): RNStyleObject | readonly [RNStyleObject, RNStyleObject] {
  if (variant === null) {
    return base.base;
  }

  const cached = variantPairStyleCache.get(variant);
  if (cached) return cached;

  const composed = [base.base, variant.variant] as const;
  variantPairStyleCache.set(variant, composed);
  return composed;
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
