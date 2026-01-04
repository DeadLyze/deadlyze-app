import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaAnchor,
  FaMask,
  FaPersonWalkingArrowLoopLeft,
} from "react-icons/fa6";
import { GiSkullCrossedBones } from "react-icons/gi";
import { MatchTable, TableRow, TableColumn } from "./MatchTable";
import { PartyBrackets } from "./PartyBrackets";
import { MatchPlayer } from "../../services/MatchService";
import {
  MatchStats,
  PlayerRelationStats,
  PlayerTag,
  PlayerDataService,
} from "../../services/PlayerDataService";
import { PartyGroup } from "../../services";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";
import { CacheService } from "../../services/CacheService";
import { PLAYER_TAG_THRESHOLDS } from "../../constants/playerTagConstants";
import {
  MATCH_RESULT_COLORS,
  PARTY_BRACKET_WIDTH,
  TABLE_ROW_HEIGHT,
} from "../../constants/uiConstants";
import { useMatchCard } from "./MatchCard";

const TAG_ICON_SIZE = "23px";
const TAG_COLOR = "#e6ca9c";
const TEAM_SIZE = 6;

interface TeamTableProps {
  players: MatchPlayer[];
  heroIconUrls?: Map<number, string>;
  rankImageUrls?: Map<number, string>;
  matchStatsMap?: Map<number, MatchStats>;
  relationStatsMap?: Map<number, PlayerRelationStats>;
  partyGroups?: PartyGroup[];
  playerTagsMap?: Map<number, PlayerTag[]>;
  isTopTable?: boolean;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  players,
  heroIconUrls,
  rankImageUrls,
  matchStatsMap,
  relationStatsMap,
  partyGroups = [],
  playerTagsMap = new Map(),
  isTopTable = false,
}) => {
  const { t } = useTranslation();
  const matchIconRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { showCard, hideCard } = useMatchCard();

  const renderPlayerTag = (tag: PlayerTag): React.ReactNode => {
    const iconStyle = { width: TAG_ICON_SIZE, height: TAG_ICON_SIZE };

    const getTagIcon = (): React.ReactNode => {
      switch (tag.type) {
        case "smurf":
          return <FaMask style={{ ...iconStyle, color: TAG_COLOR }} />;
        case "loser":
          return <FaAnchor style={{ ...iconStyle, color: TAG_COLOR }} />;
        case "spammer":
          return (
            <FaPersonWalkingArrowLoopLeft
              style={{ ...iconStyle, color: TAG_COLOR }}
            />
          );
        case "cheater":
          return (
            <GiSkullCrossedBones style={{ ...iconStyle, color: TAG_COLOR }} />
          );
        default:
          return null;
      }
    };

    const getTooltip = (): string => {
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

    return (
      <div title={getTooltip()} className="cursor-default">
        {getTagIcon()}
      </div>
    );
  };

  const formatStreak = (streak: number | null): string => {
    if (streak === null || streak === 0) return "—";
    return streak > 0 ? `+${streak}` : `${streak}`;
  };

  const renderStatsColumn = (
    stats: MatchStats | undefined,
    renderContent: (s: MatchStats) => React.ReactNode
  ) => {
    if (!stats) {
      return <span className="text-[#e6ca9c]/40">—</span>;
    }
    return renderContent(stats);
  };

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
        return renderStatsColumn(
          matchStatsMap?.get(player.account_id),
          (stats) => (
            <div className="w-full flex gap-[10px]">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {stats.totalMatches}
                </span>
                <span className="text-[#9FA6AD] text-xs font-normal">
                  {stats.totalWinrate}%
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {stats.recentMatches}
                </span>
                <span className="text-[#9FA6AD] text-xs font-normal">
                  {stats.recentWinrate}%
                </span>
              </div>
            </div>
          )
        );

      case "current_hero": {
        const heroStats = matchStatsMap?.get(
          player.account_id
        )?.currentHeroStats;
        if (!heroStats || heroStats.matches === 0) {
          return <span className="text-[#e6ca9c]/40">—</span>;
        }
        return (
          <div className="w-full flex gap-[10px]">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[#e6ca9c] text-sm font-medium">
                {heroStats.matches}
              </span>
              <span className="text-[#9FA6AD] text-xs font-normal">
                {heroStats.winrate}%
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-[#e6ca9c] text-sm font-medium">
                {heroStats.kd.toFixed(2)}
              </span>
            </div>
          </div>
        );
      }

      case "current_streak":
        return renderStatsColumn(
          matchStatsMap?.get(player.account_id),
          (stats) => (
            <div className="w-full flex gap-[10px]">
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {formatStreak(stats.currentStreak)}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {formatStreak(stats.currentHeroStreak)}
                </span>
              </div>
            </div>
          )
        );

      case "average_stats":
        return renderStatsColumn(
          matchStatsMap?.get(player.account_id),
          (stats) => (
            <div className="w-full flex gap-[10px]">
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {stats.avgLastHits} / {stats.avgDenies}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#e6ca9c] text-sm font-medium">
                  {stats.avgNetWorth.toLocaleString()}
                </span>
              </div>
            </div>
          )
        );

      case "recent_matches": {
        const recentMatchStats = matchStatsMap?.get(player.account_id);
        const recentMatches = recentMatchStats?.last5Matches || [];
        return (
          <div className="flex w-full h-full gap-0">
            {recentMatches.map((match, idx) => {
              const isWin = match.match_result === match.player_team;
              const heroIconUrl = heroIconUrls?.get(match.hero_id);
              const barColor = isWin
                ? MATCH_RESULT_COLORS.WIN_BAR
                : MATCH_RESULT_COLORS.LOSS_BAR;
              const barGlow = isWin
                ? MATCH_RESULT_COLORS.WIN_GLOW
                : MATCH_RESULT_COLORS.LOSS_GLOW;
              const refKey = `${player.account_id}-${idx}`;

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    if (el) {
                      matchIconRefs.current.set(refKey, el);
                    } else {
                      matchIconRefs.current.delete(refKey);
                    }
                  }}
                  className="flex-1 flex items-center justify-center relative cursor-pointer"
                  onMouseEnter={() => {
                    const triggerElement = matchIconRefs.current.get(refKey);
                    if (triggerElement) {
                      showCard({
                        match: {
                          ...match,
                          account_id: player.account_id,
                        },
                        heroIconUrl: heroIconUrl || null,
                        position: isTopTable ? "top" : "bottom",
                        triggerElement,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    hideCard();
                  }}
                  style={{
                    boxShadow: isWin
                      ? "inset 0 -20px 30px -15px rgba(67, 179, 71, 0.6)"
                      : "inset 0 -20px 30px -15px rgba(244, 67, 54, 0.6)",
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
              <div key={`empty-${idx}`} className="flex-1" />
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
          return null;
        }

        if (!relationStats) {
          return <span className="text-[#e6ca9c]/40">—</span>;
        }

        return (
          <div className="w-full flex gap-[10px]">
            <div className="flex-1 flex items-center justify-center gap-1">
              <span className="text-sm font-medium text-[#e6ca9c]">
                {relationStats.withPlayer.wins}
              </span>
              <span className="text-xs text-[#9FA6AD]">/</span>
              <span className="text-sm font-medium text-[#e6ca9c]">
                {relationStats.withPlayer.losses}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center gap-1">
              <span className="text-sm font-medium text-[#e6ca9c]">
                {relationStats.againstPlayer.wins}
              </span>
              <span className="text-xs text-[#9FA6AD]">/</span>
              <span className="text-sm font-medium text-[#e6ca9c]">
                {relationStats.againstPlayer.losses}
              </span>
            </div>
          </div>
        );
      }

      case "tags": {
        const tags = playerTagsMap.get(player.account_id);

        if (!playerTagsMap.has(player.account_id)) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[#e6ca9c]/40 text-xs">-</span>
            </div>
          );
        }

        if (!tags || tags.length === 0) {
          return <div className="w-full h-full" />;
        }

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
                      <div key={index}>{renderPlayerTag(tag)}</div>
                    ))}
                  </div>
                  <div>{renderPlayerTag(tags[2])}</div>
                </>
              ) : (
                tags.map((tag, index) => (
                  <div key={index}>{renderPlayerTag(tag)}</div>
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

  const displayedPlayers = players.slice(0, TEAM_SIZE);

  return (
    <div className="relative flex">
      <div
        className="relative flex-shrink-0"
        style={{ width: `${PARTY_BRACKET_WIDTH}px` }}
      >
        {partyGroups.length === 0 && (
          <div className="absolute inset-0 flex flex-col justify-around">
            {displayedPlayers.map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-[#21C271] text-xs opacity-40"
                style={{ height: `${TABLE_ROW_HEIGHT}px` }}
              >
                —
              </div>
            ))}
          </div>
        )}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: `${displayedPlayers.length * TABLE_ROW_HEIGHT}px` }}
        >
          <PartyBrackets players={displayedPlayers} partyGroups={partyGroups} />
        </div>
      </div>

      <div className="flex-initial">
        <MatchTable>
          {displayedPlayers.map((player, index) => (
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
      </div>
    </div>
  );
};
