use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use haste::entities::{DeltaHeader, Entity};
use haste::parser::{Context, Visitor};

use super::constants::*;
use super::types::MatchPlayer;
use super::utils::steamid64_to_steamid3;

#[derive(Debug)]
pub struct MatchStreamError(String);

impl std::fmt::Display for MatchStreamError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for MatchStreamError {}

impl From<String> for MatchStreamError {
    fn from(s: String) -> Self {
        Self(s)
    }
}

pub struct MatchDataVisitor {
    players: Arc<Mutex<HashMap<u32, MatchPlayer>>>,
}

impl MatchDataVisitor {
    pub fn new(players: Arc<Mutex<HashMap<u32, MatchPlayer>>>) -> Self {
        Self { players }
    }

    fn extract_player_data(entity: &Entity) -> Option<MatchPlayer> {
        let steam_id_64: Option<u64> = entity.get_value(&STEAM_ID_HASH);
        let steam_id = steam_id_64.and_then(|id| steamid64_to_steamid3(id).ok())?;
        let steam_name: String = entity.get_value(&STEAM_NAME_HASH)?;
        let player_slot: u8 = entity.get_value(&PLAYER_SLOT_HASH)?;
        let team: u8 = entity.get_value(&TEAM_HASH)?;
        let hero_id: u32 = entity.get_value::<u32>(&HERO_ID_HASH).unwrap_or(0);

        if steam_id > 0 
            && steam_name != "SourceTV" 
            && player_slot <= MAX_PLAYER_SLOT 
            && (team == TEAM_AMBER || team == TEAM_SAPPHIRE) 
        {
            Some(MatchPlayer {
                account_id: steam_id,
                steam_name,
                player_slot,
                team,
                hero_id,
            })
        } else {
            None
        }
    }
}

impl Visitor for MatchDataVisitor {
    type Error = MatchStreamError;

    async fn on_entity(
        &mut self, 
        _ctx: &Context, 
        delta_header: DeltaHeader, 
        entity: &Entity
    ) -> Result<(), Self::Error> {
        let serializer_hash = entity.serializer().serializer_name.hash;

        if serializer_hash == PLAYER_CONTROLLER_HASH 
            && matches!(delta_header, DeltaHeader::CREATE | DeltaHeader::UPDATE) 
        {
            if let Some(player) = Self::extract_player_data(entity) {
                let mut players = self.players.lock().unwrap();
                let entry = players.entry(player.account_id).or_insert_with(|| player.clone());
                
                entry.steam_name = player.steam_name;
                entry.team = player.team;
                entry.player_slot = player.player_slot;
                
                if player.hero_id > 0 {
                    entry.hero_id = player.hero_id;
                }
            }
        }

        Ok(())
    }
}
