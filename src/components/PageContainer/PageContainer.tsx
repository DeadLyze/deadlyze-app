import HomePage from "../../pages/HomePage/HomePage";

function PageContainer() {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <main
      className="flex-1 h-screen bg-[#1a1a1a] flex flex-col"
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onContextMenu={handleContextMenu}
    >
      <div className="h-[50px] w-full" data-tauri-drag-region></div>
      <HomePage />
    </main>
  );
}

export default PageContainer;
