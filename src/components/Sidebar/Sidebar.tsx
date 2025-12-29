function Sidebar() {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <aside
      className="w-[70px] h-screen bg-[#10262F] flex flex-col"
      style={{
        boxShadow: "10px 0 8.5px 0 #10262F",
      }}
      data-tauri-drag-region
      onContextMenu={handleContextMenu}
    ></aside>
  );
}

export default Sidebar;
