import {
  MatchData,
  MatchStats,
  PlayerRelationStats,
  DetailedMatchMetadata,
  PlayerTag,
} from "./";
import { PartyGroup } from "./PartyService";

/**
 * Cached match data structure
 * NOTE: Match is cached ONLY after ALL data is fully loaded
 * This prevents partial data from being cached if user exits early
 */
interface CachedMatchData {
  matchData: MatchData;
  heroIconUrls: Map<number, string>;
  rankImageUrls: Map<number, string>;
  matchStatsMap: Map<number, MatchStats>;
  relationStatsMap: Map<number, PlayerRelationStats>;
  partyGroups: PartyGroup[];
  playerTagsMap: Map<number, PlayerTag[]>;
  timestamp: number;
}

interface CachedMatchMetadata {
  metadata: DetailedMatchMetadata;
  timestamp: number;
}

interface MetadataRetryItem {
  matchId: number;
  accountId: number;
  retryCount: number;
}

class MatchCacheServiceClass {
  private matchCache: Map<string, CachedMatchData> = new Map();
  private metadataCache: Map<string, CachedMatchMetadata> = new Map();
  private metadataRetryQueue: MetadataRetryItem[] = [];
  private isProcessingRetries = false;

  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly METADATA_RETRY_DELAY = 300; // 300ms between retries
  private readonly MAX_RETRY_COUNT = 3;

  getCachedMatch(matchId: string): CachedMatchData | null {
    const cached = this.matchCache.get(matchId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.matchCache.delete(matchId);
      return null;
    }

    return cached;
  }

  setCachedMatch(matchId: string, data: CachedMatchData): void {
    this.matchCache.set(matchId, {
      ...data,
      timestamp: Date.now(),
    });
  }

  getCachedMetadata(
    matchId: number,
    accountId: number
  ): DetailedMatchMetadata | null {
    const key = `${matchId}-${accountId}`;
    const cached = this.metadataCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.metadataCache.delete(key);
      return null;
    }

    return cached.metadata;
  }

  setCachedMetadata(
    matchId: number,
    accountId: number,
    metadata: DetailedMatchMetadata
  ): void {
    const key = `${matchId}-${accountId}`;
    this.metadataCache.set(key, {
      metadata,
      timestamp: Date.now(),
    });
  }

  addToRetryQueue(matchId: number, accountId: number): void {
    const existing = this.metadataRetryQueue.find(
      (item) => item.matchId === matchId && item.accountId === accountId
    );

    if (!existing) {
      this.metadataRetryQueue.push({
        matchId,
        accountId,
        retryCount: 0,
      });
    }
  }

  async processRetryQueue(
    fetchMetadataFn: (
      matchId: number,
      accountId: number
    ) => Promise<DetailedMatchMetadata | null>
  ): Promise<void> {
    if (this.isProcessingRetries || this.metadataRetryQueue.length === 0) {
      return;
    }

    this.isProcessingRetries = true;

    const itemsToRetry = [...this.metadataRetryQueue];
    this.metadataRetryQueue = [];

    for (const item of itemsToRetry) {
      if (item.retryCount >= this.MAX_RETRY_COUNT) {
        continue;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.METADATA_RETRY_DELAY)
      );

      try {
        const metadata = await fetchMetadataFn(item.matchId, item.accountId);
        if (metadata) {
          this.setCachedMetadata(item.matchId, item.accountId, metadata);
        } else {
          if (item.retryCount + 1 < this.MAX_RETRY_COUNT) {
            this.metadataRetryQueue.push({
              ...item,
              retryCount: item.retryCount + 1,
            });
          }
        }
      } catch (error) {
        if (item.retryCount + 1 < this.MAX_RETRY_COUNT) {
          this.metadataRetryQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        }
      }
    }

    this.isProcessingRetries = false;

    if (this.metadataRetryQueue.length > 0) {
      setTimeout(() => this.processRetryQueue(fetchMetadataFn), 1000);
    }
  }

  clearCache(): void {
    this.matchCache.clear();
    this.metadataCache.clear();
    this.metadataRetryQueue = [];
  }

  clearMatchCache(matchId: string): void {
    this.matchCache.delete(matchId);
  }

  getRetryQueueSize(): number {
    return this.metadataRetryQueue.length;
  }

  hasRetryQueue(): boolean {
    return this.metadataRetryQueue.length > 0;
  }
}

export const MatchCacheService = new MatchCacheServiceClass();
