import { invoke } from "@tauri-apps/api/core";

/**
 * Utility for managing global shortcuts
 */
export class ShortcutManager {
  /**
   * Registers a global shortcut
   */
  static async register(shortcut: string): Promise<void> {
    await invoke("register_shortcut", { shortcut });
  }

  /**
   * Temporarily disables shortcut handling
   * (used during UI editing)
   */
  static async disable(): Promise<void> {
    await invoke("disable_shortcut");
  }

  /**
   * Re-enables shortcut handling
   */
  static async enable(): Promise<void> {
    await invoke("enable_shortcut");
  }

  /**
   * Updates the shortcut (unregisters old and registers new)
   */
  static async update(newShortcut: string): Promise<void> {
    await this.register(newShortcut);
  }
}
