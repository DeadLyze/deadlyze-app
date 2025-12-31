export interface AppSettings {
  language: string;
  opacity: number;
  shortcut: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "ru",
  opacity: 100,
  shortcut: "Alt+`",
};
