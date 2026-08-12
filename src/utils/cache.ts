/**
 * High-performance dual-tier Client & Application Cache System (In-Memory + Web Storage).
 */

export interface CacheOptions {
  /** Time-to-Live in milliseconds. If omitted, item never expires automatically. */
  ttlMs?: number;
  /** Custom tags associated with this cache entry for bulk invalidation. */
  tags?: string[];
  /** Whether to persist in localStorage (true) or sessionStorage (false). Default: true. */
  persistent?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  created: number;
  expiresAt: number | null;
  tags: string[];
}

const STORAGE_PREFIX = 'gur_cache_';
const memoryStore = new Map<string, CacheEntry<any>>();

/**
 * High-level Cache Manager class.
 */
export class CacheManager {
  private prefix: string;

  constructor(prefix: string = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Set a key-value pair in cache.
   */
  public set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const { ttlMs, tags = [], persistent = true } = options;
    const now = Date.now();
    const expiresAt = ttlMs ? now + ttlMs : null;

    const entry: CacheEntry<T> = {
      value,
      created: now,
      expiresAt,
      tags,
    };

    const fullKey = this.getFullKey(key);

    // Always update in-memory cache
    memoryStore.set(fullKey, entry);

    // Persist to Web Storage if available
    const storageType = persistent ? 'localStorage' : 'sessionStorage';
    if (this.isStorageAvailable(storageType)) {
      try {
        window[storageType].setItem(fullKey, JSON.stringify(entry));
      } catch (err) {
        // Handle QuotaExceededError gracefully
        console.warn(`[CacheManager] Web Storage full. Entry "${key}" cached in memory only.`, err);
      }
    }
  }

  /**
   * Retrieve a value from cache if present and unexpired.
   */
  public get<T>(key: string): T | null {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    // Check memory store first
    if (memoryStore.has(fullKey)) {
      const entry = memoryStore.get(fullKey) as CacheEntry<T>;
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.remove(key);
        return null;
      }
      return entry.value;
    }

    // Check Web Storage
    for (const storageType of ['localStorage', 'sessionStorage'] as const) {
      if (this.isStorageAvailable(storageType)) {
        try {
          const raw = window[storageType].getItem(fullKey);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry<T>;
            if (entry.expiresAt && entry.expiresAt <= now) {
              window[storageType].removeItem(fullKey);
              continue;
            }
            // Populate memory store for subsequent fast hits
            memoryStore.set(fullKey, entry);
            return entry.value;
          }
        } catch (e) {
          // Parse or storage error
        }
      }
    }

    return null;
  }

  /**
   * Remove a specific cache entry.
   */
  public remove(key: string): void {
    const fullKey = this.getFullKey(key);
    memoryStore.delete(fullKey);

    for (const storageType of ['localStorage', 'sessionStorage'] as const) {
      if (this.isStorageAvailable(storageType)) {
        window[storageType].removeItem(fullKey);
      }
    }
  }

  /**
   * Invalidate all cache entries matching a specific tag.
   */
  public invalidateByTag(tag: string): void {
    // Invalidate in memory
    for (const [fullKey, entry] of memoryStore.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        memoryStore.delete(fullKey);
      }
    }

    // Invalidate in storage
    for (const storageType of ['localStorage', 'sessionStorage'] as const) {
      if (!this.isStorageAvailable(storageType)) continue;
      const storage = window[storageType];
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(this.prefix)) {
          try {
            const raw = storage.getItem(k);
            if (raw) {
              const entry = JSON.parse(raw) as CacheEntry<any>;
              if (entry.tags && entry.tags.includes(tag)) {
                keysToRemove.push(k);
              }
            }
          } catch (e) {}
        }
      }

      keysToRemove.forEach(k => storage.removeItem(k));
    }
  }

  /**
   * Clear all cache entries created under this manager's prefix.
   */
  public clearAll(): void {
    // Clear memory
    for (const k of Array.from(memoryStore.keys())) {
      if (k.startsWith(this.prefix)) {
        memoryStore.delete(k);
      }
    }

    // Clear Web Storage
    for (const storageType of ['localStorage', 'sessionStorage'] as const) {
      if (!this.isStorageAvailable(storageType)) continue;
      const storage = window[storageType];
      const keysToRemove: string[] = [];

      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }

      keysToRemove.forEach(k => storage.removeItem(k));
    }
  }

  /**
   * Stale-While-Revalidate or Cache-First fetch helper.
   * If cache is valid, returns cached data immediately.
   * Otherwise calls fetcher(), caches result, and returns it.
   */
  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    this.set(key, fresh, options);
    return fresh;
  }
}

/** Export singleton instance */
export const cache = new CacheManager();
