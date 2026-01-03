import React from "react";
import { MatchTable, TableRow, TableColumn } from "./MatchTable";
import { MatchPlayer } from "../../services/MatchService";
import { MatchStats } from "../../services/PlayerDataService";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";

interface TeamTableProps {
  players: MatchPlayer[];
  heroIconUrls?: Map<number, string>;
  rankImageUrls?: Map<number, string>;
  matchStatsMap?: Map<number, MatchStats>;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  players,
  heroIconUrls,
  rankImageUrls,
  matchStatsMap,
}) => {
  const renderColumnContent = (columnId: string, player: MatchPlayer) => {
    switch (columnId) {
      case "hero":
        const heroIconUrl = heroIconUrls?.get(player.hero_id);
        return heroIconUrl ? (
          <img
            src={heroIconUrl}
            alt={`Hero ${player.hero_id}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-[#e6ca9c]/40">?</span>
        );

      case "rank":
        const rankImageUrl = rankImageUrls?.get(player.account_id);
        return rankImageUrl ? (
          <img
            src={rankImageUrl}
            alt="Rank"
            className="max-h-[50px] w-auto object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-[#e6ca9c]/40">?</span>
        );

      case "player":
        return (
          <span
            className="text-[#e6ca9c] font-medium overflow-hidden text-ellipsis whitespace-nowrap w-full block"
            title={player.steam_name || "Unknown"}
          >
            {player.steam_name || "Unknown"}
          </span>
        );

      case "matches":
        const stats = matchStatsMap?.get(player.account_id);
        if (!stats) {
          return <span className="text-[#e6ca9c]/40">—</span>;
        }
        return (
          <div className="w-full flex gap-[10px]">
            {/* All time stats */}
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[#e6ca9c] text-sm font-medium">
                {stats.totalMatches}
              </span>
              <span className="text-[#9FA6AD] text-xs font-normal">
                {stats.totalWinrate}%
              </span>
            </div>
            {/* Last 14 days stats */}
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[#e6ca9c] text-sm font-medium">
                {stats.recentMatches}
              </span>
              <span className="text-[#9FA6AD] text-xs font-normal">
                {stats.recentWinrate}%
              </span>
            </div>
          </div>
        );

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
              noPadding={column.id === "hero" || column.id === "rank"}
            >
              {renderColumnContent(column.id, player)}
            </TableColumn>
          ))}
        </TableRow>
      ))}
    </MatchTable>
  );
};
