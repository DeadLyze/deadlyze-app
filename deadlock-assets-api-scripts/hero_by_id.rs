// hero_by_id.rs: Get Hero by ID
//
// Retrieves data about a specific hero by their ID.
// Documentation: https://assets.deadlock-api.com/scalar#tag/Heroes/GET/v2/heroes/{id}
//
// Business Logic:
// - Get hero information for display in the application
//
// Technical Details:
// - Retrieve hero name (`name`: String)
// - Retrieve hero image (`images.selection_image_webp`: String)
//
// Output Format:
// - Script name: "Hero by ID"
// - Fields:
//   - Hero Name: {name}
//   - Image URL: {selection_image_webp}

use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};

// === CONSTANTS ===

const BASE_URL: &str = "https://assets.deadlock-api.com";
const ENDPOINT: &str = "/v2/heroes";

// === INPUT DATA ===

const HERO_ID: i32 = 1;

// === DATA STRUCTURES ===

#[derive(Debug, Serialize, Deserialize)]
struct HeroImages {
    #[serde(default)]
    icon_hero_card: String,
    #[serde(default)]
    icon_hero_card_webp: String,
    #[serde(default)]
    icon_image_small: String,
    #[serde(default)]
    icon_image_small_webp: String,
    #[serde(default)]
    minimap_image: String,
    #[serde(default)]
    minimap_image_webp: String,
    #[serde(default)]
    selection_image: String,
    #[serde(default)]
    selection_image_webp: String,
    #[serde(default)]
    top_bar_image: String,
    #[serde(default)]
    top_bar_image_webp: String,
    #[serde(default)]
    top_bar_vertical_image: String,
    #[serde(default)]
    top_bar_vertical_image_webp: String,
    #[serde(default)]
    weapon_image: String,
    #[serde(default)]
    weapon_image_webp: String,
    #[serde(default)]
    background_image: String,
    #[serde(default)]
    background_image_webp: String,
    #[serde(default)]
    name_image: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HeroDescription {
    #[serde(default)]
    lore: String,
    #[serde(default)]
    role: String,
    #[serde(default)]
    playstyle: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Hero {
    id: i32,
    #[serde(default)]
    class_name: String,
    name: String,
    #[serde(default)]
    description: Option<HeroDescription>,
    #[serde(default)]
    hero_type: String,
    #[serde(default)]
    complexity: i32,
    images: HeroImages,
}

// === MAIN LOGIC ===

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Hero by ID ===\n");

    let client = Client::new();
    let url = format!("{}{}/{}", BASE_URL, ENDPOINT, HERO_ID);

    println!("Request to: {}\n", url);

    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .send()?;

    if !response.status().is_success() {
        eprintln!("Error: HTTP {}", response.status());
        eprintln!("Response: {}", response.text()?);
        return Ok(());
    }

    let hero: Hero = response.json()?;

    // === DATA OUTPUT ===

    println!("┌─────────────────────────────────────────");
    println!("│ Hero Name: {}", hero.name);
    println!("│ Image URL (WebP):");
    println!("│   {}", hero.images.selection_image_webp);
    println!("└─────────────────────────────────────────\n");

    println!("✓ Data retrieved successfully");

    Ok(())
}
