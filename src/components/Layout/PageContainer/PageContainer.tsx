import HomePage from "../../../pages/HomePage/HomePage";

function PageContainer() {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <main
      className="flex-1 h-screen bg-[#1a1a1a] relative"
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onContextMenu={handleContextMenu}
    >
      <div
        className="absolute top-0 left-0 w-full h-[50px] z-[9997]"
        data-tauri-drag-region
      ></div>
      <HomePage />
    </main>
  );
}

export default PageContainer;
