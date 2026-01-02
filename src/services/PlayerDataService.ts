/**
 * Service for interacting with Deadlock Player Data API
 * Documentation: https://api.deadlock-api.com/docs
 */

const BASE_URL = "https://api.deadlock-api.com";

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

      console.log(`Fetching MMR for ${accountIds.length} players...`);

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
      console.log(`MMR data received for ${mmrData.length} players`);
      return mmrData;
    } catch (error) {
      console.error("Failed to fetch player MMR:", error);
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
      console.error(`Failed to fetch MMR for player ${accountId}:`, error);
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
      console.error("Failed to create MMR map:", error);
      return new Map();
    }
  }
}
