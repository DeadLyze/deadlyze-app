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
  player_kills?: number;
  player_deaths?: number;
  player_assists?: number;
  last_hits?: number;
  denies?: number;
  net_worth?: number;
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
  currentHeroStats: {
    heroId: number;
    matches: number;
    wins: number;
    winrate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    kd: number;
  } | null;
  currentStreak: number;
  currentHeroStreak: number | null;
  avgLastHits: number;
  avgDenies: number;
  avgNetWorth: number;
}

// === Match Metadata Interfaces ===

export interface ItemEvent {
  item_id: number;
  game_time_s: number;
  sold_time_s: number;
}

export interface CustomUserStat {
  id: number;
  value: number;
}

export interface PlayerStatsSnapshot {
  time_stamp_s: number;
  net_worth: number;
  kills: number;
  deaths: number;
  assists: number;
  player_damage: number;
  player_healing: number;
  custom_user_stats?: CustomUserStat[];
}

export interface DetailedPlayerStats {
  account_id: number;
  items?: ItemEvent[];
  stats?: PlayerStatsSnapshot[];
}

export interface DetailedMatchMetadata {
  match_info: {
    duration_s: number;
    players: DetailedPlayerStats[];
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
   * @param currentHeroId - Current hero ID for calculating hero-specific stats
   * @returns Match statistics (total and last 14 days)
   */
  static async fetchPlayerMatchStats(
    accountId: number,
    currentHeroId?: number
  ): Promise<MatchStats> {
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
      return this.calculateMatchStats(matchHistory, currentHeroId);
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
        currentHeroStats: null,
        currentStreak: 0,
        currentHeroStreak: null,
        avgLastHits: 0,
        avgDenies: 0,
        avgNetWorth: 0,
      };
    }
  }

  /**
   * Calculate match statistics from match history
   * @param matchHistory - Array of match history items
   * @param currentHeroId - Current hero ID for calculating hero-specific stats
   * @returns Match statistics (total and last 14 days)
   */
  static calculateMatchStats(
    matchHistory: MatchHistoryItem[],
    currentHeroId?: number
  ): MatchStats {
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
        currentHeroStats: null,
        currentStreak: 0,
        currentHeroStreak: null,
        avgLastHits: 0,
        avgDenies: 0,
        avgNetWorth: 0,
      };
    }

    // Sort by start_time descending (most recent first)
    const sortedHistory = [...matchHistory].sort(
      (a, b) => b.start_time - a.start_time
    );

    // Get last 5 matches
    const last5Matches = sortedHistory.slice(0, 5);

    // Calculate stats in single pass (O(n) instead of O(2n))
    const currentTime = Math.floor(Date.now() / 1000);
    const twoWeeksAgo = currentTime - TWO_WEEKS_IN_SECONDS;

    let totalMatches = 0;
    let totalWins = 0;
    let recentMatchCount = 0;
    let recentWins = 0;
    const recentMatchHistory: MatchHistoryItem[] = [];

    // Hero-specific stats
    let heroMatches = 0;
    let heroWins = 0;
    let heroTotalKills = 0;
    let heroTotalDeaths = 0;
    let heroTotalAssists = 0;

    // Average stats
    let totalLastHits = 0;
    let totalDenies = 0;
    let totalNetWorth = 0;
    let validMatchesForAvg = 0;

    for (const match of matchHistory) {
      const isWin = match.match_result === match.player_team;
      const isRecent = match.start_time >= twoWeeksAgo;
      const isCurrentHero =
        currentHeroId !== undefined && match.hero_id === currentHeroId;

      // Total stats
      totalMatches++;
      if (isWin) totalWins++;

      // Recent stats
      if (isRecent) {
        recentMatchCount++;
        if (isWin) recentWins++;
        recentMatchHistory.push(match);
      }

      // Current hero stats
      if (isCurrentHero) {
        heroMatches++;
        if (isWin) heroWins++;
        if (match.player_kills !== undefined)
          heroTotalKills += match.player_kills;
        if (match.player_deaths !== undefined)
          heroTotalDeaths += match.player_deaths;
        if (match.player_assists !== undefined)
          heroTotalAssists += match.player_assists;
      }

      // Average stats (last_hits, denies, net_worth)
      if (
        match.last_hits !== undefined &&
        match.denies !== undefined &&
        match.net_worth !== undefined
      ) {
        totalLastHits += match.last_hits;
        totalDenies += match.denies;
        totalNetWorth += match.net_worth;
        validMatchesForAvg++;
      }
    }

    const totalWinrate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
    const recentWinrate =
      recentMatchCount > 0
        ? Math.round((recentWins / recentMatchCount) * 100)
        : 0;

    // Calculate hero-specific stats
    let currentHeroStats = null;
    if (currentHeroId !== undefined && heroMatches > 0) {
      const avgKills = Math.round((heroTotalKills / heroMatches) * 10) / 10;
      const avgDeaths = Math.round((heroTotalDeaths / heroMatches) * 10) / 10;
      const avgAssists = Math.round((heroTotalAssists / heroMatches) * 10) / 10;
      const kd =
        avgDeaths > 0
          ? Math.round((avgKills / avgDeaths) * 100) / 100
          : avgKills;

      currentHeroStats = {
        heroId: currentHeroId,
        matches: heroMatches,
        wins: heroWins,
        winrate: Math.round((heroWins / heroMatches) * 100),
        avgKills,
        avgDeaths,
        avgAssists,
        kd,
      };
    }

    return {
      totalMatches,
      totalWins,
      totalWinrate,
      recentMatches: recentMatchCount,
      recentWins,
      recentWinrate,
      last5Matches,
      recentMatchHistory,
      currentHeroStats,
      currentStreak: this.calculateStreak(sortedHistory),
      currentHeroStreak:
        currentHeroId !== undefined && heroMatches > 0
          ? this.calculateHeroStreak(sortedHistory, currentHeroId)
          : null,
      avgLastHits:
        validMatchesForAvg > 0
          ? Math.round(totalLastHits / validMatchesForAvg)
          : 0,
      avgDenies:
        validMatchesForAvg > 0
          ? Math.round(totalDenies / validMatchesForAvg)
          : 0,
      avgNetWorth:
        validMatchesForAvg > 0
          ? Math.round(totalNetWorth / validMatchesForAvg)
          : 0,
    };
  }

  /**
   * Calculate current win/loss streak from match history
   * @param sortedHistory - Match history sorted by start_time descending (most recent first)
   * @returns Positive number for win streak, negative for loss streak
   */
  private static calculateStreak(sortedHistory: MatchHistoryItem[]): number {
    if (sortedHistory.length === 0) return 0;

    const lastMatch = sortedHistory[0];
    const lastResult = lastMatch.match_result === lastMatch.player_team;

    let streak = 0;
    for (const match of sortedHistory) {
      const isWin = match.match_result === match.player_team;
      if (isWin === lastResult) {
        streak++;
      } else {
        break;
      }
    }

    return lastResult ? streak : -streak;
  }

  /**
   * Calculate current win/loss streak on specific hero
   * @param sortedHistory - Match history sorted by start_time descending (most recent first)
   * @param heroId - Hero ID to filter matches
   * @returns Positive number for win streak, negative for loss streak, null if no matches
   */
  private static calculateHeroStreak(
    sortedHistory: MatchHistoryItem[],
    heroId: number
  ): number | null {
    const heroMatches = sortedHistory.filter((m) => m.hero_id === heroId);
    if (heroMatches.length === 0) return null;

    const lastMatch = heroMatches[0];
    const lastResult = lastMatch.match_result === lastMatch.player_team;

    let streak = 0;
    for (const match of heroMatches) {
      const isWin = match.match_result === match.player_team;
      if (isWin === lastResult) {
        streak++;
      } else {
        break;
      }
    }

    return lastResult ? streak : -streak;
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
  ): Promise<DetailedMatchMetadata | null> {
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
   * Fetch detailed match metadata with items
   * @param matchId - Match ID to fetch metadata for
   * @returns Detailed match metadata or null if fetch fails
   */
  static async fetchDetailedMatchMetadata(
    matchId: number
  ): Promise<DetailedMatchMetadata | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/v1/matches/${matchId}/metadata?is_custom=false`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("TOO_MANY_REQUESTS");
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === "TOO_MANY_REQUESTS") {
        throw error;
      }
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
            (p: DetailedPlayerStats) => p.account_id === accountId
          );

          if (player?.stats && player.stats.length > 0) {
            const lastStats = player.stats[player.stats.length - 1];

            if (lastStats.custom_user_stats) {
              const headshotStat = lastStats.custom_user_stats.find(
                (stat: { id: number; value?: number }) => stat.id === 13
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
