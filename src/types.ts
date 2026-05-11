export interface SymbolButton {
  name: string;
  left: string;
  right?: string;
  builtin?: boolean;
}

export interface CommandCategory {
  name: string;
  prefix: string;
  suffix: string;
}

export interface CommandItem {
  id: string;
  category: string;
  title: string;
  text: string;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MonkeyToolsSettings {
  categories: CommandCategory[];
  commands: CommandItem[];
  globalTags: string[];
  customSymbols: SymbolButton[];
  hiddenSymbolNames: string[];
}

export type ModalView = "commands" | "symbols";
