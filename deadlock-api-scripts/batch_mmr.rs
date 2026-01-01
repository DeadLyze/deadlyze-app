// batch_mmr.rs: Batch MMR
// GET /v1/players/mmr

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// Returns the MMR (Matchmaking Rating) of players.
// Documentation: https://api.deadlock-api.com/docs#tag/mmr/GET/v1/players/mmr

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Get player rank information
//
// Technical Details:
// - Retrieve player account ID - `account_id`: i32
// - Retrieve rank division (tier) - `division`: i32
// - Retrieve rank division tier (subtier) - `division_tier`: i32
// - Retrieve player score - `player_score`: f64
//
// Output Format:
// - Script name: "Batch MMR"
// - For each player (multiple records):
//   - player_id (account_id)
//   - rank (division.division_tier)
//   - player_score
//   - (visual separator between blocks)

use serde::{Deserialize, Serialize};
use std::error::Error;

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

const BASE_URL: &str = "https://api.deadlock-api.com";
const ENDPOINT: &str = "/v1/players/mmr";

// ============================================================================
// INPUT DATA
// ============================================================================

const ACCOUNT_IDS: &[i32] = &[1133609782, 1110035791];

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct PlayerMMR {
    account_id: i32,
    division: i32,
    division_tier: i32,
    match_id: i64,
    player_score: f64,
    rank: i32,
    start_time: i64,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let account_ids_str = ACCOUNT_IDS
        .iter()
        .map(|id| id.to_string())
        .collect::<Vec<String>>()
        .join(",");

    let url = format!("{}{}?account_ids={}", BASE_URL, ENDPOINT, account_ids_str);

    println!("Requesting MMR for {} account(s)...", ACCOUNT_IDS.len());

    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    let status = response.status();

    if !status.is_success() {
        let error_text = response.text().await?;
        return Err(format!("API error {}: {}", status, error_text).into());
    }

    let mmr_data: Vec<PlayerMMR> = response.json().await?;

    println!("\n=== Batch MMR ===");
    println!("Retrieved {} player(s)\n", mmr_data.len());

    for (index, player) in mmr_data.iter().enumerate() {
        println!("[Player {}]", index + 1);
        println!("player_id: {}", player.account_id);
        println!("rank: {}.{}", player.division, player.division_tier);
        println!("player_score: {}", player.player_score);
        
        if index < mmr_data.len() - 1 {
            println!();
        }
    }

    Ok(())
}
