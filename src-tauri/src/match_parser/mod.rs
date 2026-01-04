mod constants;
mod types;
mod visitor;
mod utils;
mod network;
mod display;

pub use types::{MatchData, MatchPlayer};

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use haste::parser::Parser;

use constants::*;
use visitor::MatchDataVisitor;
use network::{get_broadcast_url, try_connect_to_broadcast};
use display::print_team_table;

pub async fn fetch_match_players(match_id: u64) -> Result<MatchData, String> {
    println!("\n═══════════════════════════════════════════════════════════════════════");
    println!("                  🎮 Live Match Players");
    println!("═══════════════════════════════════════════════════════════════════════\n");
    println!("📍 Match ID: {}\n", match_id);

    let client = reqwest::Client::new();

    // Fetch broadcast URL (single request)
    let broadcast_url = get_broadcast_url(&client, match_id)
        .await
        .map_err(|e| format!("Failed to get broadcast URL: {}", e))?;

    // Connect to broadcast with retry logic
    let demo_stream = try_connect_to_broadcast(
        client, 
        broadcast_url, 
        MAX_RETRY_ATTEMPTS, 
        RETRY_DELAY_SECS
    )
    .await
    .map_err(|e| format!("Connection error: {}", e))?;
    println!();

    // Initialize parser with visitor
    let players_map = Arc::new(Mutex::new(HashMap::new()));
    let visitor = MatchDataVisitor::new(Arc::clone(&players_map));
    let mut parser = Parser::from_stream_with_visitor(demo_stream, visitor)
        .map_err(|e| format!("Parser creation error: {}", e))?;

    // Parse stream until all players found
    print!("⚙️  Parsing match data");
    let mut packet_count = 0;

    loop {
        let demo_stream = parser.demo_stream_mut();
        match demo_stream.next_packet().await {
            Some(Ok(_)) => {
                packet_count += 1;
                if packet_count % PACKET_PROGRESS_INTERVAL == 0 {
                    print!(".");
                }

                if let Err(e) = parser.run_to_end().await {
                    eprintln!("\n⚠️  Parsing error: {}\n", e);
                    break;
                }

                // Check if all players with heroes are found
                let players = players_map.lock().unwrap();
                if players.len() == TOTAL_PLAYERS && players.values().all(|p| p.hero_id > 0) {
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

    // Extract and organize players
    let match_data = organize_match_data(&players_map)?;

    // Display results
    print_team_table("🟡 TEAM AMBER", &match_data.amber_team);
    println!();
    print_team_table("🔵 TEAM SAPPHIRE", &match_data.sapphire_team);

    let total_found = match_data.amber_team.len() + match_data.sapphire_team.len();
    let with_heroes = count_players_with_heroes(&match_data);
    println!("\n✅ Players found: {}/{} (with heroes: {}/{})\n", 
        total_found, TOTAL_PLAYERS, with_heroes, TOTAL_PLAYERS);

    Ok(match_data)
}

fn organize_match_data(
    players_map: &Arc<Mutex<HashMap<u32, MatchPlayer>>>
) -> Result<MatchData, String> {
    let players_guard = players_map.lock().unwrap();
    let players: Vec<MatchPlayer> = players_guard.values().cloned().collect();
    drop(players_guard);

    if players.is_empty() {
        return Err("No players found".to_string());
    }

    let team_amber = filter_and_sort_team(&players, TEAM_AMBER);
    let team_sapphire = filter_and_sort_team(&players, TEAM_SAPPHIRE);

    Ok(MatchData {
        amber_team: team_amber,
        sapphire_team: team_sapphire,
    })
}

fn filter_and_sort_team(players: &[MatchPlayer], team_id: u8) -> Vec<MatchPlayer> {
    let mut team: Vec<_> = players
        .iter()
        .filter(|p| p.team == team_id)
        .cloned()
        .collect();
    
    team.sort_by_key(|p| p.player_slot);
    team
}

fn count_players_with_heroes(match_data: &MatchData) -> usize {
    match_data.amber_team.iter().chain(match_data.sapphire_team.iter())
        .filter(|p| p.hero_id > 0)
        .count()
}
