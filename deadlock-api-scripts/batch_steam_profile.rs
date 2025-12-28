// batch_steam_profile.rs: Batch Steam Profile
// GET /v1/players/steam

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// This endpoint returns Steam profiles of players.
// Documentation: https://api.deadlock-api.com/docs#tag/players/GET/v1/players/steam

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Get Steam profile information for players
//
// Technical Details:
// - Retrieve player username - `personaname`: String
// - Retrieve full avatar URL - `avatarfull`: String
// - Retrieve Steam profile URL - `profileurl`: String
// - Retrieve last update date - `last_updated`: i64
//
// Output Format:
// - Script name: "Batch Steam Profile"
// - For each profile (multiple records):
//   - personaname
//   - avatarfull
//   - profileurl
//   - last_updated
//   - (visual separator between blocks)

use serde::{Deserialize, Serialize};
use std::error::Error;

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

const BASE_URL: &str = "https://api.deadlock-api.com";
const ENDPOINT: &str = "/v1/players/steam";

// ============================================================================
// INPUT DATA
// ============================================================================

const ACCOUNT_IDS: &[i32] = &[1133609782, 1110035791];

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct SteamProfile {
    account_id: i32,
    avatar: String,
    avatarfull: String,
    avatarmedium: String,
    countrycode: Option<String>,
    last_updated: i64,
    personaname: String,
    profileurl: String,
    realname: Option<String>,
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

    println!("Requesting Steam profiles for {} accounts...", ACCOUNT_IDS.len());

    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    let status = response.status();

    if !status.is_success() {
        let error_text = response.text().await?;
        return Err(format!("API error {}: {}", status, error_text).into());
    }

    let profiles: Vec<SteamProfile> = response.json().await?;

    println!("\n=== Batch Steam Profile ===");
    println!("Retrieved {} profile(s)\n", profiles.len());

    for (index, profile) in profiles.iter().enumerate() {
        println!("personaname: {}", profile.personaname);
        println!("[Profile {}]", index + 1);
        println!("avatarfull: {}", profile.avatarfull);
        println!("profileurl: {}", profile.profileurl);
        println!("last_updated: {}", profile.last_updated);
        
        if index < profiles.len() - 1 {
            println!();
        }
    }

    Ok(())
}
