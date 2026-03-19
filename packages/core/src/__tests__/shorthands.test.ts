import { describe, it, expect } from 'vitest';
import { expandPadding, expandMargin, expandBorderRadius, tryExpandShorthand } from '../shorthands';

describe('expandPadding', () => {
  it('expands 1-value shorthand to all four sides', () => {
    const result = expandPadding('12px');
    expect(result).toEqual([
      ['paddingTop', 12],
      ['paddingRight', 12],
      ['paddingBottom', 12],
      ['paddingLeft', 12],
    ]);
  });

  it('expands 2-value shorthand', () => {
    const result = expandPadding('12px 16px');
    expect(result).toEqual([
      ['paddingTop', 12],
      ['paddingRight', 16],
      ['paddingBottom', 12],
      ['paddingLeft', 16],
    ]);
  });

  it('expands 4-value shorthand', () => {
    const result = expandPadding('4px 8px 12px 16px');
    expect(result).toEqual([
      ['paddingTop', 4],
      ['paddingRight', 8],
      ['paddingBottom', 12],
      ['paddingLeft', 16],
    ]);
  });
});

describe('expandMargin', () => {
  it('expands 2-value margin shorthand', () => {
    const result = expandMargin('8 16');
    expect(result).toEqual([
      ['marginTop', 8],
      ['marginRight', 16],
      ['marginBottom', 8],
      ['marginLeft', 16],
    ]);
  });
});

describe('expandBorderRadius', () => {
  it('expands 2-value border-radius shorthand (CSS spec: [tl/br, tr/bl])', () => {
    // CSS 2-value: first → top-left & bottom-right, second → top-right & bottom-left
    const result = expandBorderRadius('8px 16px');
    expect(result).toEqual([
      ['borderTopLeftRadius', 8],
      ['borderTopRightRadius', 16],
      ['borderBottomRightRadius', 8],
      ['borderBottomLeftRadius', 16],
    ]);
  });
});

describe('tryExpandShorthand', () => {
  it('expands padding with multi-value', () => {
    const result = tryExpandShorthand('padding', '12px 16px');
    expect(result).not.toBeNull();
  });

  it('returns null for single-value padding', () => {
    const result = tryExpandShorthand('padding', '12px');
    expect(result).toBeNull();
  });

  it('returns null for non-shorthand property', () => {
    const result = tryExpandShorthand('color', 'red');
    expect(result).toBeNull();
  });
});
