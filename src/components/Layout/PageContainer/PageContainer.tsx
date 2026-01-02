import HomePage from "../../../pages/HomePage/HomePage";
import ActiveMatchPage from "../../../pages/ActiveMatchPage/ActiveMatchPage";

interface PageContainerProps {
  activePage: "home" | "active-match";
}

function PageContainer({ activePage }: PageContainerProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <main
      className="flex-1 h-screen bg-[#1a1a1a] relative"
      onContextMenu={handleContextMenu}
    >
      <div
        className="absolute top-0 left-0 w-full h-[50px] z-[9997]"
        data-tauri-drag-region
      ></div>
      {activePage === "home" ? <HomePage /> : <ActiveMatchPage />}
    </main>
  );
}

export default PageContainer;
