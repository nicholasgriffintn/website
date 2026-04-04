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
  private pending: Map<string, Promise<unknown>>;
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.pending = new Map();
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

  async upsert<K>(key: string, factory: () => Promise<K>): Promise<K> {
    const cached = this.get<K>(key);
    if (cached !== null) {
      return cached;
    }

    const pending = this.pending.get(key) as Promise<K> | undefined;
    if (pending) {
      return pending;
    }

    const created = factory()
      .then((value) => {
        this.set(key, value as unknown as T);
        return value;
      })
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, created);
    return created;
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
    this.pending.clear();
  }
}
