import { COLUMN_WIDTH } from "../../constants/uiConstants";

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
    flex: `0 0 ${COLUMN_WIDTH.HERO}px`,
    align: "center",
  },
  {
    id: "rank",
    label: "Rank",
    flex: `0 0 ${COLUMN_WIDTH.RANK}px`,
    align: "center",
  },
  {
    id: "player",
    label: "Player",
    flex: `0 0 ${COLUMN_WIDTH.PLAYER}px`,
    align: "left",
  },
  {
    id: "matches",
    label: "Matches",
    flex: `0 0 ${COLUMN_WIDTH.MATCHES}px`,
    align: "center",
  },
  {
    id: "recent_matches",
    label: "Recent Matches",
    flex: `0 0 ${COLUMN_WIDTH.RECENT_MATCHES}px`,
    align: "center",
  },
  {
    id: "relation",
    label: "With / Against",
    flex: `0 0 ${COLUMN_WIDTH.RELATION}px`,
    align: "center",
  },
  {
    id: "tags",
    label: "Tags",
    flex: `0 0 ${COLUMN_WIDTH.TAGS}px`,
    align: "center",
  },
  {
    id: "current_hero",
    label: "Current Hero",
    flex: `0 0 ${COLUMN_WIDTH.CURRENT_HERO}px`,
    align: "center",
  },
  {
    id: "current_streak",
    label: "Current Streak",
    flex: `0 0 ${COLUMN_WIDTH.CURRENT_STREAK}px`,
    align: "center",
  },
];

// Search button configuration
export const SEARCH_BUTTON_CONFIG = {
  COOLDOWN_DURATION: 5000, // 5 seconds in milliseconds
  ANIMATION_DURATION: 80, // Press animation duration in milliseconds
};
