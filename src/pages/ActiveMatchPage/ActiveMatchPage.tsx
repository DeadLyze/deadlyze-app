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
  Rank,
} from "../../services";

function ActiveMatchPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [heroIconUrls, setHeroIconUrls] = useState<Map<number, string>>(
    new Map()
  );
  const [rankImageUrls, setRankImageUrls] = useState<Map<number, string>>(
    new Map()
  );
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [failedHeroIds, setFailedHeroIds] = useState<number[]>([]);
  const [failedAccountIds, setFailedAccountIds] = useState<number[]>([]);

  // Load ranks once on mount
  useEffect(() => {
    const loadRanks = async () => {
      try {
        const ranksData = await AssetsService.fetchAllRanks();
        setRanks(ranksData);
        console.log(`Loaded ${ranksData.length} ranks`);
      } catch (error) {
        console.error("Failed to load ranks:", error);
      }
    };

    loadRanks();
  }, []);

  // Load hero icons and player ranks when match data changes
  useEffect(() => {
    if (!matchData) return;

    const loadMatchAssets = async () => {
      const allPlayers = [...matchData.amber_team, ...matchData.sapphire_team];

      // Load hero icons
      const heroIds = allPlayers.map((p) => p.hero_id);
      const heroMap = await AssetsService.fetchHeroesByIds(heroIds);

      const heroUrls = new Map<number, string>();
      const failedHeroes: number[] = [];

      heroIds.forEach((heroId) => {
        const hero = heroMap.get(heroId);
        if (hero?.images.selection_image_webp) {
          heroUrls.set(heroId, hero.images.selection_image_webp);
        } else {
          failedHeroes.push(heroId);
        }
      });

      setHeroIconUrls(heroUrls);
      setFailedHeroIds(failedHeroes);
      console.log(`Loaded ${heroUrls.size}/${heroIds.length} hero icons`);

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
      setFailedAccountIds(failedRanks);
      console.log(`Loaded ${rankUrls.size}/${accountIds.length} rank images`);

      // Retry failed loads after a short delay
      if (failedHeroes.length > 0 || failedRanks.length > 0) {
        console.log(
          `Retrying failed loads: ${failedHeroes.length} heroes, ${failedRanks.length} ranks`
        );
        setTimeout(
          () => retryFailedAssets(failedHeroes, failedRanks, mmrMap),
          1000
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
        const stillFailedHeroes: number[] = [];

        failedHeroes.forEach((heroId) => {
          const hero = retryHeroMap.get(heroId);
          if (hero?.images.selection_image_webp) {
            newHeroUrls.set(heroId, hero.images.selection_image_webp);
          } else {
            stillFailedHeroes.push(heroId);
          }
        });

        if (newHeroUrls.size > heroIconUrls.size) {
          setHeroIconUrls(newHeroUrls);
          setFailedHeroIds(stillFailedHeroes);
          console.log(
            `Retry: Loaded ${
              newHeroUrls.size - heroIconUrls.size
            } more hero icons`
          );
        }
      }

      // Retry rank images
      if (failedRanks.length > 0) {
        const newRankUrls = new Map(rankImageUrls);
        const stillFailedRanks: number[] = [];

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
            } else {
              stillFailedRanks.push(accountId);
            }
          }
        });

        if (newRankUrls.size > rankImageUrls.size) {
          setRankImageUrls(newRankUrls);
          setFailedAccountIds(stillFailedRanks);
          console.log(
            `Retry: Loaded ${
              newRankUrls.size - rankImageUrls.size
            } more rank images`
          );
        }
      }
    };

    loadMatchAssets();
  }, [matchData, ranks]);
  const handleSearch = async (matchId: string) => {
    setError(false);
    setIsLoading(true);

    try {
      console.log("Searching for match:", matchId);
      const data = await MatchService.fetchMatchData(matchId);
      setMatchData(data);
      console.log("Match data loaded successfully");
    } catch (err) {
      setError(true);
      console.error("Error fetching match data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    setMatchData(null);
  };

  const handleInfo = () => {
    console.log("Info clicked");
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
            <div className="bg-[#10262f]/40 rounded-lg p-1">
              <TeamTable
                players={matchData.amber_team}
                heroIconUrls={heroIconUrls}
                rankImageUrls={rankImageUrls}
              />
              <TableHeader />
              <TeamTable
                players={matchData.sapphire_team}
                heroIconUrls={heroIconUrls}
                rankImageUrls={rankImageUrls}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveMatchPage;
