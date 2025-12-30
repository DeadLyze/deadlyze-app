import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import SettingsModal from "../SettingsModal/SettingsModal";

function Sidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <aside
        className="w-[70px] h-screen bg-[#10262F] flex flex-col items-center justify-between"
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

        <div className="flex flex-col items-center gap-4 mb-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center w-[40px] h-[40px] transition-opacity hover:opacity-70"
            style={{ pointerEvents: "auto" }}
            aria-label="Settings"
          >
            <FiSettings size={24} color="#6A6A6A" />
          </button>
        </div>
      </aside>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default Sidebar;
