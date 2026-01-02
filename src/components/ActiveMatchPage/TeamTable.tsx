import React from "react";
import { MatchTable, TableRow, TableColumn } from "./MatchTable";
import { MatchPlayer } from "../../services/MatchService";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";

interface TeamTableProps {
  players: MatchPlayer[];
}

export const TeamTable: React.FC<TeamTableProps> = ({ players }) => {
  const renderColumnContent = (
    columnId: string,
    player: MatchPlayer,
    index: number
  ) => {
    switch (columnId) {
      case "hero":
        return (
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#21c271]/20 to-[#174842]/40 border border-[#21c271]/30 flex items-center justify-center">
            <span className="text-[#21c271] font-semibold text-xs">
              {player.hero_id || "?"}
            </span>
          </div>
        );

      case "rank":
        return (
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#e6ca9c]/20 to-[#174842]/40 border border-[#e6ca9c]/30 flex items-center justify-center">
            <span className="text-[#e6ca9c] font-semibold text-xs">?</span>
          </div>
        );

      case "player":
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[#e6ca9c] font-medium">
              {player.steam_name || "Unknown"}
            </span>
            <span className="text-[#e6ca9c]/50 text-xs">
              ID: {player.account_id || "N/A"}
            </span>
          </div>
        );

      case "matches":
        return <span className="text-[#e6ca9c]/40">—</span>;

      default:
        return null;
    }
  };

  return (
    <MatchTable>
      {players.slice(0, 6).map((player, index) => (
        <TableRow key={player.account_id || index}>
          {MATCH_TABLE_COLUMNS.map((column) => (
            <TableColumn
              key={column.id}
              flex={column.flex}
              className={column.align === "left" ? "justify-start" : ""}
            >
              {renderColumnContent(column.id, player, index)}
            </TableColumn>
          ))}
        </TableRow>
      ))}
    </MatchTable>
  );
};
