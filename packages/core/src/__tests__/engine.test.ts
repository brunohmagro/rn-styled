import { describe, it, expect } from 'vitest';
import { buildVariantCacheKey, resolveStyles } from '../engine';
import { parseTemplate } from '../ast';
import { TOKEN_REF_BRAND, VARIANT_SLOT_BRAND } from '../types';

// Build reusable test data
function tokenRef(path: string) {
  return { _brand: TOKEN_REF_BRAND, path };
}
function variantSlot(variantKey: string, mapping: Record<string, unknown>) {
  return { _brand: VARIANT_SLOT_BRAND, variantKey, mapping };
}

const theme = {
  __id: 'light-v1',
  colors: {
    primary: '#6200EE',
    surface: '#FFFFFF',
  },
  space: { 3: 12, 4: 16 },
};

describe('buildVariantCacheKey', () => {
  it('generates stable keys regardless of prop order', () => {
    const key1 = buildVariantCacheKey('Btn', 'light-v1', { tone: 'primary', size: 'lg' });
    const key2 = buildVariantCacheKey('Btn', 'light-v1', { size: 'lg', tone: 'primary' });
    expect(key1).toBe(key2);
  });

  it('includes all segments in the key', () => {
    const key = buildVariantCacheKey('Button', 'light-v1', { tone: 'primary' });
    expect(key).toBe('Button|light-v1|tone=primary');
  });

  it('omits undefined variant values from key', () => {
    const key = buildVariantCacheKey('Btn', 'light-v1', { tone: undefined, size: 'lg' });
    expect(key).toBe('Btn|light-v1|size=lg');
  });
});

describe('resolveStyles', () => {
  it('resolves static styles', () => {
    const strings = Object.assign(['  padding: 12px;  '], {
      raw: ['  padding: 12px;  '],
    }) as unknown as TemplateStringsArray;
    const template = parseTemplate(strings, []);
    const { base, variant } = resolveStyles('CompA', template, theme, {});

    expect(base.base).toEqual({ padding: 12 });
    expect(variant).toBeNull();
  });

  it('resolves token ref dynamic styles', () => {
    const interp = tokenRef('colors.primary');
    const strings = Object.assign(['  color: ', ';  '], {
      raw: ['  color: ', ';  '],
    }) as unknown as TemplateStringsArray;
    const template = parseTemplate(strings, [interp]);

    const { base, variant } = resolveStyles('CompB', template, theme, {});
    expect(base.base).toEqual({});
    expect(variant).not.toBeNull();
    expect(variant!.variant).toEqual({ color: '#6200EE' });
  });

  it('resolves variant slot styles based on selected prop', () => {
    const slot = variantSlot('tone', {
      primary: 'colors.primary',
      ghost: 'transparent',
    });
    const strings = Object.assign(['  background-color: ', ';  '], {
      raw: ['  background-color: ', ';  '],
    }) as unknown as TemplateStringsArray;
    const template = parseTemplate(strings, [slot]);

    const { variant: primaryVariant } = resolveStyles('CompC', template, theme, {
      tone: 'primary',
    });
    expect(primaryVariant!.variant).toEqual({ backgroundColor: '#6200EE' });

    const { variant: ghostVariant } = resolveStyles('CompC2', template, theme, {
      tone: 'ghost',
    });
    expect(ghostVariant!.variant).toEqual({ backgroundColor: 'transparent' });
  });

  it('caches variant styles for identical keys', () => {
    const slot = variantSlot('size', { sm: 8, lg: 16 });
    const strings = Object.assign(['  padding: ', ';  '], {
      raw: ['  padding: ', ';  '],
    }) as unknown as TemplateStringsArray;
    const template = parseTemplate(strings, [slot]);

    const result1 = resolveStyles('CompD', template, theme, { size: 'sm' });
    const result2 = resolveStyles('CompD', template, theme, { size: 'sm' });

    // Same reference means cache hit
    expect(result1.variant).toBe(result2.variant);
  });

  it('resolves variant slot with function mapping value', () => {
    const slot = variantSlot('tone', {
      computed: (t: typeof theme) => t.colors.primary + '80',
    });
    const strings = Object.assign(['  background-color: ', ';  '], {
      raw: ['  background-color: ', ';  '],
    }) as unknown as TemplateStringsArray;
    const template = parseTemplate(strings, [slot]);

    const { variant } = resolveStyles('CompE', template, theme, { tone: 'computed' });
    expect(variant!.variant).toEqual({ backgroundColor: '#6200EE80' });
  });
});
