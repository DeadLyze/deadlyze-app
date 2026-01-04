import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RxCross2 } from "react-icons/rx";
import { FiFolder, FiRefreshCw } from "react-icons/fi";
import { invoke } from "@tauri-apps/api/core";
import packageJson from "../../../../package.json";
import SettingItem from "../SettingItem/SettingItem";
import ShortcutInput from "../ShortcutInput/ShortcutInput";
import { ConfigManager } from "../../../utils/configManager";
import { ShortcutManager } from "../../../utils/shortcutManager";
import { SteamService } from "../../../services/SteamService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "general" | "other";

const OPACITY_MIN = 20;
const OPACITY_MAX = 100;
const OPACITY_DEFAULT = 100;

const SLIDER_STYLES = `
  input[type="range"].opacity-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 14px;
    background: transparent;
    cursor: pointer;
  }
  
  input[type="range"].opacity-slider:focus {
    outline: none;
  }
  
  input[type="range"].opacity-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 5px;
    background: linear-gradient(to right, 
      #1a9d5d 0%, 
      #1a9d5d var(--slider-percent), 
      rgba(255, 255, 255, 0.15) var(--slider-percent), 
      rgba(255, 255, 255, 0.15) 100%);
    border-radius: 2.5px;
    border: none;
  }
  
  input[type="range"].opacity-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: #21C271;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    margin-top: -4.5px;
  }
  
  input[type="range"].opacity-slider::-moz-range-track {
    width: 100%;
    height: 5px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2.5px;
    border: none;
  }
  
  input[type="range"].opacity-slider::-moz-range-progress {
    height: 5px;
    background: #1a9d5d;
    border-radius: 2.5px;
  }
  
  input[type="range"].opacity-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #21C271;
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }
`;

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [opacity, setOpacity] = useState<number | "">(OPACITY_DEFAULT);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [shortcut, setShortcut] = useState<string>("Alt+`");
  const [previousShortcut, setPreviousShortcut] = useState<string>("Alt+`");
  const [steamInfo, setSteamInfo] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language);

    // Update Steam info text when language changes
    const userInfo = SteamService.getCurrentUserInfo();
    const formattedInfo = SteamService.formatSteamInfoForDisplay(
      t("settings.other.steamInfo.notDetected"),
      (personaName, accountId) =>
        t("settings.other.steamInfo.detected", { personaName, accountId }),
      userInfo
    );
    setSteamInfo(formattedInfo);
  }, [i18n.language, t]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await ConfigManager.load();
        setOpacity(settings.opacity);
        setShortcut(settings.shortcut);
        setPreviousShortcut(settings.shortcut);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    if (isOpen) {
      loadSettings();
      loadSteamInfo();
    }
  }, [isOpen, t]);

  const loadSteamInfo = async () => {
    try {
      const userInfo = SteamService.getCurrentUserInfo();

      const formattedInfo = SteamService.formatSteamInfoForDisplay(
        t("settings.other.steamInfo.notDetected"),
        (personaName, accountId) =>
          t("settings.other.steamInfo.detected", { personaName, accountId }),
        userInfo
      );
      setSteamInfo(formattedInfo);
    } catch (error) {
      console.error("Failed to load Steam info:", error);
      setSteamInfo(t("settings.other.steamInfo.error"));
    }
  };

  const handleRefreshSteam = async () => {
    setIsRefreshing(true);

    try {
      await SteamService.detectSteam();
      await loadSteamInfo();
    } catch (error) {
      console.error("Failed to refresh Steam info:", error);
      setSteamInfo(t("settings.other.steamInfo.error"));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 100);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      await i18n.changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      await ConfigManager.update({ language: newLanguage });
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const handleResetSettings = async () => {
    try {
      // Save current language before reset
      const currentLang = i18n.language;

      await ConfigManager.reset();
      const defaultSettings = await ConfigManager.load();

      // Restore language (don't reset it)
      await ConfigManager.update({ language: currentLang });
      setCurrentLanguage(currentLang);

      // Reset other settings
      setOpacity(defaultSettings.opacity);
      setShortcut(defaultSettings.shortcut);
      setPreviousShortcut(defaultSettings.shortcut);
      await invoke("set_window_opacity", { opacity: defaultSettings.opacity });
      await ShortcutManager.register(defaultSettings.shortcut);
    } catch (error) {
      console.error("Failed to reset settings:", error);
    }
  };

  const tabs = [
    { id: "general" as SettingsTab, label: t("settings.tabs.general") },
    { id: "other" as SettingsTab, label: t("settings.tabs.other") },
  ];

  const tabTitles = {
    general: t("settings.general.title"),
    other: t("settings.other.title"),
  };

  const handleOpacityChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue === "") {
      setOpacity("");
    } else {
      const num = parseInt(cleanValue);
      setOpacity(num > OPACITY_MAX ? OPACITY_MAX : num);
    }
  };

  const handleOpacityBlur = async () => {
    let finalValue: number =
      typeof opacity === "number" ? opacity : OPACITY_MIN;
    if (opacity === "" || opacity < OPACITY_MIN) {
      finalValue = OPACITY_MIN;
      setOpacity(OPACITY_MIN);
    }

    try {
      await invoke("set_window_opacity", { opacity: finalValue });
      await ConfigManager.update({ opacity: finalValue });
    } catch (error) {
      console.error("Failed to save opacity:", error);
    }
  };

  const handleSliderChange = async (value: number) => {
    setOpacity(value);
    try {
      await invoke("set_window_opacity", { opacity: value });
      await ConfigManager.update({ opacity: value });
    } catch (error) {
      console.error("Failed to update opacity:", error);
    }
  };

  const handleShortcutChange = (newShortcut: string) => {
    setShortcut(newShortcut);
  };

  const handleShortcutFocus = async () => {
    try {
      await ShortcutManager.disable();
    } catch (error) {
      console.error("Failed to disable shortcut:", error);
    }
  };

  const handleShortcutBlur = async (newShortcut?: string) => {
    const shortcutToSave = newShortcut || shortcut;

    try {
      await ShortcutManager.enable();
    } catch (error) {
      console.error("Failed to enable shortcut:", error);
    }

    if (!shortcutToSave || shortcutToSave === "...") {
      setShortcut(previousShortcut);
      return;
    }

    if (shortcutToSave === previousShortcut) {
      return;
    }

    try {
      await ConfigManager.update({ shortcut: shortcutToSave });
      await ShortcutManager.update(shortcutToSave);
      setPreviousShortcut(shortcutToSave);
      setShortcut(shortcutToSave);
    } catch (error) {
      console.error("Failed to save shortcut:", error);
      setShortcut(previousShortcut);
    }
  };

  const calculateSliderPercent = () => {
    const value = typeof opacity === "number" ? opacity : OPACITY_MIN;
    return (
      ((value - OPACITY_MIN) / (OPACITY_MAX - OPACITY_MIN)) *
      100
    ).toFixed(2);
  };

  return (
    <>
      <style>{SLIDER_STYLES}</style>
      <div
        className="fixed inset-0 z-[9998] transition-all duration-100"
        style={{
          backgroundColor: isAnimating
            ? "rgba(0, 0, 0, 0.34)"
            : "rgba(0, 0, 0, 0)",
          backdropFilter: isAnimating ? "blur(6px)" : "blur(0px)",
          WebkitBackdropFilter: isAnimating ? "blur(6px)" : "blur(0px)",
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div
          className="rounded-2xl pointer-events-auto transition-all duration-100 flex overflow-hidden relative"
          style={{
            width: "800px",
            height: "500px",
            background: "linear-gradient(180deg, #298172 0%, #17433C 100%)",
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? "scale(1)" : "scale(0.95)",
            boxShadow:
              "0 0 40px 0 rgba(10, 30, 35, 0.57), 0 0 20px 0 rgba(23, 67, 60, 0.4), inset 0 0 60px 20px rgba(0, 0, 0, 0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-[175px] h-full rounded-l-2xl flex flex-col px-6 pt-6 pb-2"
            style={{
              background: "linear-gradient(180deg, #ceb17ce0 0%, #8B7355 100%)",
            }}
          >
            <h2
              className="mb-8 text-center"
              style={{
                color: "#6B5943",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              {t("settings.title")}
            </h2>
            <nav className="flex flex-col gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left px-3 py-2 rounded transition-opacity ${
                    activeTab !== tab.id ? "hover:opacity-70" : ""
                  }`}
                  style={{
                    color: activeTab === tab.id ? "#3D3327" : "#5A4D3D",
                    fontSize: "16px",
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    backgroundColor:
                      activeTab === tab.id
                        ? "rgba(255, 255, 255, 0.15)"
                        : "transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto text-center">
              <p
                style={{
                  color: "#6B5943",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                DeadLyze {packageJson.version}
              </p>
              <p
                style={{ color: "#6B5943", fontSize: "11px", fontWeight: 500 }}
              >
                01.01.2026
              </p>
            </div>
          </div>
          <div className="flex-1 p-8 flex flex-col relative">
            <button
              onClick={onClose}
              className="absolute transition-opacity hover:opacity-70"
              style={{
                top: "24px",
                right: "24px",
                pointerEvents: "auto",
              }}
              aria-label="Close"
            >
              <RxCross2 size={28} color="#FFFFFF" strokeWidth={0.5} />
            </button>
            <h1
              className="mb-6"
              style={{
                color: "#F5F5F5",
                fontSize: "24px",
                fontWeight: 900,
                marginTop: "-8px",
              }}
            >
              {tabTitles[activeTab]}
            </h1>
            {activeTab === "general" ? (
              <div className="flex-1 flex flex-col gap-6">
                <SettingItem
                  title={t("settings.general.language.title")}
                  description={t("settings.general.language.description")}
                  control={
                    <select
                      value={currentLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-4 py-2 rounded cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#C5C5C5",
                        fontSize: "14px",
                        fontWeight: 400,
                        minWidth: "140px",
                        outline: "none",
                      }}
                    >
                      <option value="ru" style={{ backgroundColor: "#17433C" }}>
                        {t("settings.general.language.options.ru")}
                      </option>
                      <option value="en" style={{ backgroundColor: "#17433C" }}>
                        {t("settings.general.language.options.en")}
                      </option>
                    </select>
                  }
                />

                <SettingItem
                  title={t("settings.general.shortcut.title")}
                  description={t("settings.general.shortcut.description")}
                  control={
                    <ShortcutInput
                      value={shortcut}
                      onChange={handleShortcutChange}
                      onBlur={handleShortcutBlur}
                      onFocus={handleShortcutFocus}
                    />
                  }
                />

                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3
                        style={{
                          color: "#E0E0E0",
                          fontSize: "15px",
                          fontWeight: 500,
                          marginBottom: "4px",
                        }}
                      >
                        {t("settings.general.opacity.title")}
                      </h3>
                      <p
                        style={{
                          color: "#9FA6AD",
                          fontSize: "12px",
                          fontWeight: 400,
                          lineHeight: "1.5",
                        }}
                      >
                        {t("settings.general.opacity.description", {
                          min: OPACITY_MIN,
                          max: OPACITY_MAX,
                        })}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={opacity}
                      onChange={(e) => handleOpacityChange(e.target.value)}
                      onBlur={handleOpacityBlur}
                      className="px-3 py-2 rounded text-center transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#C5C5C5",
                        fontSize: "14px",
                        fontWeight: 400,
                        width: "70px",
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={OPACITY_MIN}
                    max={OPACITY_MAX}
                    step="1"
                    value={typeof opacity === "number" ? opacity : OPACITY_MIN}
                    onChange={(e) =>
                      handleSliderChange(parseInt(e.target.value))
                    }
                    className="w-full opacity-slider"
                    style={
                      {
                        "--slider-percent": `${calculateSliderPercent()}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>

                <button
                  onClick={handleResetSettings}
                  className="mt-auto self-end px-6 py-2 rounded transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#F5F5F5",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {t("settings.general.resetButton")}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-6">
                <SettingItem
                  title={t("settings.other.steamInfo.title")}
                  description={steamInfo}
                  control={
                    <button
                      onClick={handleRefreshSteam}
                      disabled={isRefreshing}
                      className="p-2 rounded transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <FiRefreshCw
                        size={20}
                        color="#C5C5C5"
                        className={isRefreshing ? "animate-spin" : ""}
                      />
                    </button>
                  }
                />
                <SettingItem
                  title={t("settings.other.appFolder.title")}
                  description={t("settings.other.appFolder.description")}
                  control={
                    <button
                      onClick={async () => {
                        try {
                          await invoke("open_app_folder");
                        } catch (error) {
                          console.error("Failed to open app folder:", error);
                        }
                      }}
                      className="p-2 rounded transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <FiFolder size={20} color="#C5C5C5" />
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsModal;
