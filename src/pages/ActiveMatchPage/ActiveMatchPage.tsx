import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoMdExit } from "react-icons/io";
import { FaRegQuestionCircle } from "react-icons/fa";
import MatchSearchInput from "../../components/ActiveMatchPage/MatchSearchInput/MatchSearchInput";
import { TeamTable } from "../../components/ActiveMatchPage/TeamTable";
import { TableHeader } from "../../components/ActiveMatchPage/TableHeader";
import {
  MatchCardProvider,
  MatchCardPortal,
} from "../../components/ActiveMatchPage/MatchCard";
import {
  MatchService,
  MatchData,
  MatchPlayer,
  AssetsService,
  PlayerDataService,
  PartyService,
  Rank,
  MatchStats,
  PlayerRelationStats,
  PartyGroup,
  CacheService,
  MatchCacheService,
} from "../../services";
import { ASSET_RETRY_DELAY_MS } from "../../constants/uiConstants";

function ActiveMatchPage() {
  const { t } = useTranslation();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [heroIconUrls, setHeroIconUrls] = useState<Map<number, string>>(
    new Map()
  );
  const [rankImageUrls, setRankImageUrls] = useState<Map<number, string>>(
    new Map()
  );
  const [matchStatsMap, setMatchStatsMap] = useState<Map<number, MatchStats>>(
    new Map()
  );
  const [relationStatsMap, setRelationStatsMap] = useState<
    Map<number, PlayerRelationStats>
  >(new Map());
  const [partyGroups, setPartyGroups] = useState<PartyGroup[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [isDataFullyLoaded, setIsDataFullyLoaded] = useState<boolean>(false);

  // Load ranks once on mount
  // Note: In development mode with React StrictMode, this effect will run twice
  // This is expected behavior and doesn't affect production builds
  useEffect(() => {
    const loadRanks = async () => {
      try {
        const ranksData = await AssetsService.fetchAllRanks();
        setRanks(ranksData);
      } catch (error) {}
    };

    loadRanks();
  }, []);

  // Load all match data in parallel when match data changes
  // NOTE: Match data is cached ONLY after ALL operations complete successfully
  // This prevents partial data from being cached if user exits early
  useEffect(() => {
    if (!matchData) return;

    let isCancelled = false;
    setIsDataFullyLoaded(false);

    const loadMatchAssets = async () => {
      const allPlayers = [...matchData.amber_team, ...matchData.sapphire_team];
      let loadedPartyGroups: PartyGroup[] = [];

      // Start party detection early (runs in parallel with other loads)
      const partyGroupsPromise = PartyService.detectPartyGroups(allPlayers)
        .then((groups) => {
          loadedPartyGroups = groups;
          if (!isCancelled) {
            setPartyGroups(groups);
          }
          return groups;
        })
        .catch((error) => {
          console.error("Failed to load party groups:", error);
          if (!isCancelled) {
            setPartyGroups([]);
          }
          return [];
        });

      // Load hero icons
      const heroIds = allPlayers.map((p) => p.hero_id);
      const heroMap = await AssetsService.fetchHeroesByIds(heroIds);

      const heroUrls = new Map<number, string>();
      const failedHeroes: number[] = [];

      heroIds.forEach((heroId) => {
        const hero = heroMap.get(heroId);
        const imageUrl =
          hero?.images.selection_image_webp || hero?.images.top_bar_image_webp;
        if (imageUrl) {
          heroUrls.set(heroId, imageUrl);
        } else {
          failedHeroes.push(heroId);
        }
      });

      setHeroIconUrls(heroUrls);

      // Load player MMR and rank images
      const accountIds = allPlayers.map((p) => p.account_id);
      const mmrMap = await PlayerDataService.fetchPlayerMMRMap(accountIds);

      const rankUrls = new Map<number, string>();
      const failedRanks: number[] = [];

      accountIds.forEach((accountId) => {
        const mmr = mmrMap.get(accountId);
        if (mmr) {
          const imageUrl = AssetsService.getRankImageUrl(
            mmr.division,
            mmr.division_tier,
            ranks
          );
          if (imageUrl) {
            rankUrls.set(accountId, imageUrl);
          } else {
            failedRanks.push(accountId);
          }
        } else {
          failedRanks.push(accountId);
        }
      });

      setRankImageUrls(rankUrls);

      // Load match statistics for all players
      const statsMap = new Map<number, MatchStats>();
      await Promise.all(
        allPlayers.map(async (player) => {
          const stats = await PlayerDataService.fetchPlayerMatchStats(
            player.account_id,
            player.hero_id
          );
          statsMap.set(player.account_id, stats);
        })
      );
      setMatchStatsMap(statsMap);

      // Collect all hero IDs from last 5 matches
      const last5HeroIds = new Set<number>();
      statsMap.forEach((stats) => {
        stats.last5Matches.forEach((match) => {
          last5HeroIds.add(match.hero_id);
        });
      });

      // Load heroes from last 5 matches if not already loaded
      const missingHeroIds = Array.from(last5HeroIds).filter(
        (id) => !heroUrls.has(id)
      );
      if (missingHeroIds.length > 0) {
        const additionalHeroMap = await AssetsService.fetchHeroesByIds(
          missingHeroIds
        );
        missingHeroIds.forEach((heroId) => {
          const hero = additionalHeroMap.get(heroId);
          const imageUrl =
            hero?.images.selection_image_webp ||
            hero?.images.top_bar_image_webp;
          if (imageUrl) {
            heroUrls.set(heroId, imageUrl);
          }
        });
        setHeroIconUrls(new Map(heroUrls));
      }

      // Load player relation stats if current user is available
      const currentUser = CacheService.getCurrentUser();
      if (currentUser.accountId) {
        const relationStats =
          await PlayerDataService.fetchPlayerRelationStatsMap(
            currentUser.accountId,
            accountIds
          );
        setRelationStatsMap(relationStats);
      }

      // Wait for party groups to finish loading
      await partyGroupsPromise;

      // Cache match data only after ALL data is loaded and if not cancelled
      if (!isCancelled && matchData && matchData.match_id) {
        MatchCacheService.setCachedMatch(matchData.match_id.toString(), {
          matchData,
          heroIconUrls: heroUrls,
          rankImageUrls: rankUrls,
          matchStatsMap: statsMap,
          relationStatsMap,
          partyGroups: loadedPartyGroups,
        });
        setIsDataFullyLoaded(true);
      }

      // Retry failed loads after a short delay
      if (failedHeroes.length > 0 || failedRanks.length > 0) {
        setTimeout(
          () => retryFailedAssets(failedHeroes, failedRanks, mmrMap),
          ASSET_RETRY_DELAY_MS
        );
      }

      // Process retry queue for metadata if there are any pending retries
      if (MatchCacheService.hasRetryQueue()) {
        setTimeout(() => {
          MatchCacheService.processRetryQueue(async (matchId, accountId) => {
            try {
              return await PlayerDataService.fetchDetailedMatchMetadata(
                matchId
              );
            } catch {
              return null;
            }
          });
        }, 500);
      }

      // Preload metadata for all recent matches
      preloadMatchCardsMetadata(allPlayers, statsMap);
    };

    const preloadMatchCardsMetadata = async (
      players: MatchPlayer[],
      statsMap: Map<number, MatchStats>
    ) => {
      // Collect unique match IDs and player lists
      const uniqueMatches = new Map<
        number,
        { matchId: number; accountIds: number[] }
      >();

      players.forEach((player) => {
        const stats = statsMap.get(player.account_id);
        if (stats?.last5Matches) {
          stats.last5Matches.forEach((match) => {
            if (!uniqueMatches.has(match.match_id)) {
              uniqueMatches.set(match.match_id, {
                matchId: match.match_id,
                accountIds: [],
              });
            }
            uniqueMatches
              .get(match.match_id)!
              .accountIds.push(player.account_id);
          });
        }
      });

      // Load metadata for unique matches only (one request = all players)
      const preloadPromises: Promise<void>[] = [];
      let delay = 0;

      uniqueMatches.forEach(({ matchId, accountIds }) => {
        // Check if any player has cached data
        const hasAnyCached = accountIds.some((accountId) =>
          MatchCacheService.getCachedMetadata(matchId, accountId)
        );

        if (!hasAnyCached) {
          // Make ONE request per match, fetch data for ALL players
          const promise = new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                const metadata =
                  await PlayerDataService.fetchDetailedMatchMetadata(matchId);

                if (metadata) {
                  // Save metadata for ALL players from this match
                  accountIds.forEach((accountId) => {
                    MatchCacheService.setCachedMetadata(
                      matchId,
                      accountId,
                      metadata
                    );
                  });
                }
              } catch (error: any) {
                if (error.message === "TOO_MANY_REQUESTS") {
                  // Add all players to retry queue
                  accountIds.forEach((accountId) => {
                    MatchCacheService.addToRetryQueue(matchId, accountId);
                  });
                }
              }
              resolve();
            }, delay);
          });

          preloadPromises.push(promise);
          delay += 1;
        }
      });

      Promise.all(preloadPromises).catch(() => {});
    };

    const retryFailedAssets = async (
      failedHeroes: number[],
      failedRanks: number[],
      mmrMap: Map<number, any>
    ) => {
      if (isCancelled) return;

      let hasUpdates = false;

      // Retry hero icons
      if (failedHeroes.length > 0) {
        const retryHeroMap = await AssetsService.fetchHeroesByIds(failedHeroes);
        const newHeroUrls = new Map(heroIconUrls);

        failedHeroes.forEach((heroId) => {
          const hero = retryHeroMap.get(heroId);
          const imageUrl =
            hero?.images.selection_image_webp ||
            hero?.images.top_bar_image_webp;
          if (imageUrl) {
            newHeroUrls.set(heroId, imageUrl);
          }
        });

        if (newHeroUrls.size > heroIconUrls.size && !isCancelled) {
          setHeroIconUrls(newHeroUrls);
          hasUpdates = true;
        }
      }

      // Retry rank images
      if (failedRanks.length > 0) {
        const newRankUrls = new Map(rankImageUrls);

        failedRanks.forEach((accountId) => {
          const mmr = mmrMap.get(accountId);
          if (mmr) {
            const imageUrl = AssetsService.getRankImageUrl(
              mmr.division,
              mmr.division_tier,
              ranks
            );
            if (imageUrl) {
              newRankUrls.set(accountId, imageUrl);
            }
          }
        });

        if (newRankUrls.size > rankImageUrls.size && !isCancelled) {
          setRankImageUrls(newRankUrls);
          hasUpdates = true;
        }
      }

      // Update cache if there were successful retries and data was fully loaded
      if (hasUpdates && isDataFullyLoaded && !isCancelled && matchData) {
        const cachedMatch = MatchCacheService.getCachedMatch(
          matchData.match_id.toString()
        );
        if (cachedMatch) {
          MatchCacheService.setCachedMatch(matchData.match_id.toString(), {
            ...cachedMatch,
            heroIconUrls: new Map([
              ...cachedMatch.heroIconUrls,
              ...heroIconUrls,
            ]),
            rankImageUrls: new Map([
              ...cachedMatch.rankImageUrls,
              ...rankImageUrls,
            ]),
          });
        }
      }
    };

    loadMatchAssets();

    return () => {
      isCancelled = true;
    };
  }, [matchData, ranks]);
  const handleSearch = async (matchId: string) => {
    setError(false);

    const cachedMatch = MatchCacheService.getCachedMatch(matchId);
    if (cachedMatch) {
      setMatchData(cachedMatch.matchData);
      setHeroIconUrls(cachedMatch.heroIconUrls);
      setRankImageUrls(cachedMatch.rankImageUrls);
      setMatchStatsMap(cachedMatch.matchStatsMap);
      setRelationStatsMap(cachedMatch.relationStatsMap);
      setPartyGroups(cachedMatch.partyGroups);
      return;
    }

    try {
      const data = await MatchService.fetchMatchData(matchId);
      setMatchData(data);
    } catch (err) {
      setError(true);
    }
  };

  const handleExit = () => {
    setMatchData(null);
  };

  const handleInfo = () => {};

  return (
    <MatchCardProvider>
      <div className="w-full h-full bg-gradient-to-r from-[#174842] to-[#10262f] overflow-y-auto relative">
        {matchData && (
          <div
            className="absolute flex items-start gap-[15px]"
            style={{
              pointerEvents: "none",
              top: "16px",
              left: "16px",
              zIndex: 9999,
            }}
          >
            <button
              onClick={handleExit}
              className="flex items-center justify-center transition-opacity hover:opacity-70"
              style={{
                pointerEvents: "auto",
                width: "24px",
                height: "24px",
              }}
              aria-label="Exit"
            >
              <IoMdExit size={24} color="#21C271" />
            </button>
            <button
              onClick={handleInfo}
              className="flex items-center justify-center transition-opacity hover:opacity-70"
              style={{
                pointerEvents: "auto",
                width: "24px",
                height: "24px",
              }}
              aria-label="Info"
            >
              <FaRegQuestionCircle size={24} color="#21C271" />
            </button>
          </div>
        )}

        {!matchData ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <MatchSearchInput onSearch={handleSearch} />
            {error && (
              <div className="absolute top-[calc(50%+180px)] text-[#c95555] text-sm px-6 py-3 bg-[#c95555]/10 border border-[#c95555]/30 rounded-md max-w-[400px] text-center">
                {t("activeMatch.searchForm.error")}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-[1400px] px-5">
              <div>
                <TeamTable
                  players={matchData.amber_team}
                  heroIconUrls={heroIconUrls}
                  rankImageUrls={rankImageUrls}
                  matchStatsMap={matchStatsMap}
                  relationStatsMap={relationStatsMap}
                  partyGroups={partyGroups}
                  isTopTable={true}
                />
                <TableHeader />
                <TeamTable
                  players={matchData.sapphire_team}
                  heroIconUrls={heroIconUrls}
                  rankImageUrls={rankImageUrls}
                  matchStatsMap={matchStatsMap}
                  relationStatsMap={relationStatsMap}
                  partyGroups={partyGroups}
                  isTopTable={false}
                />
              </div>
            </div>
          </div>
        )}
        <MatchCardPortal />
      </div>
    </MatchCardProvider>
  );
}

export default ActiveMatchPage;
