import { describe, it, expect, vi } from 'vitest';
import { resolveToken, isTokenPath } from '../tokens';

describe('resolveToken', () => {
  const theme = {
    __id: 'test',
    colors: {
      primary: '#6200EE',
      surface: '#FFFFFF',
    },
    space: {
      1: 4,
      2: 8,
      3: 12,
    },
  };

  it('resolves a shallow token path', () => {
    const result = resolveToken(theme, 'colors');
    // 'colors' is an object, so it returns the string representation
    expect(typeof result).toBe('string');
  });

  it('resolves a deep token path', () => {
    expect(resolveToken(theme, 'colors.primary')).toBe('#6200EE');
    expect(resolveToken(theme, 'colors.surface')).toBe('#FFFFFF');
    expect(resolveToken(theme, 'space.1')).toBe(4);
    expect(resolveToken(theme, 'space.3')).toBe(12);
  });

  it('returns the raw path string when token not found (dev warning)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveToken(theme, 'colors.notexist');
    expect(result).toBe('colors.notexist');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles missing intermediate segment', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveToken(theme, 'typography.heading.size');
    expect(result).toBe('typography.heading.size');
    consoleSpy.mockRestore();
  });
});

describe('isTokenPath', () => {
  it('identifies token paths', () => {
    expect(isTokenPath('colors.primary')).toBe(true);
    expect(isTokenPath('space.3')).toBe(true);
    expect(isTokenPath('fontSizes.lg')).toBe(true);
  });

  it('rejects CSS literals', () => {
    expect(isTokenPath('transparent')).toBe(false);
    expect(isTokenPath('#fff')).toBe(false);
    expect(isTokenPath('rgba(0,0,0,0.5)')).toBe(false);
    expect(isTokenPath('white')).toBe(false);
    expect(isTokenPath('1.5')).toBe(false);
    expect(isTokenPath('12')).toBe(false);
    expect(isTokenPath('rgb(255,255,255)')).toBe(false);
  });
});
