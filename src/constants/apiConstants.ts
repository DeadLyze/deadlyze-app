/**
 * API constants for Deadlock services
 */

// Base URLs
export const ASSETS_API_BASE_URL = "https://assets.deadlock-api.com";
export const PLAYER_DATA_API_BASE_URL = "https://api.deadlock-api.com";

// Rate limiting
export const HERO_FETCH_DELAY_MS = 1;
export const MATCH_METADATA_DELAY_MS = 1;

// Time periods (in seconds)
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const DAYS_IN_TWO_WEEKS = 14;
export const TWO_WEEKS_IN_SECONDS = DAYS_IN_TWO_WEEKS * SECONDS_PER_DAY;
