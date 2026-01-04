use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchPlayer {
    pub account_id: u32,
    pub steam_name: String,
    pub player_slot: u8,
    pub team: u8,
    pub hero_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchData {
    pub amber_team: Vec<MatchPlayer>,
    pub sapphire_team: Vec<MatchPlayer>,
}
