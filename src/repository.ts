import { defaultSettings, defaultSymbols } from "./defaults";
import { getModuleSettings, saveSettings } from "./sillytavern";
import type { CommandCategory, CommandItem, MonkeyToolsSettings, SymbolButton } from "./types";

function cloneSettings(settings: MonkeyToolsSettings): MonkeyToolsSettings {
  return JSON.parse(JSON.stringify(settings)) as MonkeyToolsSettings;
}

function normalizeSettings(raw: Partial<MonkeyToolsSettings>): MonkeyToolsSettings {
  return {
    categories: Array.isArray(raw.categories) && raw.categories.length ? raw.categories : defaultSettings.categories,
    commands: Array.isArray(raw.commands) ? raw.commands : [],
    globalTags: Array.isArray(raw.globalTags) ? raw.globalTags : [],
    customSymbols: Array.isArray(raw.customSymbols) ? raw.customSymbols : [],
    hiddenSymbolNames: Array.isArray(raw.hiddenSymbolNames) ? raw.hiddenSymbolNames : [],
  };
}

export function loadSettings(): MonkeyToolsSettings {
  return normalizeSettings(getModuleSettings());
}

export function persistSettings(next: MonkeyToolsSettings): void {
  Object.assign(getModuleSettings(), cloneSettings(next));
  saveSettings();
  window.dispatchEvent(new CustomEvent("monkey-tools:settings-changed"));
}

export function createCommand(category: string): CommandItem {
  const now = Date.now();
  return {
    id: `cmd_${now}_${Math.random().toString(36).slice(2, 8)}`,
    category,
    title: "",
    text: "",
    tags: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getVisibleSymbols(settings: MonkeyToolsSettings): SymbolButton[] {
  const hidden = new Set(settings.hiddenSymbolNames);
  return defaultSymbols
    .concat(settings.customSymbols)
    .filter((symbol) => !hidden.has(symbol.name));
}

export function allTags(settings: MonkeyToolsSettings): string[] {
  const tags = new Set(settings.globalTags);
  for (const command of settings.commands) {
    command.tags.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

export function findCategory(settings: MonkeyToolsSettings, name: string): CommandCategory {
  return settings.categories.find((category) => category.name === name) ?? settings.categories[0];
}
