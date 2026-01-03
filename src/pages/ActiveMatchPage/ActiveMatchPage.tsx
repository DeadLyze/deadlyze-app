import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoMdExit } from "react-icons/io";
import { FaRegQuestionCircle } from "react-icons/fa";
import MatchSearchInput from "../../components/ActiveMatchPage/MatchSearchInput/MatchSearchInput";
import { TeamTable } from "../../components/ActiveMatchPage/TeamTable";
import { TableHeader } from "../../components/ActiveMatchPage/TableHeader";
import {
  MatchService,
  MatchData,
  AssetsService,
  PlayerDataService,
  PartyService,
  Rank,
  MatchStats,
  PlayerRelationStats,
  PartyGroup,
  CacheService,
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
  useEffect(() => {
    if (!matchData) return;

    const loadMatchAssets = async () => {
      const allPlayers = [...matchData.amber_team, ...matchData.sapphire_team];

      // Start party detection early (runs in parallel with other loads)
      PartyService.detectPartyGroups(allPlayers)
        .then((groups) => setPartyGroups(groups))
        .catch((error) => {
          console.error("Failed to load party groups:", error);
          setPartyGroups([]);
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
        accountIds.map(async (accountId) => {
          const stats = await PlayerDataService.fetchPlayerMatchStats(
            accountId
          );
          statsMap.set(accountId, stats);
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

      // Retry failed loads after a short delay
      if (failedHeroes.length > 0 || failedRanks.length > 0) {
        setTimeout(
          () => retryFailedAssets(failedHeroes, failedRanks, mmrMap),
          ASSET_RETRY_DELAY_MS
        );
      }
    };

    const retryFailedAssets = async (
      failedHeroes: number[],
      failedRanks: number[],
      mmrMap: Map<number, any>
    ) => {
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

        if (newHeroUrls.size > heroIconUrls.size) {
          setHeroIconUrls(newHeroUrls);
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

        if (newRankUrls.size > rankImageUrls.size) {
          setRankImageUrls(newRankUrls);
        }
      }
    };

    loadMatchAssets();
  }, [matchData, ranks]);
  const handleSearch = async (matchId: string) => {
    setError(false);

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

  const handleInfo = () => {
    // Info clicked
  };

  return (
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
              />
              <TableHeader />
              <TeamTable
                players={matchData.sapphire_team}
                heroIconUrls={heroIconUrls}
                rankImageUrls={rankImageUrls}
                matchStatsMap={matchStatsMap}
                relationStatsMap={relationStatsMap}
                partyGroups={partyGroups}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveMatchPage;
