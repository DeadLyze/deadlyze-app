import React from "react";
import { MatchPlayer, PartyGroup } from "../../services";
import { PARTY_DISPLAY } from "../../constants/uiConstants";

interface PartyBracketsProps {
  players: MatchPlayer[];
  partyGroups: PartyGroup[];
}

interface BracketLine {
  type: "vertical" | "horizontal";
  top: number;
  left: number;
  width?: number;
  height?: number;
}

interface PartyBracket {
  color: string;
  playerIndices: number[];
  lines: BracketLine[];
  level: number; // Bracket depth level (0, 1, 2)
}

/**
 * PartyBrackets component - renders bracket lines showing party connections
 * Positioned to the left of the team table, with 3 levels of depth
 */
export const PartyBrackets: React.FC<PartyBracketsProps> = ({
  players,
  partyGroups,
}) => {
  // Filter party groups for current team only
  const teamId = players.length > 0 ? players[0].team : null;
  const teamPartyGroups = partyGroups.filter((group) => {
    const firstMember = group.members[0];
    const player = players.find((p) => p.account_id === firstMember);
    return player?.team === teamId;
  });

  // Filter groups with at least 2 members
  const validPartyGroups = teamPartyGroups.filter(
    (group) => group.members && group.members.length >= 2
  );

  if (validPartyGroups.length === 0) {
    return null;
  }

  // Calculate brackets with levels
  const brackets: PartyBracket[] = [];

  validPartyGroups.forEach((group, groupIndex) => {
    // Get local player indices in this team
    const playerIndices = group.members
      .map((playerId) => players.findIndex((p) => p.account_id === playerId))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b);

    if (playerIndices.length < 2) return;

    const lines: BracketLine[] = [];

    // Determine bracket level (0, 1, 2)
    // Multiple parties in team get different levels for depth
    const level = groupIndex % 3;

    // Calculate horizontal line length based on level
    // Level 0: shortest (closest to table)
    // Level 2: longest (furthest from table)
    const horizontalLineLength =
      PARTY_DISPLAY.HORIZONTAL_LINE_BASE_LENGTH * (level + 1);

    // Horizontal lines end at same position (close to table)
    const horizontalLineEndX = PARTY_DISPLAY.BRACKET_WIDTH - 2;

    // Horizontal lines start position (further left for higher levels)
    const horizontalLineStartX = horizontalLineEndX - horizontalLineLength;

    // Vertical line position (at start of horizontal lines)
    const verticalLineX = horizontalLineStartX;

    // Calculate row positions (centered on each row)
    // Add 4px offset for table padding (p-1 = 4px)
    const tableOffset = 4;

    // For 50px row with 2px line: center at 24px (line spans 24-26px)
    const firstPlayerY =
      tableOffset +
      playerIndices[0] * (PARTY_DISPLAY.ROW_HEIGHT + 2) +
      PARTY_DISPLAY.ROW_HEIGHT / 2 -
      PARTY_DISPLAY.LINE_THICKNESS / 2;

    const lastPlayerY =
      tableOffset +
      playerIndices[playerIndices.length - 1] * (PARTY_DISPLAY.ROW_HEIGHT + 2) +
      PARTY_DISPLAY.ROW_HEIGHT / 2 -
      PARTY_DISPLAY.LINE_THICKNESS / 2;

    // Vertical line connecting first and last player
    lines.push({
      type: "vertical",
      top: firstPlayerY,
      left: verticalLineX,
      height: lastPlayerY - firstPlayerY + PARTY_DISPLAY.LINE_THICKNESS,
    });

    // Horizontal lines for each player
    playerIndices.forEach((playerIndex) => {
      const playerY =
        tableOffset +
        playerIndex * (PARTY_DISPLAY.ROW_HEIGHT + 2) +
        PARTY_DISPLAY.ROW_HEIGHT / 2 -
        PARTY_DISPLAY.LINE_THICKNESS / 2;

      lines.push({
        type: "horizontal",
        top: playerY,
        left: horizontalLineStartX,
        width: horizontalLineLength,
      });
    });

    brackets.push({
      color: group.color,
      playerIndices,
      lines,
      level,
    });
  });

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      {brackets.map((bracket, bracketIndex) => (
        <div key={bracketIndex} className="absolute top-0 left-0 w-full h-full">
          {bracket.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="absolute opacity-80 transition-opacity duration-200 hover:opacity-100"
              style={{
                backgroundColor: bracket.color,
                top: `${line.top}px`,
                left: `${line.left}px`,
                width:
                  line.type === "horizontal"
                    ? `${line.width}px`
                    : `${PARTY_DISPLAY.LINE_THICKNESS}px`,
                height:
                  line.type === "vertical"
                    ? `${line.height}px`
                    : `${PARTY_DISPLAY.LINE_THICKNESS}px`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
