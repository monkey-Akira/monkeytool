import type { CommandCategory, MonkeyToolsSettings, SymbolButton } from "./types";

export const MODULE_NAME = "monkey-tools";
export const COMMAND_BUTTON_NAME = "指令";
export const SYMBOL_SETTINGS_BUTTON_NAME = "新增";

export const defaultCategories: CommandCategory[] = [
  { name: "肢体指令", prefix: "", suffix: "" },
  { name: "剧情指令", prefix: "", suffix: "" },
  { name: "小剧场指令", prefix: "", suffix: "" },
];

export const defaultSymbols: SymbolButton[] = [
  { name: "**", left: "*", right: "*", builtin: true },
  { name: "\"\"", left: "\"", right: "\"", builtin: true },
  { name: "()", left: "(", right: ")", builtin: true },
  { name: "，", left: "，", right: "", builtin: true },
  { name: "。", left: "。", right: "", builtin: true },
  { name: "？", left: "？", right: "", builtin: true },
  { name: "！", left: "！", right: "", builtin: true },
  { name: "/", left: "/", right: "", builtin: true },
];

export const defaultSettings: MonkeyToolsSettings = {
  categories: defaultCategories,
  commands: [],
  globalTags: [],
  customSymbols: [],
  hiddenSymbolNames: [],
};
