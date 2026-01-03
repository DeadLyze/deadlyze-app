/**
 * Constants for player tag determination
 */

export const PLAYER_TAG_THRESHOLDS = {
  SMURF_WINRATE: 65, // Winrate percentage for smurf tag
  SMURF_MIN_MATCHES: 20, // Minimum total matches for smurf tag
  LOSER_WINRATE: 40, // Winrate percentage for loser tag
  SPAMMER_HERO_RATE: 37, // Percentage of games on same hero for spammer tag
  CHEATER_HEADSHOT_RATE: 30, // Headshot percentage for cheater tag
  CHEATER_MATCHES_COUNT: 5, // Number of matches to analyze for cheating
  LOSER_MIN_MATCHES: 5, // Minimum matches in last 14 days for loser tag
} as const;

export const PLAYER_TAG_COLORS = {
  SMURF: "#21C271",
  LOSER: "#9FA6AD",
  SPAMMER: "#e6ca9c",
  CHEATER: "#c83c3c",
} as const;

export type PlayerTagType = "smurf" | "loser" | "spammer" | "cheater";
