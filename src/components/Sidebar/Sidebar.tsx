function Sidebar() {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <aside
      className="w-[70px] h-screen bg-[#10262F] flex flex-col items-center"
      style={{
        boxShadow: "10px 0 8.5px 0 #10262F",
      }}
      data-tauri-drag-region
      onContextMenu={handleContextMenu}
    >
      <img
        src="/assets/deadlyze_logo.png"
        alt="DeadLyze"
        className="mt-2"
        style={{
          width: "54px",
          height: "54px",
          pointerEvents: "none",
        }}
      />
    </aside>
  );
}

export default Sidebar;
