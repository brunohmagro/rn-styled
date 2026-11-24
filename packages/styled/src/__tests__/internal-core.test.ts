import { describe, expect, it } from 'vitest';
import {
  createPropSplitter,
  getCachedComposedStyle,
  parseTemplate,
  splitProps,
} from '../internal-core';
import { t, v } from '../helpers';

describe('internal-core parseTemplate metadata', () => {
  it('precomputes static and dynamic metadata for runtime resolution', () => {
    const strings = [
      '\n        padding: 12px;\n        color: ',
      ';\n        background-color: ',
      ';\n      ',
    ] as unknown as TemplateStringsArray;

    const template = parseTemplate(strings, [
      t('colors.primary'),
      v('tone', { danger: 'colors.danger', primary: 'colors.primary' }),
    ]);

    expect(template.hasDynamic).toBe(true);
    expect(template.staticNodes).toHaveLength(1);
    expect(template.dynamicNodes).toHaveLength(2);
    expect(template.compiledDynamicNodes).toHaveLength(2);
    expect(template.staticStyle).toEqual({ padding: 12 });
    expect(template.variantKeys).toEqual(['tone']);
  });
});

describe('internal-core splitProps', () => {
  it('returns original props when there are no variant keys to strip', () => {
    const props = { children: 'Hello', accessibilityLabel: 'greeting' };
    const result = splitProps(props, [], new Set());

    expect(result.forwardedProps).toBe(props);
    expect(result.variantProps).toEqual({});
  });

  it('extracts variants and strips them from forwarded props in one pass', () => {
    const props = {
      tone: 'primary',
      size: undefined,
      accessibilityLabel: 'button',
      testID: 'cta',
    };

    const result = splitProps(
      props,
      ['size', 'tone'],
      new Set(['size', 'tone']),
      { size: 'md' },
    );

    expect(result.forwardedProps).toEqual({
      accessibilityLabel: 'button',
      testID: 'cta',
    });
    expect(result.variantProps).toEqual({
      tone: 'primary',
      size: 'md',
    });
  });

  it('creates a specialized splitter for a single variant key', () => {
    const splitCardProps = createPropSplitter(['tone'], { tone: 'neutral' });
    const result = splitCardProps({
      tone: 'danger',
      testID: 'card',
      accessibilityLabel: 'danger card',
    });

    expect(result.forwardedProps).toEqual({
      testID: 'card',
      accessibilityLabel: 'danger card',
    });
    expect(result.variantProps).toEqual({
      tone: 'danger',
    });
  });
});

describe('internal-core style composition cache', () => {
  it('reuses the same style pair when inline style is absent', () => {
    const base = { base: { padding: 12 } };
    const variant = { variant: { backgroundColor: 'red' } };

    const first = getCachedComposedStyle(base, variant);
    const second = getCachedComposedStyle(base, variant);

    expect(first).toBe(second);
    expect(first).toEqual([{ padding: 12 }, { backgroundColor: 'red' }]);
  });
});
