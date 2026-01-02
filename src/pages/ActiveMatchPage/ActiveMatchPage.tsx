import MatchSearchInput from "../../components/ActiveMatchPage/MatchSearchInput/MatchSearchInput";

function ActiveMatchPage() {
  const handleSearch = async (matchId: string) => {
    console.log("Searching for match:", matchId);
    // TODO: Implement API call to fetch match data
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
