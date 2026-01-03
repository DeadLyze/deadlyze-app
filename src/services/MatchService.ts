import { invoke } from "@tauri-apps/api/core";

export interface MatchPlayer {
  account_id: number;
  steam_name: string;
  player_slot: number;
  team: number;
  hero_id: number;
}

export interface MatchData {
  match_id?: number;
  amber_team: MatchPlayer[];
  sapphire_team: MatchPlayer[];
}

/**
 * Service for fetching live match data
 */
export class MatchService {
  /**
   * Fetch live match data by match ID
   * @param matchId - 8-digit match ID
   * @returns Match data with both teams
   */
  static async fetchMatchData(matchId: string): Promise<MatchData> {
    try {
      const matchData = await invoke<MatchData>("fetch_match_data", {
        matchId,
      });
      return matchData;
    } catch (error) {
      throw new Error(
        typeof error === "string"
          ? error
          : "Failed to fetch match data. Please try again."
      );
    }
  }

  /**
   * Validate match ID format (8 digits)
   */
  static isValidMatchId(matchId: string): boolean {
    return /^\d{8}$/.test(matchId);
  }
}
