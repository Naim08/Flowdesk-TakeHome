// src/config/memorystore.ts
import { Mutex } from 'async-mutex';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

export class MemoryStore {
  private store = new Map<string, CacheEntry>();
  private mutex = new Mutex();
  private defaultTTL = 60000; // 1 minute

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      this.store.set(key, {
        value,
        expiresAt: Date.now() + (ttl || this.defaultTTL)
      });
    } finally {
      release();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const release = await this.mutex.acquire();
    try {
      const entry = this.store.get(key);
      if (!entry) return null;
      
      if (Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }
      
      return entry.value as T;
    } finally {
      release();
    }
  }

  async delete(key: string): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      this.store.delete(key);
    } finally {
      release();
    }
  }

  async clear(): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      this.store.clear();
    } finally {
      release();
    }
  }
}

export const memoryStore = new MemoryStore();