// live_match_players.rs: Live Match Players
// GET /v1/matches/{match_id}/live/url + Steam CDN Demo Stream Parsing

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// This script uses the Deadlock API to get live match broadcast URL,
// then connects to Steam CDN to parse live demo stream and extract player data.
// Documentation: https://api.deadlock-api.com/docs#tag/matches/GET/v1/matches/{match_id}/live/url

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Extract key player data from live matches for building match tables
// - Provide essential player information to Deadlock API for constructing match tables
// - Enable real-time tracking of player selection and team composition
//
// Technical Details:
// - Retrieve player account ID - `account_id`: u32
// - Retrieve Steam display name - `steam_name`: String
// - Retrieve player slot position - `player_slot`: u8 (1-12)
// - Retrieve team assignment - `team`: u8 (2 = Amber, 3 = Sapphire)
// - Retrieve selected hero ID - `hero_id`: u32
// - Parse live demo stream using haste library with entity visitor pattern
// - Extract hero_id from nested entity structure (m_PlayerDataGlobal.m_nHeroID)
//
// Output Format:
// - Script name: "Live Match Players"
// - Two tables divided by teams (Amber and Sapphire)
// - Each table row displays:
//   - player_slot (slot number)
//   - steam_name (player name)
//   - hero_id (selected hero)
//   - account_id (unique player identifier)
// - Visual table formatting with borders and headers
// - Summary line showing total players found and heroes selected

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use haste::broadcast::BroadcastHttp;
use haste::parser::Parser;
use haste::entities::{DeltaHeader, Entity, fkey_from_path};
use haste::parser::{Context, Visitor};
use haste::fxhash;

// ============================================================================
// INPUT DATA
// ============================================================================

const MATCH_ID: u64 = 50050183;

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Clone)]
struct MatchPlayer {
    account_id: u32,
    steam_name: String,
    player_slot: u8,
    team: u8,
    hero_id: u32,
}

#[derive(Debug)]
struct MatchStreamError(String);

impl std::fmt::Display for MatchStreamError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for MatchStreamError {}

impl From<String> for MatchStreamError {
    fn from(s: String) -> Self {
        Self(s)
    }
}

// ============================================================================
// ENTITY HASH CONSTANTS
// ============================================================================

// ============================================================================
// ENTITY HASH CONSTANTS
// ============================================================================

const PLAYER_CONTROLLER_HASH: u64 = fxhash::hash_bytes(b"CCitadelPlayerController");
const STEAM_ID_HASH: u64 = fxhash::hash_bytes(b"m_steamID");
const STEAM_NAME_HASH: u64 = fxhash::hash_bytes(b"m_iszPlayerName");
const PLAYER_SLOT_HASH: u64 = fxhash::hash_bytes(b"m_unLobbyPlayerSlot");
const TEAM_HASH: u64 = fxhash::hash_bytes(b"m_iTeamNum");
const HERO_ID_HASH: u64 = fkey_from_path(&["m_PlayerDataGlobal", "m_nHeroID"]);

// ============================================================================
// DEMO STREAM VISITOR
// ============================================================================

struct MatchDataVisitor {
    players: Arc<Mutex<HashMap<u32, MatchPlayer>>>,
}

impl MatchDataVisitor {
    fn new(players: Arc<Mutex<HashMap<u32, MatchPlayer>>>) -> Self {
        Self { players }
    }

    fn extract_player_data(entity: &Entity) -> Option<MatchPlayer> {
        let steam_id_64: Option<u64> = entity.get_value(&STEAM_ID_HASH);
        let steam_id = steam_id_64.and_then(|id| steamid64_to_steamid3(id).ok())?;
        let steam_name: String = entity.get_value(&STEAM_NAME_HASH)?;
        let player_slot: u8 = entity.get_value(&PLAYER_SLOT_HASH)?;
        let team: u8 = entity.get_value(&TEAM_HASH)?;
        let hero_id: u32 = entity.get_value::<u32>(&HERO_ID_HASH).unwrap_or(0);

        if steam_id > 0 && steam_name != "SourceTV" && player_slot <= 12 && (team == 2 || team == 3) {
            Some(MatchPlayer { 
                account_id: steam_id, 
                steam_name, 
                player_slot, 
                team, 
                hero_id,
            })
        } else {
            None
        }
    }
}

impl Visitor for MatchDataVisitor {
    type Error = MatchStreamError;

