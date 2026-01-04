use super::types::MatchPlayer;

pub fn print_team_table(title: &str, players: &[MatchPlayer]) {
    const TABLE_TOP: &str = "┌──────┬────────────────────────────────┬──────────┬──────────────┐";
    const TABLE_HEADER: &str = "│ Slot │           Player               │   Hero   │  Account ID  │";
    const TABLE_SEPARATOR: &str = "├──────┼────────────────────────────────┼──────────┼──────────────┤";
    const TABLE_BOTTOM: &str = "└──────┴────────────────────────────────┴──────────┴──────────────┘";
    const MAX_NAME_LENGTH: usize = 30;
    const TRUNCATE_LENGTH: usize = 27;

    println!("{}", title);
    println!("{}", TABLE_TOP);
    println!("{}", TABLE_HEADER);
    println!("{}", TABLE_SEPARATOR);

    for player in players {
        let name = truncate_name(&player.steam_name, MAX_NAME_LENGTH, TRUNCATE_LENGTH);
        let hero = format_hero_id(player.hero_id);

        println!(
            "│ {:^4} │ {:<30} │ {:^8} │ {:>12} │",
            player.player_slot, 
            name, 
            hero, 
            player.account_id
        );
    }

    println!("{}", TABLE_BOTTOM);
}

fn truncate_name(name: &str, max_length: usize, truncate_at: usize) -> String {
    if name.chars().count() > max_length {
        let truncated: String = name.chars().take(truncate_at).collect();
        format!("{}...", truncated)
    } else {
        name.to_string()
    }
}

fn format_hero_id(hero_id: u32) -> String {
    if hero_id > 0 {
        hero_id.to_string()
    } else {
        "-".to_string()
    }
}
