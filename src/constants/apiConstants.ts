/**
 * API constants for Deadlock services
 */

// Base URLs
export const ASSETS_API_BASE_URL = "https://assets.deadlock-api.com";
export const PLAYER_DATA_API_BASE_URL = "https://api.deadlock-api.com";

// Rate limiting
export const HERO_FETCH_DELAY_MS = 1;
export const MATCH_METADATA_DELAY_MS = 1;
export const PLAYER_MATE_STATS_DELAY_MS = 100;

// Time periods (in seconds)
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const DAYS_IN_TWO_WEEKS = 14;
export const TWO_WEEKS_IN_SECONDS = DAYS_IN_TWO_WEEKS * SECONDS_PER_DAY;
export const PARTY_DETECTION_DAYS = 3;
export const PARTY_DETECTION_SECONDS = PARTY_DETECTION_DAYS * SECONDS_PER_DAY;
