export interface ColumnConfig {
  id: string;
  label: string;
  flex: string;
  align?: "left" | "center" | "right";
}

export const MATCH_TABLE_COLUMNS: ColumnConfig[] = [
  {
    id: "hero",
    label: "Hero",
    flex: "0 0 50px",
    align: "center",
  },
  {
    id: "rank",
    label: "Rank",
    flex: "0 0 75px",
    align: "center",
  },
  {
    id: "player",
    label: "Player",
    flex: "0 0 150px",
    align: "left",
  },
  {
    id: "matches",
    label: "Matches",
    flex: "0 0 120px",
    align: "center",
  },
];

// Search button configuration
export const SEARCH_BUTTON_CONFIG = {
  COOLDOWN_DURATION: 5000, // 5 seconds in milliseconds
  ANIMATION_DURATION: 80, // Press animation duration in milliseconds
};
