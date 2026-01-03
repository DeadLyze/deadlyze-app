/**
 * UI constants for ActiveMatchPage components
 */

// Column widths (in pixels)
export const COLUMN_WIDTH = {
  HERO: 50,
  RANK: 75,
  PLAYER: 150,
  MATCHES: 120,
  CURRENT_HERO: 120,
  RECENT_MATCHES: 250,
  RELATION: 110,
  TAGS: 55,
  CURRENT_STREAK: 120,
  AVERAGE_STATS: 140,
} as const;

// Table styling
export const TABLE_HEADER_HEIGHT = 50;
export const TABLE_ROW_HEIGHT = 52;
export const PARTY_BRACKET_WIDTH = 60;
export const TABLE_GAP = 10;

// Colors
export const COLORS = {
  BACKGROUND_DARK: "#174842",
  TEXT_PRIMARY: "#FFFFFF",
  TEXT_SECONDARY: "#9FA6AD",
  ACCENT_GREEN: "#21C271",
  GOLD: "#e6ca9c",
  WIN_GREEN: "#2d5a3f",
  LOSS_RED: "#5a2d2d",
} as const;

// Match result colors (for recent matches indicator)
export const MATCH_RESULT_COLORS = {
  WIN_BAR: "rgba(39, 201, 133, 0.9)",
  WIN_GLOW: "rgba(45, 200, 100, 0.4)",
  LOSS_BAR: "rgba(228, 69, 69, 0.9)",
  LOSS_GLOW: "rgba(200, 60, 60, 0.4)",
} as const;

// Player stats colors
export const STATS_COLORS = {
  WIN: "#2dc864",
  LOSS: "#c83c3c",
  NEUTRAL: "#e6ca9c",
} as const;

// Retry timing
export const ASSET_RETRY_DELAY_MS = 1000;

// Party brackets display
export const PARTY_DISPLAY = {
  BRACKET_WIDTH: 60, // Width of party brackets container
  ROW_HEIGHT: 50, // Height of each table row (matches TeamTable row height)
  LINE_THICKNESS: 2, // Thickness of bracket lines
  HORIZONTAL_LINE_BASE_LENGTH: 13, // Base length for horizontal lines (increased by 2px)
  VERTICAL_LINE_SPACING: 12, // Spacing for vertical line positioning
  MIN_PARTY_SIZE: 2, // Minimum players to show party bracket
  MAX_PARTIES: 6, // Maximum number of different party colors
} as const;

// Party bracket colors (soft pastel tones matching app style)
export const PARTY_COLORS = [
  "#f0c080", // Light gold - for amber team (team 2)
  "#f0c080", // Medium gold - for amber team (team 2)
  "#f0c080", // Deep gold - for amber team (team 2)
  "#64dfb4ff", // Light teal - for sapphire team (team 3)
  "#64dfb4ff", // Medium teal - for sapphire team (team 3)
  "#64dfb4ff", // Deep teal - for sapphire team (team 3)
] as const;
