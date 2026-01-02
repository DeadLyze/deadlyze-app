// item_by_id.rs: Get Item by ID or Class Name
//
// Retrieves data about a specific item by ID or class name.
// Documentation: https://assets.deadlock-api.com/scalar#tag/items/GET/v2/items/{id_or_class_name}
//
// Business Logic:
// - Get item information for display in the application
//
// Technical Details:
// - Retrieve item name (`name`: String)
// - Retrieve item image (`image_webp`: String)
//
// Output Format:
// - Script name: "Item by ID"
// - Fields:
//   - Item Name: {name}
//   - Image URL: {image_webp}

use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};

// === CONSTANTS ===

const BASE_URL: &str = "https://assets.deadlock-api.com";
const ENDPOINT: &str = "/v2/items";

// === INPUT DATA ===

const ITEM_ID: &str = "2048438176";

// === DATA STRUCTURES ===

#[derive(Debug, Serialize, Deserialize)]
struct Item {
    #[serde(default)]
    id: i32,
    #[serde(default)]
    class_name: String,
    name: String,
    #[serde(default)]
    image: String,
    image_webp: String,
}

// === MAIN LOGIC ===

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Item by ID ===\n");

    let client = Client::new();
    let url = format!("{}{}/{}", BASE_URL, ENDPOINT, ITEM_ID);

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

    let item: Item = response.json()?;

    // === DATA OUTPUT ===

    println!("┌─────────────────────────────────────────");
    println!("│ Item Name: {}", item.name);
    println!("│ Image URL (WebP):");
    println!("│   {}", item.image_webp);
    println!("└─────────────────────────────────────────\n");

    println!("✓ Data retrieved successfully");

    Ok(())
}
