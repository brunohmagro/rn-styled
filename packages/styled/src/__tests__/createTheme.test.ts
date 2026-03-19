import { describe, it, expect, vi } from 'vitest';
import { createTheme } from '../createTheme';

describe('createTheme', () => {
  it('returns the theme unchanged', () => {
    const theme = createTheme({
      __id: 'light',
      colors: { primary: '#6200EE' },
    });
    expect(theme.__id).toBe('light');
    expect(theme.colors.primary).toBe('#6200EE');
  });

  it('warns when __id is missing', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createTheme({ colors: { primary: '#000' } });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('__id'));
    spy.mockRestore();
  });

  it('preserves literal types (structural check)', () => {
    const theme = createTheme({
      __id: 'dark' as const,
      mode: 'dark' as const,
    });
    // TypeScript would catch type errors here; runtime check:
    expect(theme.mode).toBe('dark');
  });
});
