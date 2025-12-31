import { invoke } from "@tauri-apps/api/core";

/**
 * Утилита для управления глобальными шорткатами
 */
export class ShortcutManager {
  /**
   * Регистрирует глобальный шорткат
   */
  static async register(shortcut: string): Promise<void> {
    await invoke("register_shortcut", { shortcut });
  }

  /**
   * Временно отключает обработку шорткатов
   * (используется при редактировании в UI)
   */
  static async disable(): Promise<void> {
    await invoke("disable_shortcut");
  }

  /**
   * Включает обработку шорткатов обратно
   */
  static async enable(): Promise<void> {
    await invoke("enable_shortcut");
  }

  /**
   * Обновляет шорткат (отменяет старый и регистрирует новый)
   */
  static async update(newShortcut: string): Promise<void> {
    await this.register(newShortcut);
  }
}
