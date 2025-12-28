// patch_notes.rs: Patch Notes
// GET /v1/patches

// ============================================================================
// API DOCUMENTATION REFERENCE
// ============================================================================
// Returns the parsed result of the RSS Feed from the official Forum.
// Documentation: https://api.deadlock-api.com/docs#tag/patches/GET/v1/patches

// ============================================================================
// SCRIPT PURPOSE
// ============================================================================
// Business Logic:
// - Get news feed for game updates
//
// Technical Details:
// - Parse list of patch notes from API - `Vec<PatchNote>`
// - Retrieve patch title - `title`: String
// - Retrieve publication date - `pub_date`: String
// - Retrieve forum link - `link`: String
// - Retrieve short preview text (first 100 characters) - `content_encoded`: String
//
// Output Format:
// - Script name: "Patch Notes"
// - For each patch note (multiple records):
//   - title
//   - pub_date
//   - link
//   - content_preview (first 100 characters)
//   - (visual separator between blocks)

use serde::{Deserialize, Serialize};
use std::error::Error;

// ============================================================================
// ENDPOINT CONSTANTS
// ============================================================================

const BASE_URL: &str = "https://api.deadlock-api.com";
const ENDPOINT: &str = "/v1/patches";

// ============================================================================
// INPUT DATA
// ============================================================================

// No input parameters required for this endpoint

// ============================================================================
// RESPONSE STRUCTURE
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
struct Category {
    domain: String,
    text: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Guid {
    is_perma_link: bool,
    text: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct PatchNote {
    author: String,
    category: Category,
    content_encoded: String,
    dc_creator: String,
    guid: Guid,
    link: String,
    pub_date: String,
    slash_comments: String,
    title: String,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let url = format!("{}{}", BASE_URL, ENDPOINT);

    println!("Requesting patch notes...");

    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    let status = response.status();

    if !status.is_success() {
        let error_text = response.text().await?;
        return Err(format!("API error {}: {}", status, error_text).into());
    }

    let patches: Vec<PatchNote> = response.json().await?;

    println!("\n=== Patch Notes ===");
    println!("Retrieved {} patch note(s)\n", patches.len());

    for (index, patch) in patches.iter().enumerate() {
        println!("[Patch {}]", index + 1);
        println!("title: {}", patch.title);
        println!("pub_date: {}", patch.pub_date);
        println!("link: {}", patch.link);
        
        // Extract first 100 characters from content (strip HTML tags)
        let plain_text = strip_html_tags(&patch.content_encoded);
        let preview = if plain_text.len() > 100 {
            format!("{}...", &plain_text[..100])
        } else {
            plain_text
        };
        println!("content_preview: {}", preview);
        
        if index < patches.len() - 1 {
            println!();
        }
    }

    Ok(())
}

// Helper function to strip HTML tags from content
fn strip_html_tags(html: &str) -> String {
    let mut result = String::new();
    let mut inside_tag = false;
    
    for ch in html.chars() {
        match ch {
            '<' => inside_tag = true,
            '>' => inside_tag = false,
            _ if !inside_tag => result.push(ch),
            _ => {}
        }
    }
    
    result.trim().to_string()
}
