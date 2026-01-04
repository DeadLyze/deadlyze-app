use crate::match_parser;

/// Fetch live match player data
#[tauri::command]
pub async fn fetch_match_data(match_id: String) -> Result<match_parser::MatchData, String> {
    let match_id_num = match_id
        .parse::<u64>()
        .map_err(|_| "Invalid match ID format".to_string())?;
    
    match_parser::fetch_match_players(match_id_num).await
}
