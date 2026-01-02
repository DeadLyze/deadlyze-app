import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { TbDeviceGamepad } from "react-icons/tb";
import SettingsModal from "../../Settings/SettingsModal/SettingsModal";

interface SidebarProps {
  activePage: "home" | "active-match";
  onPageChange: (page: "home" | "active-match") => void;
}

function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <aside
        className="w-[70px] h-screen bg-[#10262F] flex flex-col items-center"
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

        {/* Navigation Section - Center */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <button
            onClick={() => onPageChange("home")}
            className={`flex items-center justify-center w-[40px] h-[40px] transition-opacity ${
              activePage !== "home" ? "hover:opacity-70" : ""
            }`}
            style={{ pointerEvents: "auto" }}
            aria-label="Home"
          >
            <GoHome
              size={24}
              color={activePage === "home" ? "#21C271" : "#6A6A6A"}
            />
          </button>
          <button
            onClick={() => onPageChange("active-match")}
            className={`flex items-center justify-center w-[40px] h-[40px] transition-opacity ${
              activePage !== "active-match" ? "hover:opacity-70" : ""
            }`}
            style={{ pointerEvents: "auto" }}
            aria-label="Active Match"
          >
            <TbDeviceGamepad
              size={24}
              color={activePage === "active-match" ? "#21C271" : "#6A6A6A"}
            />
          </button>
        </div>

        {/* Settings Section - Bottom */}
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
