import { invoke } from "@tauri-apps/api/core";
import { CacheService } from "./CacheService";
import { steamId64ToAccountId } from "../utils/steamUtils";

export interface SteamInfo {
  is_installed: boolean;
  install_path: string | null;
  steam_id64: string | null;
  persona_name: string | null;
  is_running: boolean;
}

/**
 * Service for detecting and managing Steam information
 */
export class SteamService {
  /**
   * Detect Steam and update cache
   */
  static async detectSteam(): Promise<SteamInfo> {
    try {
      const steamInfo = await invoke<SteamInfo>("get_steam_info");

      const accountId = steamInfo.steam_id64
        ? steamId64ToAccountId(steamInfo.steam_id64)
        : null;

      CacheService.updateSteamData({
        steamId64: steamInfo.steam_id64,
        accountId,
        personaName: steamInfo.persona_name,
        installPath: steamInfo.install_path,
        isInstalled: steamInfo.is_installed,
        isRunning: steamInfo.is_running,
      });

      if (steamInfo.steam_id64 && steamInfo.persona_name) {
        CacheService.updateCurrentUser({
          steamId64: steamInfo.steam_id64,
          accountId,
          personaName: steamInfo.persona_name,
        });
      }

      return steamInfo;
    } catch (error) {
      console.error("Failed to detect Steam:", error);

      return {
        is_installed: false,
        install_path: null,
        steam_id64: null,
        persona_name: null,
        is_running: false,
      };
    }
  }

  /**
   * Get Steam info from cache
   */
  static getCachedSteamInfo(): {
    steamId64: string | null;
    accountId: number | null;
    personaName: string | null;
  } {
    const steamData = CacheService.getSteamData();
    return {
      steamId64: steamData.steamId64,
      accountId: steamData.accountId,
      personaName: steamData.personaName,
    };
  }

  /**
   * Get current user info from cache
   */
  static getCurrentUserInfo(): {
    steamId64: string | null;
    accountId: number | null;
    personaName: string | null;
  } {
    const userData = CacheService.getCurrentUser();
    return {
      steamId64: userData.steamId64,
      accountId: userData.accountId,
      personaName: userData.personaName,
    };
  }

  /**
   * Format Steam info for display
   */
  static formatSteamInfoForDisplay(
    notDetectedText: string,
    detectedTextTemplate: (personaName: string, accountId: number) => string,
    steamData?: {
      steamId64: string | null;
      accountId: number | null;
      personaName: string | null;
    }
  ): string {
    const data = steamData || this.getCurrentUserInfo();

    if (!data.steamId64 || !data.accountId || !data.personaName) {
      return notDetectedText;
    }

    return detectedTextTemplate(data.personaName, data.accountId);
  }
}
