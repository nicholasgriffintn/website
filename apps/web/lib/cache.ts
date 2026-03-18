type CacheConfig = {
  duration?: number;
  maxEntries?: number;
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.config = {
      duration: DEFAULT_CACHE_DURATION,
      maxEntries: 100,
      ...config,
    };
  }

  get<K>(key: string): K | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > (this.config.duration ?? 0);
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as unknown as K;
  }

  set(key: string, data: T): void {
    if (this.cache.size >= (this.config.maxEntries ?? 100)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private findOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }

    return oldestKey;
  }

  clear(): void {
    this.cache.clear();
  }
}
