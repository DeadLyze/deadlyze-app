import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaAnchor, FaMask, FaArrowRotateRight } from "react-icons/fa6";
import { GiSkullCrossedBones } from "react-icons/gi";
import { MatchTable, TableRow, TableColumn } from "./MatchTable";
import { MatchPlayer } from "../../services/MatchService";
import {
  MatchStats,
  PlayerRelationStats,
  PlayerTag,
  PlayerDataService,
} from "../../services/PlayerDataService";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";
import { CacheService } from "../../services/CacheService";
import {
  PLAYER_TAG_COLORS,
  PLAYER_TAG_THRESHOLDS,
} from "../../constants/playerTagConstants";

interface TeamTableProps {
  players: MatchPlayer[];
  heroIconUrls?: Map<number, string>;
  rankImageUrls?: Map<number, string>;
  matchStatsMap?: Map<number, MatchStats>;
  relationStatsMap?: Map<number, PlayerRelationStats>;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  players,
  heroIconUrls,
  rankImageUrls,
  matchStatsMap,
  relationStatsMap,
}) => {
  const { t } = useTranslation();
  const [playerTagsMap, setPlayerTagsMap] = useState<Map<number, PlayerTag[]>>(
    new Map()
  );

  useEffect(() => {
    const loadPlayerTags = async () => {
      if (!matchStatsMap) return;

      const tagsMap = new Map<number, PlayerTag[]>();

      for (const player of players) {
        const matchStats = matchStatsMap.get(player.account_id);
        if (matchStats) {
          const tags = await PlayerDataService.determinePlayerTags(
            matchStats,
            player.hero_id,
            player.account_id
          );
          tagsMap.set(player.account_id, tags);
        }
      }

      setPlayerTagsMap(tagsMap);
    };

    loadPlayerTags();
  }, [players, matchStatsMap]);

  const renderColumnContent = (columnId: string, player: MatchPlayer) => {
    switch (columnId) {
      case "hero":
        const heroIconUrl = heroIconUrls?.get(player.hero_id);
        return heroIconUrl ? (
          <img
            src={heroIconUrl}
            alt={`Hero ${player.hero_id}`}
            className="w-full h-full object-contain"
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

      case "recent_matches": {
        const recentMatchStats = matchStatsMap?.get(player.account_id);
        const recentMatches = recentMatchStats?.last5Matches || [];
        return (
          <div className="flex w-full h-full gap-0">
            {recentMatches.map((match, idx) => {
              const isWin = match.match_result === match.player_team;
              const heroIconUrl = heroIconUrls?.get(match.hero_id);
              const glowColor = isWin
                ? "rgba(45, 200, 100, 0.6)"
                : "rgba(200, 60, 60, 0.6)";
              const barColor = isWin
                ? "rgba(45, 200, 100, 0.9)"
                : "rgba(200, 60, 60, 0.9)";
              const barGlow = isWin
                ? "rgba(45, 200, 100, 0.4)"
                : "rgba(200, 60, 60, 0.4)";

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(ellipse 100% 80% at 50% 75%, ${glowColor} 0%, transparent 70%)`,
                  }}
                >
                  {heroIconUrl ? (
                    <img
                      src={heroIconUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                  {/* Bottom bar with glow */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{
                      background: `linear-gradient(to top, ${barColor} 0%, ${barGlow} 100%)`,
                      boxShadow: `0 -4px 8px ${barGlow}`,
                    }}
                  />
                </div>
              );
            })}
            {/* Fill empty slots if less than 5 matches */}
            {Array.from({ length: 5 - recentMatches.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex-1"
                style={{ backgroundColor: "#1a1a1a" }}
              />
            ))}
          </div>
        );
      }

      case "relation": {
        const currentUser = CacheService.getCurrentUser();
        const relationStats = relationStatsMap?.get(player.account_id);

        if (
          !currentUser.accountId ||
          player.account_id === currentUser.accountId
        ) {
          return <span className="text-[#e6ca9c]/40">—</span>;
        }

        if (!relationStats) {
          return <span className="text-[#e6ca9c]/40">—</span>;
        }

        return (
          <div className="w-full flex gap-[10px]">
            {/* With player stats */}
            <div className="flex-1 flex items-center justify-center gap-1">
              <span
                className={`text-sm font-medium ${
                  relationStats.withPlayer.wins > 0
                    ? "text-[#2dc864]"
                    : "text-[#e6ca9c]"
                }`}
              >
                {relationStats.withPlayer.wins}
              </span>
              <span className="text-xs text-[#9FA6AD]">/</span>
              <span
                className={`text-sm font-medium ${
                  relationStats.withPlayer.losses > 0
                    ? "text-[#c83c3c]"
                    : "text-[#e6ca9c]"
                }`}
              >
                {relationStats.withPlayer.losses}
              </span>
            </div>
            {/* Against player stats */}
            <div className="flex-1 flex items-center justify-center gap-1">
              <span
                className={`text-sm font-medium ${
                  relationStats.againstPlayer.wins > 0
                    ? "text-[#2dc864]"
                    : "text-[#e6ca9c]"
                }`}
              >
                {relationStats.againstPlayer.wins}
              </span>
              <span className="text-xs text-[#9FA6AD]">/</span>
              <span
                className={`text-sm font-medium ${
                  relationStats.againstPlayer.losses > 0
                    ? "text-[#c83c3c]"
                    : "text-[#e6ca9c]"
                }`}
              >
                {relationStats.againstPlayer.losses}
              </span>
            </div>
          </div>
        );
      }

      case "tags": {
        const tags = playerTagsMap.get(player.account_id);

        if (!tags || tags.length === 0) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[#e6ca9c]/40 text-xs">-</span>
            </div>
          );
        }

        const renderTagIcon = (tag: PlayerTag) => {
          const iconStyle = { width: "23px", height: "23px" };
          const color =
            PLAYER_TAG_COLORS[
              tag.type.toUpperCase() as keyof typeof PLAYER_TAG_COLORS
            ];

          const getTooltip = () => {
            const tagName = t(`activeMatch.tags.${tag.type}`);

            switch (tag.type) {
              case "smurf":
                return `${tagName}: ${t("activeMatch.tags.tooltips.smurf", {
                  totalValue: tag.totalValue,
                  recentValue: tag.recentValue,
                  days: 14,
                })}`;
              case "loser":
                return `${tagName}: ${t("activeMatch.tags.tooltips.loser", {
                  recentValue: tag.recentValue,
                  days: 14,
                })}`;
              case "spammer":
                return `${tagName}: ${t("activeMatch.tags.tooltips.spammer", {
                  value: tag.value,
                  days: 14,
                })}`;
              case "cheater":
                return `${tagName}: ${t("activeMatch.tags.tooltips.cheater", {
                  value: tag.value,
                  matches: PLAYER_TAG_THRESHOLDS.CHEATER_MATCHES_COUNT,
                })}`;
              default:
                return "";
            }
          };

          const iconElement = (() => {
            switch (tag.type) {
              case "smurf":
                return <FaMask style={{ ...iconStyle, color }} />;
              case "loser":
                return <FaAnchor style={{ ...iconStyle, color }} />;
              case "spammer":
                return <FaArrowRotateRight style={{ ...iconStyle, color }} />;
              case "cheater":
                return <GiSkullCrossedBones style={{ ...iconStyle, color }} />;
              default:
                return null;
            }
          })();

          return (
            <div title={getTooltip()} className="cursor-default">
              {iconElement}
            </div>
          );
        };

        const getLayoutClass = () => {
          if (tags.length === 1) return "flex items-center justify-center";
          if (tags.length === 2)
            return "flex flex-row items-center justify-center gap-1";
          if (tags.length === 3)
            return "flex flex-col items-center justify-center gap-1";
          return "grid grid-cols-2 gap-1";
        };

        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className={getLayoutClass()}>
              {tags.length === 3 ? (
                <>
                  <div className="flex flex-row gap-1">
                    {tags.slice(0, 2).map((tag, index) => (
                      <div key={index}>{renderTagIcon(tag)}</div>
                    ))}
                  </div>
                  <div>{renderTagIcon(tags[2])}</div>
                </>
              ) : (
                tags.map((tag, index) => (
                  <div key={index}>{renderTagIcon(tag)}</div>
                ))
              )}
            </div>
          </div>
        );
      }

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
              noPadding={
                column.id === "hero" ||
                column.id === "rank" ||
                column.id === "recent_matches" ||
                column.id === "tags"
              }
            >
              {renderColumnContent(column.id, player)}
            </TableColumn>
          ))}
        </TableRow>
      ))}
    </MatchTable>
  );
};
