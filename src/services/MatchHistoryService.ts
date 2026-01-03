/**
 * Service for managing match search history and rate limiting
 * Spectator endpoint limit: 10 requests per 30 minutes
 */

const STORAGE_KEYS = {
  HISTORY: "deadlyze_match_history",
  RATE_LIMIT: "deadlyze_rate_limit",
} as const;

const SESSION_STORAGE_KEY = "deadlyze_attempted_matches";

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  WINDOW_MS: 30 * 60 * 1000, // 30 minutes
  RESTORE_INTERVAL_MS: 3 * 60 * 1000, // 3 minutes per request
} as const;

export interface MatchHistoryEntry {
  matchId: string;
  timestamp: number;
}

interface RateLimitState {
  availableRequests: number;
  lastRequestTime: number;
  timestamps: number[];
}

class MatchHistoryServiceClass {
  private history: MatchHistoryEntry[] = [];
  private rateLimitState: RateLimitState = {
    availableRequests: RATE_LIMIT_CONFIG.MAX_REQUESTS,
    lastRequestTime: Date.now(),
    timestamps: [],
  };
  private restoreInterval: number | null = null;
  private attemptedMatches: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
    this.loadAttemptedMatches();
    this.recalculateAvailableRequests();
    this.startRestoreInterval();
  }

  private loadAttemptedMatches(): void {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (data) {
        this.attemptedMatches = new Set(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load attempted matches:", error);
    }
  }

  private saveAttemptedMatches(): void {
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(Array.from(this.attemptedMatches))
      );
    } catch (error) {
      console.error("Failed to save attempted matches:", error);
    }
  }

  private loadFromStorage(): void {
    try {
      const historyData = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyData) {
        this.history = JSON.parse(historyData);
      }

      const rateLimitData = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
      if (rateLimitData) {
        const saved = JSON.parse(rateLimitData);
        this.rateLimitState = {
          availableRequests:
            saved.availableRequests ?? RATE_LIMIT_CONFIG.MAX_REQUESTS,
          lastRequestTime: saved.lastRequestTime ?? Date.now(),
          timestamps: saved.timestamps || [],
        };
        this.cleanupOldTimestamps();
      }
    } catch (error) {
      console.error("Failed to load match history from storage:", error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
      localStorage.setItem(
        STORAGE_KEYS.RATE_LIMIT,
        JSON.stringify(this.rateLimitState)
      );
    } catch (error) {
      console.error("Failed to save match history to storage:", error);
    }
  }

  private cleanupOldTimestamps(): void {
    const now = Date.now();
    const cutoff = now - RATE_LIMIT_CONFIG.WINDOW_MS;
    this.rateLimitState.timestamps = this.rateLimitState.timestamps.filter(
      (ts) => ts > cutoff
    );
  }

  private recalculateAvailableRequests(): void {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimitState.lastRequestTime;
    const intervalsElapsed = Math.floor(
      timeSinceLastRequest / RATE_LIMIT_CONFIG.RESTORE_INTERVAL_MS
    );

    if (intervalsElapsed > 0) {
      this.rateLimitState.availableRequests = Math.min(
        this.rateLimitState.availableRequests + intervalsElapsed,
        RATE_LIMIT_CONFIG.MAX_REQUESTS
      );
      this.rateLimitState.lastRequestTime =
        this.rateLimitState.lastRequestTime +
        intervalsElapsed * RATE_LIMIT_CONFIG.RESTORE_INTERVAL_MS;
      this.saveToStorage();
    }
  }

  private startRestoreInterval(): void {
    this.restoreInterval = setInterval(() => {
      this.recalculateAvailableRequests();
    }, RATE_LIMIT_CONFIG.RESTORE_INTERVAL_MS);
  }

  stopRestoreInterval(): void {
    if (this.restoreInterval) {
      clearInterval(this.restoreInterval);
      this.restoreInterval = null;
    }
  }

  addToHistory(matchId: string): void {
    const existing = this.history.find((entry) => entry.matchId === matchId);
    if (existing) {
      existing.timestamp = Date.now();
    } else {
      this.history.unshift({
        matchId,
        timestamp: Date.now(),
      });
    }

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveToStorage();
  }

  getHistory(): MatchHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  removeFromHistory(matchId: string): void {
    this.history = this.history.filter((entry) => entry.matchId !== matchId);
    this.saveToStorage();
  }

  isMatchInHistory(matchId: string): boolean {
    return this.history.some((entry) => entry.matchId === matchId);
  }

  consumeRequest(matchId: string): boolean {
    if (this.attemptedMatches.has(matchId)) {
      return true;
    }

    this.recalculateAvailableRequests();

    if (this.rateLimitState.availableRequests <= 0) {
      return false;
    }

    this.rateLimitState.availableRequests -= 1;
    this.rateLimitState.lastRequestTime = Date.now();
    this.rateLimitState.timestamps.push(Date.now());
    this.attemptedMatches.add(matchId);
    this.saveToStorage();
    this.saveAttemptedMatches();
    return true;
  }

  getAvailableRequests(): number {
    this.recalculateAvailableRequests();
    this.cleanupOldTimestamps();
    return this.rateLimitState.availableRequests;
  }

  getRemainingTime(): number {
    if (
      this.rateLimitState.availableRequests >= RATE_LIMIT_CONFIG.MAX_REQUESTS
    ) {
      return 0;
    }
    return RATE_LIMIT_CONFIG.RESTORE_INTERVAL_MS;
  }

  canMakeRequest(matchId: string): boolean {
    return (
      this.attemptedMatches.has(matchId) ||
      this.rateLimitState.availableRequests > 0
    );
  }
}

export const MatchHistoryService = new MatchHistoryServiceClass();
