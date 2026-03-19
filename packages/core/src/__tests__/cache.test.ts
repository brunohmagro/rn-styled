import { describe, it, expect } from 'vitest';
import { LRUCache } from '../cache';

describe('LRUCache', () => {
  it('stores and retrieves values', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBeUndefined();
  });

  it('evicts LRU entry when capacity exceeded', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // 'a' is the LRU — inserting 'd' should evict it
    cache.set('d', 4);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
    expect(cache.size).toBe(3);
  });

  it('promotes accessed entry to MRU position', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // Access 'a' to make it MRU
    cache.get('a');
    // Now 'b' is LRU — inserting 'd' should evict 'b'
    cache.set('d', 4);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('updates existing key without growing size', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('a', 99);
    expect(cache.get('a')).toBe(99);
    expect(cache.size).toBe(1);
  });

  it('clears all entries', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('respects has()', () => {
    const cache = new LRUCache<string>(5);
    cache.set('x', 'hello');
    expect(cache.has('x')).toBe(true);
    expect(cache.has('y')).toBe(false);
  });
});
