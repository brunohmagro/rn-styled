import { describe, it, expect } from 'vitest';
import { t, v } from '../helpers';
import { TOKEN_REF_BRAND, VARIANT_SLOT_BRAND } from '@rn-styled/core';

describe('t() helper', () => {
  it('creates a TokenRef with correct brand and path', () => {
    const ref = t('colors.primary');
    expect(ref._brand).toBe(TOKEN_REF_BRAND);
    expect(ref.path).toBe('colors.primary');
  });

  it('preserves the exact path string', () => {
    expect(t('space.4').path).toBe('space.4');
    expect(t('fontSizes.lg').path).toBe('fontSizes.lg');
  });
});

describe('v() helper', () => {
  it('creates a VariantSlot with correct brand, key and mapping', () => {
    const slot = v('tone', { primary: 'colors.primary', ghost: 'transparent' });
    expect(slot._brand).toBe(VARIANT_SLOT_BRAND);
    expect(slot.variantKey).toBe('tone');
    expect(slot.mapping).toEqual({ primary: 'colors.primary', ghost: 'transparent' });
  });

  it('accepts function mapping values', () => {
    const fn = (theme: { colors: { primary: string } }) => theme.colors.primary;
    const slot = v('color', { dynamic: fn });
    expect(typeof slot.mapping.dynamic).toBe('function');
  });
});
