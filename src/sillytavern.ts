import { COMMAND_BUTTON_NAME, MODULE_NAME, SYMBOL_SETTINGS_BUTTON_NAME } from "./defaults";
import type { MonkeyToolsSettings, SymbolButton } from "./types";

declare global {
  interface Window {
    SillyTavern?: {
      getContext?: () => Record<string, unknown>;
      callGenericPopup?: (content: unknown, type?: number, text?: string, options?: Record<string, unknown>) => unknown;
    };
    callGenericPopup?: (content: unknown, type?: number, text?: string, options?: Record<string, unknown>) => unknown;
    jQuery?: unknown;
    toastr?: {
      success: (message: string) => void;
      error: (message: string) => void;
      warning: (message: string) => void;
      info: (message: string) => void;
    };
    extension_settings?: Record<string, unknown>;
    saveSettingsDebounced?: () => void;
    eventOn?: (eventName: string, callback: () => void) => void;
    getButtonEvent?: (buttonName: string) => string;
    replaceScriptButtons?: (buttons: Array<{ name: string; visible: boolean }>) => void;
    appendInexistentScriptButtons?: (buttons: Array<{ name: string; visible: boolean }>) => void;
  }
}

export function getContext(): Record<string, unknown> {
  return window.SillyTavern?.getContext?.() ?? {};
}

export function getExtensionSettings(): Record<string, unknown> {
  const context = getContext();
  const settings = context.extensionSettings ?? window.extension_settings ?? {};
  return settings as Record<string, unknown>;
}

export function getModuleSettings(): Partial<MonkeyToolsSettings> {
  const settings = getExtensionSettings();
  if (!settings[MODULE_NAME] || typeof settings[MODULE_NAME] !== "object") {
    settings[MODULE_NAME] = {};
  }
  return settings[MODULE_NAME] as Partial<MonkeyToolsSettings>;
}

export function saveSettings(): void {
  window.saveSettingsDebounced?.();
}

export async function copyWithSillyTavern(text: string): Promise<void> {
  const importModule = new Function("path", "return import(path)") as (path: string) => Promise<{ copyText: (value: string) => Promise<void> }>;
  const candidates = [
    "../../../../utils.js",
    "../../../utils.js",
    "../../../scripts/utils.js",
  ];

  for (const path of candidates) {
    try {
      const utils = await importModule(path);
      await utils.copyText(text);
      return;
    } catch {
      // 继续尝试下一个酒馆安装路径。
    }
  }

  throw new Error("没有找到酒馆原生复制函数 copyText。");
}

export function openPopup(content: HTMLElement): void {
  const popup = window.SillyTavern?.callGenericPopup ?? window.callGenericPopup;
  if (!popup) {
    window.toastr?.error("无法打开弹窗：当前酒馆环境没有提供弹窗函数。");
    return;
  }
  popup(content, 1, "", { okButton: "关闭" });
}

export function registerScriptButtons(symbols: SymbolButton[], handlers: Record<string, () => void>): void {
  const buttons = symbols
    .map((symbol) => ({ name: symbol.name, visible: true }))
    .concat([
      { name: SYMBOL_SETTINGS_BUTTON_NAME, visible: true },
      { name: COMMAND_BUTTON_NAME, visible: true },
    ]);

  if (typeof window.replaceScriptButtons === "function") {
    window.replaceScriptButtons(buttons);
  } else {
    window.appendInexistentScriptButtons?.(buttons);
  }

  if (typeof window.eventOn !== "function" || typeof window.getButtonEvent !== "function") {
    return;
  }

  for (const [name, handler] of Object.entries(handlers)) {
    window.eventOn(window.getButtonEvent(name), handler);
  }
}
