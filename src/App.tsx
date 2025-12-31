import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Sidebar from "./components/Sidebar/Sidebar";
import PageContainer from "./components/PageContainer/PageContainer";
import WindowControls from "./components/WindowControls/WindowControls";
import { ConfigManager } from "./utils/configManager";
import { ShortcutManager } from "./utils/shortcutManager";
import i18n from "./i18n/config";

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const settings = await ConfigManager.load();
        await i18n.changeLanguage(settings.language);
        await invoke("set_window_opacity", { opacity: settings.opacity });
        await ShortcutManager.register(settings.shortcut);
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();

    // Listen for event to load saved opacity when showing window
    const unlistenOpacity = listen("load-saved-opacity", async () => {
      try {
        const settings = await ConfigManager.load();
        await invoke("set_window_opacity", { opacity: settings.opacity });
      } catch (error) {
        console.error("Failed to load saved opacity:", error);
      }
    });

    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", disableContextMenu);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      unlistenOpacity.then((fn) => fn());
    };
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
