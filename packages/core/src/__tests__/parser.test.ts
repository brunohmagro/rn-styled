import { describe, it, expect, vi } from 'vitest';
import { parseTemplate, isTokenRef, isVariantSlot } from '../ast';
import { TOKEN_REF_BRAND, VARIANT_SLOT_BRAND } from '../types';

// Helpers to create the branded objects directly for test assertions
function tokenRef(path: string) {
  return { _brand: TOKEN_REF_BRAND, path };
}
function variantSlot(variantKey: string, mapping: Record<string, unknown>) {
  return { _brand: VARIANT_SLOT_BRAND, variantKey, mapping };
}

describe('parseTemplate', () => {
  it('parses a simple static template', () => {
    const strings = Object.assign(['  padding: 12px;  background-color: #fff;  '], {
      raw: ['  padding: 12px;  background-color: #fff;  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, []);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]).toEqual({ kind: 'static', propKey: 'padding', value: 12 });
    expect(result.nodes[1]).toEqual({
      kind: 'static',
      propKey: 'backgroundColor',
      value: '#fff',
    });
    expect(result.variantKeys).toHaveLength(0);
  });

  it('parses a template with a token ref interpolation', () => {
    const tokenInterp = tokenRef('colors.primary');
    const strings = Object.assign(['  color: ', ';  '], {
      raw: ['  color: ', ';  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, [tokenInterp]);

    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.kind).toBe('dynamic');
    if (node.kind === 'dynamic') {
      expect(node.propKey).toBe('color');
      expect(isTokenRef(node.slot)).toBe(true);
    }
  });

  it('parses a template with a variant slot', () => {
    const slot = variantSlot('tone', { primary: 'colors.primary', ghost: 'transparent' });
    const strings = Object.assign(['  background-color: ', ';  '], {
      raw: ['  background-color: ', ';  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, [slot]);

    expect(result.nodes).toHaveLength(1);
    expect(result.variantKeys).toEqual(['tone']);
    const node = result.nodes[0];
    expect(node.kind).toBe('dynamic');
    if (node.kind === 'dynamic') {
      expect(node.propKey).toBe('backgroundColor');
      expect(isVariantSlot(node.slot)).toBe(true);
    }
  });

  it('throws in dev when an arbitrary function interpolation is used', () => {
    const arbitraryFn = (props: unknown) => props;
    const strings = Object.assign(['  color: ', ';  '], {
      raw: ['  color: ', ';  '],
    }) as unknown as TemplateStringsArray;

    expect(() =>
      parseTemplate(strings, [arbitraryFn as unknown as typeof tokenRef]),
    ).toThrow('[rn-styled]');
  });

  it('expands padding shorthand', () => {
    const strings = Object.assign(['  padding: 12px 16px;  '], {
      raw: ['  padding: 12px 16px;  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, []);
    const keys = result.nodes.map((n) => n.propKey);
    expect(keys).toContain('paddingTop');
    expect(keys).toContain('paddingRight');
    expect(keys).toContain('paddingBottom');
    expect(keys).toContain('paddingLeft');
  });

  it('handles numeric values without px suffix', () => {
    const strings = Object.assign(['  opacity: 0.5;  '], {
      raw: ['  opacity: 0.5;  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, []);
    expect(result.nodes[0]).toEqual({ kind: 'static', propKey: 'opacity', value: 0.5 });
  });

  it('collects multiple variant keys', () => {
    const toneSlot = variantSlot('tone', { primary: 'colors.primary' });
    const sizeSlot = variantSlot('size', { sm: 8, lg: 16 });
    const strings = Object.assign(
      ['  background-color: ', ';  padding: ', ';  '],
      { raw: ['  background-color: ', ';  padding: ', ';  '] },
    ) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, [toneSlot, sizeSlot]);
    expect(result.variantKeys).toContain('tone');
    expect(result.variantKeys).toContain('size');
  });

  it('skips unknown CSS properties with a warning', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const strings = Object.assign(['  unknown-prop: red;  '], {
      raw: ['  unknown-prop: red;  '],
    }) as unknown as TemplateStringsArray;

    const result = parseTemplate(strings, []);
    expect(result.nodes).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown CSS property'),
    );
    consoleSpy.mockRestore();
  });
});
