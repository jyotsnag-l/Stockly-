/**
 * High-performance In-Memory Cache Manager
 * Prevents unnecessary database roundtrips to Sydney, Australia
 * Auto-invalidates instantly on any write/update operations (consistent read-after-write)
 */
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl = 8000; // Cache data for 8 seconds

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clears all cached read calls immediately.
   * Called on any write operation (POST, PUT, DELETE, transactions)
   */
  invalidateAll(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
