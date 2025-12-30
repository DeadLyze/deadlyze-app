import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar/Sidebar";
import PageContainer from "./components/PageContainer/PageContainer";
import WindowControls from "./components/WindowControls/WindowControls";
import { ConfigManager } from "./utils/configManager";
import i18n from "./i18n/config";

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const settings = await ConfigManager.load();
        await i18n.changeLanguage(settings.language);
        await invoke("set_window_opacity", { opacity: settings.opacity });
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <PageContainer />
      <WindowControls />
    </div>
  );
}

export default App;
