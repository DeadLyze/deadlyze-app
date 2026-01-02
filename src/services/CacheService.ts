/**
 * Centralized cache service for application data
 */

export interface SteamData {
  steamId64: string | null;
  accountId: number | null;
  personaName: string | null;
  installPath: string | null;
  isInstalled: boolean;
  isRunning: boolean;
  lastUpdated: number;
}

export interface UserData {
  steamId64: string | null;
  accountId: number | null;
  personaName: string | null;
  lastUpdated: number;
}

export interface AppCache {
  currentUser: UserData;
  steam: SteamData;
}

const CACHE_KEY = "deadlyze_app_cache";

const DEFAULT_CACHE: AppCache = {
  currentUser: {
    steamId64: null,
    accountId: null,
    personaName: null,
    lastUpdated: 0,
  },
  steam: {
    steamId64: null,
    accountId: null,
    personaName: null,
    installPath: null,
    isInstalled: false,
    isRunning: false,
    lastUpdated: 0,
  },
};

export class CacheService {
  private static cache: AppCache = { ...DEFAULT_CACHE };
  private static initialized = false;

  /**
   * Initialize cache from localStorage
   */
  static init(): void {
    if (this.initialized) {
      return;
    }

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = {
          ...DEFAULT_CACHE,
          ...parsed,
          currentUser: {
            ...DEFAULT_CACHE.currentUser,
            ...parsed.currentUser,
          },
          steam: {
            ...DEFAULT_CACHE.steam,
            ...parsed.steam,
          },
        };
      }
    } catch (error) {
      console.error("Failed to load cache from localStorage:", error);
      this.cache = { ...DEFAULT_CACHE };
    }

    this.initialized = true;
  }

  /**
   * Save cache to localStorage
   */
  private static save(): void {
    try {
      const cacheString = JSON.stringify(this.cache);
      localStorage.setItem(CACHE_KEY, cacheString);
    } catch (error) {
      console.error("Failed to save cache to localStorage:", error);
    }
  }

  /**
   * Get current user data
   */
  static getCurrentUser(): UserData {
    this.init();
    return { ...this.cache.currentUser };
  }

  /**
   * Update current user data
   */
  static updateCurrentUser(userData: Partial<UserData>): void {
    this.init();
    this.cache.currentUser = {
      ...this.cache.currentUser,
      ...userData,
      lastUpdated: Date.now(),
    };
    this.save();
  }

  /**
   * Get Steam data
   */
  static getSteamData(): SteamData {
    this.init();
    return { ...this.cache.steam };
  }

  /**
   * Update Steam data
   */
  static updateSteamData(steamData: Partial<SteamData>): void {
    this.init();
    this.cache.steam = {
      ...this.cache.steam,
      ...steamData,
      lastUpdated: Date.now(),
    };
    this.save();
  }

  /**
   * Get full cache
   */
  static getCache(): AppCache {
    this.init();
    return {
      currentUser: { ...this.cache.currentUser },
      steam: { ...this.cache.steam },
    };
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache = { ...DEFAULT_CACHE };
    this.save();
  }

  /**
   * Clear user data only
   */
  static clearUserData(): void {
    this.cache.currentUser = { ...DEFAULT_CACHE.currentUser };
    this.save();
  }

  /**
   * Clear Steam data only
   */
  static clearSteamData(): void {
    this.cache.steam = { ...DEFAULT_CACHE.steam };
    this.save();
  }
}
