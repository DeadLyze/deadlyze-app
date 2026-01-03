// player_match_history.rs: Player Match History
// GET /v1/players/{account_id}/match-history

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// Returns match history for a specific player.
// Documentation: https://api.deadlock-api.com/docs#tag/players/GET/v1/players/{account_id}/match-history

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Get player match statistics
// - Calculate total matches and winrate
// - Calculate matches and winrate for last 14 days
//
// Technical Details:
// - Retrieve match history for player by account_id
// - For each match get: match_id, start_time, match_result, player_team
// - Calculate wins/total for all time and last 14 days
//
// Output Format:
// - Script name: "Player Match History"
// - Total matches count
// - Total winrate (%)
// - Matches in last 14 days count
// - Winrate in last 14 days (%)

use serde::{Deserialize, Serialize};
use std::error::Error;

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

const BASE_URL: &str = "https://api.deadlock-api.com";
const ENDPOINT: &str = "/v1/players";

// ============================================================================
// INPUT DATA
// ============================================================================

const ACCOUNT_ID: i32 = 1133609782; // Bruce Wayne from test match

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct MatchHistoryItem {
    match_id: i64,
    start_time: i64,
    match_duration_s: i32,
    match_result: i32,
    player_team: i32,
    hero_id: i32,
    player_kills: i32,
    player_deaths: i32,
    player_assists: i32,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let url = format!(
        "{}{}/{}/match-history?only_stored_history=true",
        BASE_URL, ENDPOINT, ACCOUNT_ID
    );

    println!("Fetching match history for account {}...", ACCOUNT_ID);
    println!("URL: {}\n", url);

    // Remove timeout and use streaming response
    let client = reqwest::Client::builder().build()?;

    println!("Sending request...");
    let response = client.get(&url).send().await?;
    let status = response.status();
    println!("Status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await?;
        println!("Error: {}", error_text);
        return Err(format!("API error {}: {}", status, error_text).into());
    }

    println!("Reading response body...");
    let bytes = response.bytes().await?;
    println!("Response size: {} bytes", bytes.len());
    
    println!("Parsing JSON...");
    let match_history: Vec<MatchHistoryItem> = serde_json::from_slice(&bytes)?;
    println!("Found {} matches\n", match_history.len());

    println!("=== Player Match History ===");
    println!("Account ID: {}\n", ACCOUNT_ID);

    // Calculate all time stats
    let total_matches = match_history.len();
    let total_wins = match_history
        .iter()
        .filter(|m| m.match_result == m.player_team)
        .count();
    let total_winrate = if total_matches > 0 {
        (total_wins as f64 / total_matches as f64 * 100.0).round() as i32
    } else {
        0
    };

    // Calculate last 14 days stats
    let current_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs() as i64;
    let two_weeks_ago = current_time - (14 * 24 * 60 * 60);

    let recent_matches: Vec<&MatchHistoryItem> = match_history
        .iter()
        .filter(|m| m.start_time >= two_weeks_ago)
        .collect();

    let recent_matches_count = recent_matches.len();
    let recent_wins = recent_matches
        .iter()
        .filter(|m| m.match_result == m.player_team)
        .count();
    let recent_winrate = if recent_matches_count > 0 {
        (recent_wins as f64 / recent_matches_count as f64 * 100.0).round() as i32
    } else {
        0
    };

    // Output results
    println!("[All Time]");
    println!("total_matches: {}", total_matches);
    println!("total_wins: {}", total_wins);
    println!("total_winrate: {}%", total_winrate);
    println!();

    println!("[Last 14 Days]");
    println!("recent_matches: {}", recent_matches_count);
    println!("recent_wins: {}", recent_wins);
    println!("recent_winrate: {}%", recent_winrate);

    Ok(())
}
