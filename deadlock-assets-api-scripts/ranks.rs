// ranks.rs: Get All Ranks
//
// Retrieves data about all ranks in the game.
// Documentation: https://assets.deadlock-api.com/scalar#GET/v2/ranks
//
// Business Logic:
// - Get rank information for display in the application
// - Each rank has 6 subranks (except tier 0 - Obscurus)
//
// Technical Details:
// - Retrieve all ranks as array
// - For each rank get 6 small subrank images in WebP format
// - Fields: small_subrank1_webp, small_subrank2_webp, small_subrank3_webp,
//           small_subrank4_webp, small_subrank5_webp, small_subrank6_webp
//
// Output Format:
// - Script name: "All Ranks"
// - For each rank:
//   - Rank Name: {name}
//   - Tier: {tier}
//   - 6 subrank image URLs

use serde::{Deserialize, Serialize};

// === CONSTANTS ===

const BASE_URL: &str = "https://assets.deadlock-api.com";
const ENDPOINT: &str = "/v2/ranks";

// === DATA STRUCTURES ===

#[derive(Debug, Deserialize, Serialize)]
struct Rank {
    tier: u32,
    name: String,
    images: RankImages,
}

#[derive(Debug, Deserialize, Serialize)]
struct RankImages {
    #[serde(default)]
    small_subrank1_webp: Option<String>,
    #[serde(default)]
    small_subrank2_webp: Option<String>,
    #[serde(default)]
    small_subrank3_webp: Option<String>,
    #[serde(default)]
    small_subrank4_webp: Option<String>,
    #[serde(default)]
    small_subrank5_webp: Option<String>,
    #[serde(default)]
    small_subrank6_webp: Option<String>,
}

// === MAIN LOGIC ===

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== All Ranks ===\n");
    
    let url = format!("{}{}", BASE_URL, ENDPOINT);
    let ranks: Vec<Rank> = ureq::get(&url)
        .call()?
        .into_json()?;

    println!("Total ranks found: {}\n", ranks.len());

    for rank in ranks {
        println!("Rank: {}", rank.name);
        println!("Tier: {}", rank.tier);
        
        if let Some(img) = rank.images.small_subrank1_webp {
            println!("Small Subrank 1: {}", img);
        }
        if let Some(img) = rank.images.small_subrank2_webp {
            println!("Small Subrank 2: {}", img);
        }
        if let Some(img) = rank.images.small_subrank3_webp {
            println!("Small Subrank 3: {}", img);
        }
        if let Some(img) = rank.images.small_subrank4_webp {
            println!("Small Subrank 4: {}", img);
        }
        if let Some(img) = rank.images.small_subrank5_webp {
            println!("Small Subrank 5: {}", img);
        }
        if let Some(img) = rank.images.small_subrank6_webp {
            println!("Small Subrank 6: {}", img);
        }
        println!();
    }

    Ok(())
}
