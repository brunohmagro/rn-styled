import { describe, it, expect } from 'vitest';
import { filterProps, extractVariantProps } from '../propFilter';

describe('filterProps', () => {
  it('removes variant keys from props', () => {
    const variantKeys = new Set(['tone', 'size']);
    const props = {
      tone: 'primary',
      size: 'lg',
      onPress: () => {},
      accessibilityLabel: 'press me',
    };
    const filtered = filterProps(props, variantKeys);
    expect(filtered).not.toHaveProperty('tone');
    expect(filtered).not.toHaveProperty('size');
    expect(filtered).toHaveProperty('onPress');
    expect(filtered).toHaveProperty('accessibilityLabel');
  });

  it('preserves non-variant props unchanged', () => {
    const variantKeys = new Set(['variant']);
    const props = { children: 'hello', style: { color: 'red' } };
    const filtered = filterProps(props, variantKeys);
    expect(filtered).toEqual(props);
  });

  it('removes internal props', () => {
    const variantKeys = new Set<string>();
    const props = { _rnStyled: true, onPress: () => {} };
    const filtered = filterProps(props, variantKeys);
    expect(filtered).not.toHaveProperty('_rnStyled');
    expect(filtered).toHaveProperty('onPress');
  });
});

describe('extractVariantProps', () => {
  it('extracts variant prop values', () => {
    const variantKeys = new Set(['tone', 'size']);
    const props = { tone: 'primary', size: 'lg', onPress: () => {} };
    const extracted = extractVariantProps(props, variantKeys);
    expect(extracted).toEqual({ tone: 'primary', size: 'lg' });
  });

  it('uses default values when props not provided', () => {
    const variantKeys = new Set(['tone', 'size']);
    const props = { onPress: () => {} };
    const defaults = { tone: 'primary', size: 'md' };
    const extracted = extractVariantProps(props, variantKeys, defaults);
    expect(extracted).toEqual({ tone: 'primary', size: 'md' });
  });

  it('coerces values to string', () => {
    const variantKeys = new Set(['size']);
    const props = { size: 3 as unknown as string };
    const extracted = extractVariantProps(props, variantKeys);
    expect(extracted).toEqual({ size: '3' });
  });
});
