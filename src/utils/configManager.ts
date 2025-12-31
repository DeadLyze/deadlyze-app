import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { AppSettings, DEFAULT_SETTINGS } from "../types/settings";

const CONFIG_FILE = "config.json";

async function ensureAppDataDir(): Promise<void> {
  try {
    await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
  } catch {
    // Directory already exists
  }
}

export class ConfigManager {
  static async load(): Promise<AppSettings> {
    try {
      const fileExists = await exists(CONFIG_FILE, {
        baseDir: BaseDirectory.AppData,
      });

      if (!fileExists) {
        await this.save(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }

      const content = await readTextFile(CONFIG_FILE, {
        baseDir: BaseDirectory.AppData,
      });

      const settings: AppSettings = JSON.parse(content);

      return {
        language: settings.language || DEFAULT_SETTINGS.language,
        opacity: settings.opacity ?? DEFAULT_SETTINGS.opacity,
        shortcut: settings.shortcut || DEFAULT_SETTINGS.shortcut,
      };
    } catch (error) {
      return DEFAULT_SETTINGS;
    }
  }

  static async save(settings: AppSettings): Promise<void> {
    try {
      await ensureAppDataDir();
      const content = JSON.stringify(settings, null, 2);
      await writeTextFile(CONFIG_FILE, content, {
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      throw error;
    }
  }

  static async reset(): Promise<void> {
    await this.save(DEFAULT_SETTINGS);
  }

  static async update(partial: Partial<AppSettings>): Promise<void> {
    const current = await this.load();
    const updated = {
      ...current,
      ...partial,
    };
    await this.save(updated);
  }
}
