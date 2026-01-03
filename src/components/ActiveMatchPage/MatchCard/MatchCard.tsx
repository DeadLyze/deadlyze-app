import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MatchHistoryItem,
  PlayerDataService,
  AssetsService,
  MatchCacheService,
} from "../../../services";

interface MatchCardProps {
  match: MatchHistoryItem & { account_id: number };
  heroIconUrl: string | null;
  position: "top" | "bottom";
  visible: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  heroIconUrl,
  visible,
}) => {
  const { t } = useTranslation();
  const [playerBuild, setPlayerBuild] = useState<
    Array<{ name: string; imageUrl: string; itemId: number }>
  >([]);
  const [detailedStats, setDetailedStats] = useState<{
    kills: number;
    deaths: number;
    assists: number;
    netWorth: number;
    playerDamage: number;
    healing: number;
    duration: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const loadMatchDetails = async () => {
      try {
        // Check cache
        const cachedMetadata = MatchCacheService.getCachedMetadata(
          match.match_id,
          match.account_id
        );

        let metadata = cachedMetadata;

        if (!cachedMetadata) {
          setIsLoading(true);
        }
        setHasError(false);

        if (!metadata) {
          try {
            metadata = await PlayerDataService.fetchDetailedMatchMetadata(
              match.match_id
            );

            if (metadata) {
              MatchCacheService.setCachedMetadata(
                match.match_id,
                match.account_id,
                metadata
              );
            }
          } catch (error: any) {
            if (error.message === "TOO_MANY_REQUESTS") {
              MatchCacheService.addToRetryQueue(
                match.match_id,
                match.account_id
              );
              setHasError(true);
              return;
            }
            throw error;
          }
        }

        if (!metadata?.match_info?.players) {
          setHasError(true);
          return;
        }

        const player = metadata.match_info.players.find(
          (p) => p.account_id === match.account_id
        );

        if (!player) {
          setHasError(true);
          return;
        }

        if (player.stats && player.stats.length > 0) {
          // Use last stats entry (final match result)
          const lastStats = player.stats[player.stats.length - 1];

          setDetailedStats({
            kills: lastStats.kills || 0,
            deaths: lastStats.deaths || 0,
            assists: lastStats.assists || 0,
            netWorth: lastStats.net_worth || 0,
            playerDamage: lastStats.player_damage || 0,
            healing: lastStats.player_healing || 0,
            duration: metadata.match_info.duration_s || 0,
          });
        }

        if (player.items && player.items.length > 0) {
          const processedItems = new Set<number>();
          const currentBuild = new Map<
            number,
            { name: string; imageUrl: string; addTime: number; itemId: number }
          >();

          const itemIds = player.items
            .map((item) => item.item_id)
            .filter((id) => !processedItems.has(id));

          const itemsMap = await AssetsService.fetchItemsByIds(itemIds);

          for (const itemEvent of player.items) {
            const { item_id, game_time_s, sold_time_s } = itemEvent;

            if (!processedItems.has(item_id)) {
              const itemData = itemsMap.get(item_id);

              if (itemData && itemData.shop_image_small) {
                // This is an item (not an ability) - abilities don't have shop_image_small
                const imageUrl =
                  itemData.shop_image_small_webp ||
                  itemData.shop_image_webp ||
                  itemData.shop_image_small ||
                  "";

                if (!currentBuild.has(item_id)) {
                  currentBuild.set(item_id, {
                    name: itemData.name,
                    imageUrl,
                    addTime: game_time_s,
                    itemId: item_id,
                  });
                }

                if (sold_time_s > 0) {
                  currentBuild.delete(item_id);
                }
              }

              processedItems.add(item_id);
            }
          }

          const finalBuild: Array<{
            name: string;
            imageUrl: string;
            itemId: number;
          }> = Array.from(currentBuild.values())
            .sort((a, b) => a.addTime - b.addTime)
            .slice(0, 12)
            .map((item) => ({
              name: item.name,
              imageUrl: item.imageUrl,
              itemId: item.itemId,
            }));

          setPlayerBuild(finalBuild);
        }
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchDetails();
  }, [match.match_id, match.account_id, visible]);

  if (!visible) return null;

  const isWin = match.match_result === match.player_team;

  const matchDate = new Date(match.start_time * 1000);
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = matchDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const duration = detailedStats?.duration || 0;

  const borderColor = isWin ? "#21C271" : "#C95555";
  const bgColor = isWin
    ? "rgba(33, 194, 113, 0.08)"
    : "rgba(201, 85, 85, 0.08)";

  return (
    <div
      className="match-card fixed pointer-events-none z-[99999]"
      style={{
        width: "240px",
        borderRadius: "8px",
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.9)",
        padding: "12px",
        color: "#e6ca9c",
        fontSize: "12px",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div
          className="flex-shrink-0 rounded overflow-hidden bg-[#174842]/40 flex items-center justify-center"
          style={{ width: "50px", height: "75px" }}
        >
          {heroIconUrl ? (
            <img
              src={heroIconUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[#e6ca9c]/40 text-lg font-bold">?</span>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-0.5 text-center">
          <div className="text-[#9FA6AD] text-[11px]">
            {t("activeMatch.matchCard.date")}
          </div>
          <div className="font-semibold text-[13px]">
            {formattedDate} {formattedTime}
          </div>
          <div className="text-[#9FA6AD] text-[11px] mt-1">
            {t("activeMatch.matchCard.duration")}
          </div>
          <div className="font-semibold text-[13px]">
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      <div className="my-2" style={{ height: "1px", background: "#2a5c54" }} />

      {hasError || isLoading ? (
        <div className="text-center py-4 text-[#9FA6AD] text-xs">
          {isLoading
            ? t("activeMatch.matchCard.loading")
            : t("activeMatch.matchCard.noData")}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-2 space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.souls")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.netWorth.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.kills")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.kills || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.deaths")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.deaths || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.assists")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.assists || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.damage")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.playerDamage.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9FA6AD] text-[11px]">
                {t("activeMatch.matchCard.healing")}
              </span>
              <span className="font-medium text-[11px]">
                {detailedStats?.healing.toLocaleString() || "0"}
              </span>
            </div>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const item = playerBuild[i];
              return (
                <div
                  key={i}
                  className="relative rounded overflow-hidden"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: item ? "#2a5c54" : "#174842",
                    border: item
                      ? "1px solid #21C271"
                      : "1px solid rgba(42, 92, 84, 0.5)",
                    opacity: item ? 1 : 0.5,
                    padding: 0,
                    margin: 0,
                  }}
                  title={item ? item.name : ""}
                >
                  {item && item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        padding: 0,
                        margin: 0,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
