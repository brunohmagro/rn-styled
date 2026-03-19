import { vi } from 'vitest';

// Mock react-native for node environment
vi.mock('react-native', async () => {
  return {
    StyleSheet: {
      create: (styles: Record<string, Record<string, unknown>>) => styles,
      flatten: (s: unknown) => s,
    },
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
  };
});
