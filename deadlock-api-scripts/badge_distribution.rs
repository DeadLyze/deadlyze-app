// badge_distribution.rs: Badge Distribution
// GET /v1/analytics/badge-distribution

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// This endpoint returns the player badge distribution.
// Documentation: https://api.deadlock-api.com/docs#tag/analytics/GET/v1/analytics/badge-distribution

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Display player rank distribution to understand player skill levels
//
// Technical Details:
// - Retrieve badge level (rank encoding) - `badge_level`: i32
//   Format: first digits = tier, last digit = subtier
// - Retrieve total matches count - `total_matches`: i32
// - Apply time filter: matches from last 30 days (1 month)
//
// Output Format:
// - Script name: "Badge Distribution"
// - For each rank (multiple records):
//   - Rank tier.subtier
//   - Total matches count
//   - (visual separator between blocks)

use serde::{Deserialize, Serialize};
use std::error::Error;
use std::time::{SystemTime, UNIX_EPOCH};

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

const BASE_URL: &str = "https://api.deadlock-api.com";
const ENDPOINT: &str = "/v1/analytics/badge-distribution";

// ============================================================================
// INPUT DATA
// ============================================================================

// Query parameter:
// - min_unix_timestamp: filter matches by start time (Unix timestamp)
//   Set to 30 days ago from current time

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct BadgeDistribution {
    badge_level: i32,
    total_matches: i32,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Calculate timestamp for 30 days ago
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs();
    let month_ago = now - (30 * 24 * 60 * 60); // 30 days in seconds
    
    let url = format!("{}{}?min_unix_timestamp={}", BASE_URL, ENDPOINT, month_ago);

    println!("Requesting badge distribution for last 30 days...");

    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    let status = response.status();

    if !status.is_success() {
        let error_text = response.text().await?;
        return Err(format!("API error {}: {}", status, error_text).into());
    }

    let distributions: Vec<BadgeDistribution> = response.json().await?;

    println!("\n=== Badge Distribution ===");
    println!("Retrieved {} rank(s)\n", distributions.len());

    for (index, dist) in distributions.iter().enumerate() {
        let tier = dist.badge_level / 10;
        let subtier = dist.badge_level % 10;
        
        println!("[Rank {}]", index + 1);
        println!("rank: {}.{}", tier, subtier);
        println!("total_matches: {}", dist.total_matches);
        
        if index < distributions.len() - 1 {
            println!();
        }
    }

    Ok(())
}