    async fn on_entity(&mut self, _ctx: &Context, delta_header: DeltaHeader, entity: &Entity) -> Result<(), Self::Error> {
        let serializer_hash = entity.serializer().serializer_name.hash;
        
        if serializer_hash == PLAYER_CONTROLLER_HASH && matches!(delta_header, DeltaHeader::CREATE | DeltaHeader::UPDATE) {
            if let Some(player) = Self::extract_player_data(entity) {
                let mut players = self.players.lock().unwrap();
                
                let entry = players.entry(player.account_id).or_insert_with(|| player.clone());
                entry.steam_name = player.steam_name;
                entry.team = player.team;
                entry.player_slot = player.player_slot;
                if player.hero_id > 0 {
                    entry.hero_id = player.hero_id;
                }
            }
        }
        
        Ok(())
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

fn steamid64_to_steamid3(steamid64: u64) -> Result<u32, String> {
    const STEAM_ID_BASE: u64 = 76561197960265728;
    if steamid64 < STEAM_ID_BASE {
        return Ok(steamid64 as u32);
    }
    let account_id = steamid64.checked_sub(STEAM_ID_BASE)
        .ok_or_else(|| format!("Invalid Steam ID64: {}", steamid64))?;
    u32::try_from(account_id).map_err(|_| format!("Steam ID3 overflow: {}", account_id))
}

async fn spectate_match(client: &reqwest::Client, match_id: u64) -> Result<String, Box<dyn std::error::Error>> {
    let url = format!("https://api.deadlock-api.com/v1/matches/{}/live/url", match_id);
    let response = client.get(&url).send().await?.error_for_status()?;
    let json: serde_json::Value = serde_json::from_str(&response.text().await?)?;
    
    json.get("broadcast_url")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "broadcast_url not found in API response".into())
}

fn print_team_table(title: &str, players: &[MatchPlayer]) {
    let table_top = "┌──────┬────────────────────────────────┬──────────┬──────────────┐";
    let table_header = "│ Slot │           Player               │   Hero   │  Account ID  │";
    let table_separator = "├──────┼────────────────────────────────┼──────────┼──────────────┤";
    let table_bottom = "└──────┴────────────────────────────────┴──────────┴──────────────┘";

    println!("{}", title);
    println!("{}", table_top);
    println!("{}", table_header);
    println!("{}", table_separator);
    
    for player in players {
        let name = if player.steam_name.len() > 30 {
            format!("{}...", &player.steam_name[..27])
        } else {
            player.steam_name.clone()
        };
        
        let hero = if player.hero_id > 0 {
            player.hero_id.to_string()
        } else {
            "-".to_string()
        };
        
        println!("│ {:^4} │ {:<30} │ {:^8} │ {:>12} │",
            player.player_slot, name, hero, player.account_id);
    }
    
    println!("{}", table_bottom);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("\n═══════════════════════════════════════════════════════════════════════");
    println!("                  🎮 Live Match Players");
    println!("═══════════════════════════════════════════════════════════════════════\n");

    let client = reqwest::Client::new();
    println!("📍 Match ID: {}\n", MATCH_ID);

    // Get broadcast URL
    print!("🔄 Fetching broadcast URL... ");
    let broadcast_url = match spectate_match(&client, MATCH_ID).await {
        Ok(url) => { println!("✅"); url }
        Err(e) => { eprintln!("❌ {}", e); return Err(e); }
    };

    // Connect to Steam CDN
    print!("📡 Connecting to stream... ");
    let demo_stream = BroadcastHttp::start_streaming(client, broadcast_url).await
        .map_err(|e| MatchStreamError(format!("Connection error: {}", e)))?;
    println!("✅");

    // Create parser
    let players_map = Arc::new(Mutex::new(HashMap::new()));
    let visitor = MatchDataVisitor::new(Arc::clone(&players_map));
    
    let mut parser = Parser::from_stream_with_visitor(demo_stream, visitor)
        .map_err(|e| MatchStreamError(format!("Parser creation error: {}", e)))?;

    // Parse until all players found
    print!("⚙️  Parsing match data");
    let mut packet_count = 0;
    
    loop {
        let demo_stream = parser.demo_stream_mut();
        match demo_stream.next_packet().await {
            Some(Ok(_)) => {
                packet_count += 1;
                if packet_count % 100 == 0 {
                    print!(".");
                }
                
                if let Err(e) = parser.run_to_end().await {
                    eprintln!("\n⚠️  Parsing error: {}\n", e);
                    break;
                }
                
                // Check if all players are found with hero_id
                let players = players_map.lock().unwrap();
                if players.len() == 12 && players.values().all(|p| p.hero_id > 0) {
                    println!(" ✅\n");
                    break;
                }
            }
            Some(Err(e)) => { 
                eprintln!("\n⚠️  Packet error: {}\n", e); 
                break; 
            }
            None => { 
                println!(" ✅\n"); 
                break; 
            }
        }
    }

    // Get and sort players
    let players_guard = players_map.lock().unwrap();
    let players: Vec<MatchPlayer> = players_guard.values().cloned().collect();
    drop(players_guard);

    if players.is_empty() {
        println!("⚠️  No players found!");
        return Ok(());
    }

    // Sort by teams and slots
    let mut team_amber: Vec<_> = players.iter().filter(|p| p.team == 2).cloned().collect();
    let mut team_sapphire: Vec<_> = players.iter().filter(|p| p.team == 3).cloned().collect();
    team_amber.sort_by_key(|p| p.player_slot);
    team_sapphire.sort_by_key(|p| p.player_slot);

    // Display tables
    print_team_table("🟡 TEAM AMBER", &team_amber);
    println!();
    print_team_table("🔵 TEAM SAPPHIRE", &team_sapphire);

    let players_with_heroes = players.iter().filter(|p| p.hero_id > 0).count();
    println!("\n✅ Players found: {}/12 (with heroes: {}/12)\n", players.len(), players_with_heroes);
    
    Ok(())
}
