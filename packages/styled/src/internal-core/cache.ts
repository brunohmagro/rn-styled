/**
 * Minimal LRU cache implementation.
 *
 * We avoid third-party dependencies to keep the bundle lean.
 * Implementation uses a doubly-linked list + Map for O(1) get/set/evict.
 *
 * Default capacity: 800 entries per cache instance.
 * Rationale: a typical app has ~50 distinct styled components, each with
 * ~3 variants and ~5 possible values → ~750 variant combinations plus some
 * theme combinations, comfortably within 800. Bump if needed.
 */

interface LRUNode<V> {
  key: string;
  value: V;
  prev: LRUNode<V> | null;
  next: LRUNode<V> | null;
}

export class LRUCache<V> {
  private capacity: number;
  private map: Map<string, LRUNode<V>>;
  private head: LRUNode<V>; // sentinel head (MRU side)
  private tail: LRUNode<V>; // sentinel tail (LRU side)

  constructor(capacity = 800) {
    this.capacity = capacity;
    this.map = new Map();
    // sentinels avoid null-checks on every operation
    this.head = { key: '', value: undefined as unknown as V, prev: null, next: null };
    this.tail = { key: '', value: undefined as unknown as V, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: string): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  set(key: string, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    const node: LRUNode<V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.insertAtFront(node);

    if (this.map.size > this.capacity) {
      this.evictLRU();
    }
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private insertAtFront(node: LRUNode<V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToFront(node: LRUNode<V>): void {
    this.removeNode(node);
    this.insertAtFront(node);
  }

  private evictLRU(): void {
    const lru = this.tail.prev;
    if (lru && lru !== this.head) {
      this.removeNode(lru);
      this.map.delete(lru.key);
    }
  }
}
