/**
 * Service for interacting with Deadlock Player Data API
 * Documentation: https://api.deadlock-api.com/docs
 */

import {
  PLAYER_DATA_API_BASE_URL,
  TWO_WEEKS_IN_SECONDS,
  MATCH_METADATA_DELAY_MS,
} from "../constants/apiConstants";
import { PLAYER_TAG_THRESHOLDS } from "../constants/playerTagConstants";

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
  match_id: number;
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
  recentMatchHistory: MatchHistoryItem[];
}

// === Match Metadata Interfaces ===

export interface CustomUserStat {
  id: number;
  value: number;
}

export interface PlayerMatchStats {
  account_id: number;
  stats: Array<{
    custom_user_stats?: CustomUserStat[];
  }>;
}

export interface MatchMetadata {
  match_info: {
    players: PlayerMatchStats[];
  };
}

// === Player Tag Interfaces ===

export interface PlayerTag {
  type: "smurf" | "loser" | "spammer" | "cheater";
  value?: number; // Main value for tooltip
  totalValue?: number; // Additional value for smurf (total winrate)
  recentValue?: number; // Additional value for smurf/loser (recent winrate)
}

// === Player Relation Interfaces ===

export interface MateStats {
  mate_id: number;
  wins: number;
  matches: number[];
}

export interface EnemyStats {
  enemy_id: number;
  wins: number;
  matches: number[];
}

