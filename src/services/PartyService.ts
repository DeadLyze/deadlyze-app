/**
 * Service for detecting and managing party groups in active matches
 * Uses mate-stats API endpoint to identify teammates playing together
 */

import { MatchPlayer } from "./MatchService";
import {
  PLAYER_DATA_API_BASE_URL,
  PLAYER_MATE_STATS_DELAY_MS,
  PARTY_DETECTION_SECONDS,
} from "../constants/apiConstants";
import { PARTY_COLORS } from "../constants/uiConstants";

const BASE_URL = PLAYER_DATA_API_BASE_URL;

export interface PartyGroup {
  members: number[]; // Array of account_ids in this party
  color: string; // Color for visual representation
  partyId: string; // Unique identifier for this party
}

interface MateStatsResponse {
  mate_id: number;
  matches_played: number;
  matches: number[];
  wins: number;
}

export class PartyService {
  /**
   * Fetch mate stats for a player within recent time window (3 days)
   */
  private static async fetchPlayerMateStats(
    accountId: number
  ): Promise<MateStatsResponse[]> {
    try {
      const minTimestamp =
        Math.floor(Date.now() / 1000) - PARTY_DETECTION_SECONDS;

      const response = await fetch(
        `${BASE_URL}/v1/players/${accountId}/mate-stats?min_unix_timestamp=${minTimestamp}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(
        `Failed to fetch mate stats for player ${accountId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Detect party groups in the match
   * Algorithm:
   * 1. Fetch mate stats for all 12 players (3 day window)
   * 2. For each team, find mutual mate connections
   * 3. Group players who are mutual mates together
   * 4. Assign levels and colors based on discovery order
   */
  static async detectPartyGroups(
    players: MatchPlayer[]
  ): Promise<PartyGroup[]> {
    try {
      const partyGroups: PartyGroup[] = [];

      // Separate players by team (team 2 = amber, team 3 = sapphire)
      const team2Players = players.filter((p) => p.team === 2);
      const team3Players = players.filter((p) => p.team === 3);

      // Process each team separately with team-specific color offsets
      const teams = [
        { players: team2Players, colorOffset: 0 }, // Amber team uses colors 0-2 (gold)
        { players: team3Players, colorOffset: 3 }, // Sapphire team uses colors 3-5 (teal)
      ];

      for (const { players: teamPlayers, colorOffset } of teams) {
        let teamColorIndex = 0;
        const processedPlayers = new Set<number>();

        // Fetch mate stats for all players in parallel with small delays
        const mateStatsMap = new Map<number, Set<number>>();

        for (let i = 0; i < teamPlayers.length; i++) {
          const player = teamPlayers[i];

          // Add small delay between requests to avoid overwhelming API
          if (i > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, PLAYER_MATE_STATS_DELAY_MS)
            );
          }

          const mateStats = await this.fetchPlayerMateStats(player.account_id);

          // Store all mate_ids for this player
          const mateIds = new Set<number>();
          mateStats.forEach((mate) => {
            mateIds.add(mate.mate_id);
          });

          mateStatsMap.set(player.account_id, mateIds);
        }

        // Find mutual connections (players who are mates with each other)
        for (const player of teamPlayers) {
          if (processedPlayers.has(player.account_id)) {
            continue;
          }

          const partyMembers = [player.account_id];
          const playerMates = mateStatsMap.get(player.account_id) || new Set();

          // Check each teammate to see if they're mutual mates
          for (const teammate of teamPlayers) {
            if (
              teammate.account_id === player.account_id ||
              processedPlayers.has(teammate.account_id)
            ) {
              continue;
            }

            const teammateMates =
              mateStatsMap.get(teammate.account_id) || new Set();

            // Mutual connection: player has teammate in their mates AND teammate has player in their mates
            if (
              playerMates.has(teammate.account_id) &&
              teammateMates.has(player.account_id)
            ) {
              partyMembers.push(teammate.account_id);
            }
          }

          // If we found a party (at least 2 members), create a party group
          if (partyMembers.length >= 2) {
            const partyGroup: PartyGroup = {
              members: partyMembers,
              color:
                PARTY_COLORS[
                  (colorOffset + teamColorIndex) % PARTY_COLORS.length
                ],
              partyId: `party-${colorOffset + teamColorIndex}`,
            };

            partyGroups.push(partyGroup);
            teamColorIndex++;

            // Mark all members as processed
            partyMembers.forEach((id) => processedPlayers.add(id));
          } else {
            // Mark solo player as processed
            processedPlayers.add(player.account_id);
          }
        }
      }

      return partyGroups;
    } catch (error) {
      console.error("Failed to detect party groups:", error);
      return [];
    }
  }
}
