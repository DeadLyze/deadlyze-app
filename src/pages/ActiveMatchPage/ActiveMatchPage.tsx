import { useState } from "react";
import MatchSearchInput from "../../components/ActiveMatchPage/MatchSearchInput/MatchSearchInput";
import { MatchService, MatchData } from "../../services";

function ActiveMatchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (matchId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log("Searching for match:", matchId);
      const data = await MatchService.fetchMatchData(matchId);
      setMatchData(data);
      console.log("Match data loaded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch match data";
      setError(errorMessage);
      console.error("Error fetching match data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(to right, #174842 0%, #10262F 100%)",
      }}
    >
      <MatchSearchInput onSearch={handleSearch} />
    </div>
  );
}

export default ActiveMatchPage;
