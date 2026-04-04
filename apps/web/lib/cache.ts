import { isJsonSerializable } from "./json";

type CacheConfig = {
  duration?: number;
  maxEntries?: number;
  namespace?: string;
  useEdgeCache?: boolean;
};

export type CacheRequestContext = {
  request?: Request;
  executionContext?: ExecutionContext;
};

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const DEFAULT_CACHE_DURATION = 30 * 60 * 1000;
const DEFAULT_CACHE_NAMESPACE = "default";

function hasDefaultCache(
  cacheStorage: CacheStorage,
): cacheStorage is CacheStorage & { default: Cache } {
  return "default" in cacheStorage && cacheStorage.default instanceof Cache;
}

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
      namespace: DEFAULT_CACHE_NAMESPACE,
      useEdgeCache: true,
      ...config,
    };
  }

  get<K extends T = T>(key: string): K | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > (this.config.duration ?? 0);
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as K;
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

  async upsert<K extends T>(
    key: string,
    factory: () => Promise<K>,
    cacheContext?: CacheRequestContext,
  ): Promise<K> {
    const cached = this.get<K>(key);
    if (cached !== null) {
      return cached;
    }

    const pending = this.pending.get(key) as Promise<K> | undefined;
    if (pending) {
      return pending;
    }

    const created = (async () => {
      const edgeCached = await this.getEdge<K>(key, cacheContext?.request);
      if (edgeCached !== null) {
        this.set(key, edgeCached);
        return edgeCached;
      }

      const value = await factory();
      if (value !== null) {
        this.set(key, value);
        const edgeWrite = this.setEdge(key, value, cacheContext?.request);
        if (cacheContext?.executionContext) {
          cacheContext.executionContext.waitUntil(edgeWrite);
        } else {
          await edgeWrite;
        }
      }

      return value;
    })().finally(() => {
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

  private getEdgeRequest(key: string, request: Request): Request {
    const namespace = this.config.namespace ?? DEFAULT_CACHE_NAMESPACE;
    const namespacedKey = `${namespace}:${key}`;
    const url = new URL(request.url);
    url.pathname = `/__cache/${encodeURIComponent(namespacedKey)}`;
    url.search = "";
    return new Request(url.toString(), { method: "GET" });
  }

  private getEdgeCache(): Cache | null {
    if (!this.config.useEdgeCache) {
      return null;
    }

    if (typeof caches === "undefined") {
      return null;
    }

    return hasDefaultCache(caches) ? caches.default : null;
  }

  private async getEdge<K extends T = T>(key: string, request?: Request): Promise<K | null> {
    const edgeCache = this.getEdgeCache();
    if (!edgeCache || !request) {
      return null;
    }

    try {
      const response = await edgeCache.match(this.getEdgeRequest(key, request));
      if (!response) {
        return null;
      }

      const payload = (await response.json()) as { value?: K };
      return payload.value ?? null;
    } catch (error) {
      console.warn("Failed to read cache from Cloudflare edge cache", error);
      return null;
    }
  }

  private async setEdge<K>(key: string, value: K, request?: Request): Promise<void> {
    const edgeCache = this.getEdgeCache();
    if (!edgeCache || !request || !isJsonSerializable(value)) {
      return;
    }

    const ttlSeconds = Math.max(
      1,
      Math.floor((this.config.duration ?? DEFAULT_CACHE_DURATION) / 1000),
    );

    try {
      await edgeCache.put(
        this.getEdgeRequest(key, request),
        new Response(JSON.stringify({ value }), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": `public, max-age=${ttlSeconds}`,
          },
        }),
      );
    } catch (error) {
      console.warn("Failed to write cache to Cloudflare edge cache", error);
    }
  }

  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
}
