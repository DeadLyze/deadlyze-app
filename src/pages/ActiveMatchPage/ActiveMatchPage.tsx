import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdExit } from "react-icons/io";
import { FaRegQuestionCircle } from "react-icons/fa";
import MatchSearchInput from "../../components/ActiveMatchPage/MatchSearchInput/MatchSearchInput";
import { TeamTable } from "../../components/ActiveMatchPage/TeamTable";
import { TableHeader } from "../../components/ActiveMatchPage/TableHeader";
import { MatchService, MatchData } from "../../services";

function ActiveMatchPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<boolean>(false);

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
              <TeamTable players={matchData.amber_team} />
              <TableHeader />
              <TeamTable players={matchData.sapphire_team} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveMatchPage;
