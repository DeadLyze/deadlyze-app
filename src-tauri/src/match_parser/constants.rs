use haste::entities::fkey_from_path;
use haste::fxhash;

// Entity hash constants for player data extraction
pub const PLAYER_CONTROLLER_HASH: u64 = fxhash::hash_bytes(b"CCitadelPlayerController");
pub const STEAM_ID_HASH: u64 = fxhash::hash_bytes(b"m_steamID");
pub const STEAM_NAME_HASH: u64 = fxhash::hash_bytes(b"m_iszPlayerName");
pub const PLAYER_SLOT_HASH: u64 = fxhash::hash_bytes(b"m_unLobbyPlayerSlot");
pub const TEAM_HASH: u64 = fxhash::hash_bytes(b"m_iTeamNum");
pub const HERO_ID_HASH: u64 = fkey_from_path(&["m_PlayerDataGlobal", "m_nHeroID"]);

// Team identifiers
pub const TEAM_AMBER: u8 = 2;
pub const TEAM_SAPPHIRE: u8 = 3;

// Match configuration
pub const TOTAL_PLAYERS: usize = 12;
pub const MAX_PLAYER_SLOT: u8 = 12;

// Broadcast connection retry configuration
pub const MAX_RETRY_ATTEMPTS: u32 = 10;
pub const RETRY_DELAY_SECS: u64 = 4;

// API configuration
pub const API_BASE_URL: &str = "https://api.deadlock-api.com/v1";
pub const USER_AGENT: &str = "DeadLyze/1.0";
pub const REQUEST_TIMEOUT_SECS: u64 = 10;

// Parser configuration
pub const PACKET_PROGRESS_INTERVAL: u32 = 100;