export interface PlayerRelationStats {
  withPlayer: {
    games: number;
    wins: number;
    losses: number;
  };
  againstPlayer: {
    games: number;
    wins: number;
    losses: number;
  };
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
        recentMatchHistory: [],
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
        recentMatchHistory: [],
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
      recentMatchHistory: recentMatches,
    };
  }

  /**
   * Fetch mate stats for a player (games played together on the same team)
   * @param accountId - Current user's account ID
   * @returns Array of mate statistics
   */
  static async fetchMateStats(accountId: number): Promise<MateStats[]> {
    try {
      const url = `${BASE_URL}/v1/players/${accountId}/mate-stats?same_party=false`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch enemy stats for a player (games played against)
   * @param accountId - Current user's account ID
   * @returns Array of enemy statistics
   */
  static async fetchEnemyStats(accountId: number): Promise<EnemyStats[]> {
    try {
      const url = `${BASE_URL}/v1/players/${accountId}/enemy-stats`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get relation stats for a specific player
   * @param currentUserAccountId - Current user's account ID
   * @param targetAccountId - Target player's account ID
   * @returns Relation statistics (with/against player)
   */
  static async fetchPlayerRelationStats(
    currentUserAccountId: number,
    targetAccountId: number
  ): Promise<PlayerRelationStats> {
    try {
      const [mateStats, enemyStats] = await Promise.all([
        this.fetchMateStats(currentUserAccountId),
        this.fetchEnemyStats(currentUserAccountId),
      ]);

      const mateData = mateStats.find((m) => m.mate_id === targetAccountId);
      const enemyData = enemyStats.find((e) => e.enemy_id === targetAccountId);

      return {
        withPlayer: mateData
          ? {
              games: mateData.matches.length,
              wins: mateData.wins,
              losses: mateData.matches.length - mateData.wins,
            }
          : { games: 0, wins: 0, losses: 0 },
        againstPlayer: enemyData
          ? {
              games: enemyData.matches.length,
              wins: enemyData.wins,
              losses: enemyData.matches.length - enemyData.wins,
            }
          : { games: 0, wins: 0, losses: 0 },
      };
    } catch (error) {
      return {
        withPlayer: { games: 0, wins: 0, losses: 0 },
        againstPlayer: { games: 0, wins: 0, losses: 0 },
      };
    }
  }

  /**
   * Fetch relation stats for multiple players at once
   * @param currentUserAccountId - Current user's account ID
   * @param targetAccountIds - Array of target player account IDs
   * @returns Map of account_id to PlayerRelationStats
   */
  static async fetchPlayerRelationStatsMap(
    currentUserAccountId: number,
    targetAccountIds: number[]
  ): Promise<Map<number, PlayerRelationStats>> {
    try {
      const [mateStats, enemyStats] = await Promise.all([
        this.fetchMateStats(currentUserAccountId),
        this.fetchEnemyStats(currentUserAccountId),
      ]);

      const relationMap = new Map<number, PlayerRelationStats>();

      targetAccountIds.forEach((targetId) => {
        if (targetId === currentUserAccountId) {
          return;
        }

        const mateData = mateStats.find((m) => m.mate_id === targetId);
        const enemyData = enemyStats.find((e) => e.enemy_id === targetId);

        relationMap.set(targetId, {
          withPlayer: mateData
            ? {
                games: mateData.matches.length,
                wins: mateData.wins,
                losses: mateData.matches.length - mateData.wins,
              }
            : { games: 0, wins: 0, losses: 0 },
          againstPlayer: enemyData
            ? {
                games: enemyData.matches.length,
                wins: enemyData.wins,
                losses: enemyData.matches.length - enemyData.wins,
              }
            : { games: 0, wins: 0, losses: 0 },
        });
      });

      return relationMap;
    } catch (error) {
      return new Map();
    }
  }

  /**
   * Fetch match metadata for detailed stats
   * @param matchId - Match ID to fetch metadata for
   * @returns Match metadata or null if fetch fails
   */
  private static async fetchMatchMetadata(
    matchId: number
  ): Promise<MatchMetadata | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/matches/${matchId}/metadata?is_custom=false`
      );

      if (!response.ok) {
        if (response.status === 400) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if player is a cheater based on headshot rate analysis
   * @param matchHistory - Array of last 5 matches with match_id and account_id
   * @returns Average headshot percentage or null
   */
  private static async checkCheaterStatus(
    matchHistory: MatchHistoryItem[],
    accountId: number
  ): Promise<number | null> {
    try {
      const { CHEATER_MATCHES_COUNT } = PLAYER_TAG_THRESHOLDS;

      if (matchHistory.length < CHEATER_MATCHES_COUNT) {
        return null;
      }

      const recentMatches = matchHistory.slice(0, CHEATER_MATCHES_COUNT);
      let totalHeadshotRate = 0;
      let validMatches = 0;

      for (const match of recentMatches) {
        const metadata = await this.fetchMatchMetadata(match.match_id);

        if (metadata?.match_info?.players) {
          const player = metadata.match_info.players.find(
            (p) => p.account_id === accountId
          );

          if (player?.stats && player.stats.length > 0) {
            const lastStats = player.stats[player.stats.length - 1];

            if (lastStats.custom_user_stats) {
              const headshotStat = lastStats.custom_user_stats.find(
                (stat) => stat.id === 13
              );

              if (headshotStat && headshotStat.value !== undefined) {
                totalHeadshotRate += headshotStat.value;
                validMatches++;
              }
            }
          }
        }

        await new Promise((resolve) =>
          setTimeout(resolve, MATCH_METADATA_DELAY_MS)
        );
      }

      if (validMatches >= 3) {
        return totalHeadshotRate / validMatches;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine player tags based on match statistics
   * @param matchStats - Player's match statistics
   * @param currentHeroId - Hero ID the player is currently using
   * @returns Array of player tags
   */
  static async determinePlayerTags(
    matchStats: MatchStats,
    currentHeroId: number,
    accountId: number
  ): Promise<PlayerTag[]> {
    const tags: PlayerTag[] = [];

    if (!matchStats || matchStats.totalMatches === 0) {
      return tags;
    }

    const {
      SMURF_WINRATE,
      SMURF_MIN_MATCHES,
      LOSER_WINRATE,
      SPAMMER_HERO_RATE,
      LOSER_MIN_MATCHES,
    } = PLAYER_TAG_THRESHOLDS;

    // Check for smurf: high winrate both all-time and last 14 days with minimum matches
    if (
      matchStats.totalMatches >= SMURF_MIN_MATCHES &&
      matchStats.totalWinrate >= SMURF_WINRATE &&
      matchStats.recentWinrate >= SMURF_WINRATE
    ) {
      tags.push({
        type: "smurf",
        totalValue: matchStats.totalWinrate,
        recentValue: matchStats.recentWinrate,
      });
    }

    // Check for loser: low winrate in last 14 days with minimum matches
    if (
      matchStats.recentMatches >= LOSER_MIN_MATCHES &&
      matchStats.recentWinrate <= LOSER_WINRATE
    ) {
      tags.push({ type: "loser", recentValue: matchStats.recentWinrate });
    }

    // Check for spammer: frequently plays current hero in last 14 days
    if (currentHeroId && matchStats.recentMatchHistory.length > 0) {
      const heroMatches = matchStats.recentMatchHistory.filter(
        (match) => match.hero_id === currentHeroId
      ).length;
      const heroRate =
        (heroMatches / matchStats.recentMatchHistory.length) * 100;

      if (heroRate >= SPAMMER_HERO_RATE) {
        tags.push({ type: "spammer", value: Math.round(heroRate) });
      }
    }

    // Check for cheater: high headshot rate in last 5 matches
    if (
      matchStats.last5Matches.length >=
      PLAYER_TAG_THRESHOLDS.CHEATER_MATCHES_COUNT
    ) {
      const headshotRate = await this.checkCheaterStatus(
        matchStats.last5Matches,
        accountId
      );
      if (
        headshotRate !== null &&
        headshotRate >= PLAYER_TAG_THRESHOLDS.CHEATER_HEADSHOT_RATE
      ) {
        tags.push({ type: "cheater", value: Math.round(headshotRate) });
      }
    }

    return tags;
  }
}
