/**
 * Service for interacting with Deadlock Player Data API
 * Documentation: https://api.deadlock-api.com/docs
 */

import {
  PLAYER_DATA_API_BASE_URL,
  TWO_WEEKS_IN_SECONDS,
} from "../constants/apiConstants";

const BASE_URL = PLAYER_DATA_API_BASE_URL;

// === Player MMR Interfaces ===

export interface PlayerMMR {
  account_id: number;
  division: number;
  division_tier: number;
  match_id: number;
  player_score: number;
  rank: number;
  start_time: number;
}

// === Match History Interfaces ===

export interface MatchHistoryItem {
  match_result: number;
  player_team: number;
  start_time: number;
  hero_id: number;
}

export interface MatchStats {
  totalMatches: number;
  totalWins: number;
  totalWinrate: number;
  recentMatches: number;
  recentWins: number;
  recentWinrate: number;
  last5Matches: MatchHistoryItem[];
}

/**
 * Service for fetching Deadlock player data (MMR, stats, etc.)
 */
export class PlayerDataService {
  /**
   * Fetch MMR data for multiple players
   * @param accountIds - Array of player account IDs
   * @returns Array of player MMR data
   */
  static async fetchPlayerMMR(accountIds: number[]): Promise<PlayerMMR[]> {
    try {
      const accountIdsStr = accountIds.join(",");
      const url = `${BASE_URL}/v1/players/mmr?account_ids=${accountIdsStr}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const mmrData: PlayerMMR[] = await response.json();
      return mmrData;
    } catch (error) {
      throw new Error(
        typeof error === "string" ? error : "Failed to fetch player MMR data"
      );
    }
  }

  /**
   * Get MMR data for a single player
   * @param accountId - Player account ID
   * @returns Player MMR data or null if not found
   */
  static async fetchSinglePlayerMMR(
    accountId: number
  ): Promise<PlayerMMR | null> {
    try {
      const mmrData = await this.fetchPlayerMMR([accountId]);
      return mmrData.find((mmr) => mmr.account_id === accountId) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a map of account_id to MMR data for quick lookup
   * @param accountIds - Array of player account IDs
   * @returns Map of account_id to PlayerMMR
   */
  static async fetchPlayerMMRMap(
    accountIds: number[]
  ): Promise<Map<number, PlayerMMR>> {
    try {
      const mmrData = await this.fetchPlayerMMR(accountIds);
      const mmrMap = new Map<number, PlayerMMR>();

      mmrData.forEach((mmr) => {
        mmrMap.set(mmr.account_id, mmr);
      });

      return mmrMap;
    } catch (error) {
      return new Map();
    }
  }

  /**
   * Fetch match history for a player and calculate statistics
   * @param accountId - Player account ID
   * @returns Match statistics (total and last 14 days)
   */
  static async fetchPlayerMatchStats(accountId: number): Promise<MatchStats> {
    try {
      const url = `${BASE_URL}/v1/players/${accountId}/match-history?only_stored_history=true`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const matchHistory: MatchHistoryItem[] = await response.json();
      return this.calculateMatchStats(matchHistory);
    } catch (error) {
      return {
        totalMatches: 0,
        totalWins: 0,
        totalWinrate: 0,
        recentMatches: 0,
        recentWins: 0,
        recentWinrate: 0,
        last5Matches: [],
      };
    }
  }

  /**
   * Calculate match statistics from match history
   * @param matchHistory - Array of match history items
   * @returns Match statistics (total and last 14 days)
   */
  static calculateMatchStats(matchHistory: MatchHistoryItem[]): MatchStats {
    if (!matchHistory || matchHistory.length === 0) {
      return {
        totalMatches: 0,
        totalWins: 0,
        totalWinrate: 0,
        recentMatches: 0,
        recentWins: 0,
        recentWinrate: 0,
        last5Matches: [],
      };
    }

    // Sort by start_time descending (most recent first)
    const sortedHistory = [...matchHistory].sort(
      (a, b) => b.start_time - a.start_time
    );

    // Get last 5 matches
    const last5Matches = sortedHistory.slice(0, 5);

    // Calculate all time stats
    const totalMatches = matchHistory.length;
    const totalWins = matchHistory.filter(
      (match) => match.match_result === match.player_team
    ).length;
    const totalWinrate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    // Calculate last 14 days stats
    const currentTime = Math.floor(Date.now() / 1000);
    const twoWeeksAgo = currentTime - TWO_WEEKS_IN_SECONDS;

    const recentMatches = matchHistory.filter(
      (match) => match.start_time >= twoWeeksAgo
    );
    const recentWins = recentMatches.filter(
      (match) => match.match_result === match.player_team
    ).length;
    const recentWinrate =
      recentMatches.length > 0
        ? Math.round((recentWins / recentMatches.length) * 100)
        : 0;

    return {
      totalMatches,
      totalWins,
      totalWinrate,
      recentMatches: recentMatches.length,
      recentWins,
      recentWinrate,
      last5Matches,
    };
  }
}
