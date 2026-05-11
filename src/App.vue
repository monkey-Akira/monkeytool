<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { COMMAND_BUTTON_NAME, SYMBOL_SETTINGS_BUTTON_NAME } from "./defaults";
import { allTags, createCommand, findCategory, getVisibleSymbols, loadSettings, persistSettings } from "./repository";
import { copyWithSillyTavern } from "./sillytavern";
import type { CommandItem, ModalView, MonkeyToolsSettings, SymbolButton } from "./types";

const props = defineProps<{
  initialView: ModalView;
}>();

const settings = reactive<MonkeyToolsSettings>(loadSettings());
const activeView = ref<ModalView>(props.initialView);
const activeCategory = ref(settings.categories[0]?.name ?? "默认分类");
const searchText = ref("");
const activeTagFilters = ref<string[]>([]);
const editingCommand = ref<CommandItem | null>(null);
const draftCommand = ref<CommandItem | null>(null);
const symbolDraft = reactive<SymbolButton>({ name: "", left: "", right: "" });
const importFile = ref<HTMLInputElement | null>(null);
const charMacro: SymbolButton = { name: "{{char}}", left: "{{char}}" };
const userMacro: SymbolButton = { name: "{{user}}", left: "{{user}}" };

const tags = computed(() => allTags(settings));
const visibleSymbols = computed(() => getVisibleSymbols(settings));
const currentCategory = computed(() => findCategory(settings, activeCategory.value));

const filteredCommands = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();
  return settings.commands
    .filter((command) => command.category === activeCategory.value)
    .filter((command) => {
      if (!keyword) return true;
      return [command.title, command.text, command.tags.join(" ")].some((value) => value.toLowerCase().includes(keyword));
    })
    .filter((command) => activeTagFilters.value.every((tag) => command.tags.includes(tag)))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
});

function save(): void {
  persistSettings(settings);
}

function switchCategory(name: string): void {
  activeCategory.value = name;
  activeTagFilters.value = [];
  searchText.value = "";
  cancelEdit();
}

function startNewCommand(): void {
  editingCommand.value = null;
  draftCommand.value = createCommand(activeCategory.value);
}

function startEdit(command: CommandItem): void {
  editingCommand.value = command;
  draftCommand.value = JSON.parse(JSON.stringify(command)) as CommandItem;
}

function cancelEdit(): void {
  editingCommand.value = null;
  draftCommand.value = null;
}

function saveCommand(): void {
  if (!draftCommand.value?.text.trim()) {
    window.toastr?.warning("指令内容不能为空。");
    return;
  }

  const command = draftCommand.value;
  command.title = command.title.trim() || command.text.trim().slice(0, 10);
  command.text = command.text.trim();
  command.tags = command.tags.map((tag) => tag.trim()).filter(Boolean);
  command.updatedAt = Date.now();

  if (editingCommand.value) {
    const index = settings.commands.findIndex((item) => item.id === editingCommand.value?.id);
    if (index >= 0) settings.commands[index] = command;
  } else {
    settings.commands.push(command);
  }

  for (const tag of command.tags) {
    if (!settings.globalTags.includes(tag)) settings.globalTags.push(tag);
  }

  save();
  cancelEdit();
}

function deleteCommand(command: CommandItem): void {
  if (!confirm(`确定删除「${command.title || command.text.slice(0, 10)}」吗？`)) return;
  const index = settings.commands.findIndex((item) => item.id === command.id);
  if (index >= 0) settings.commands.splice(index, 1);
  save();
}

function toggleFavorite(command: CommandItem): void {
  command.favorite = !command.favorite;
  command.updatedAt = Date.now();
  save();
}

function toggleTagFilter(tag: string): void {
  if (activeTagFilters.value.includes(tag)) {
    activeTagFilters.value = activeTagFilters.value.filter((item) => item !== tag);
  } else {
    activeTagFilters.value.push(tag);
  }
}

function addDraftTag(tag: string): void {
  const value = tag.trim();
  if (!draftCommand.value || !value || draftCommand.value.tags.includes(value)) return;
  draftCommand.value.tags.push(value);
}

function removeDraftTag(tag: string): void {
  if (!draftCommand.value) return;
  draftCommand.value.tags = draftCommand.value.tags.filter((item) => item !== tag);
}

async function copyCommand(command: CommandItem): Promise<void> {
  const category = findCategory(settings, command.category);
  const finalText = `${category.prefix || ""}${command.text}${category.suffix || ""}`;
  try {
    await copyWithSillyTavern(finalText);
    window.toastr?.success("指令已复制");
  } catch {
    window.toastr?.error("复制失败，请检查酒馆剪贴板权限。");
  }
}

function saveCategoryFormat(): void {
  save();
  window.toastr?.success("格式已保存");
}

function exportData(): void {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `猴子的小工具备份-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importData(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result)) as Partial<MonkeyToolsSettings>;
      if (Array.isArray(data.categories)) settings.categories = data.categories;
      if (Array.isArray(data.commands)) settings.commands = data.commands;
      if (Array.isArray(data.globalTags)) settings.globalTags = data.globalTags;
      if (Array.isArray(data.customSymbols)) settings.customSymbols = data.customSymbols;
      if (Array.isArray(data.hiddenSymbolNames)) settings.hiddenSymbolNames = data.hiddenSymbolNames;
      activeCategory.value = settings.categories[0]?.name ?? activeCategory.value;
      save();
      window.toastr?.success("导入成功");
    } catch {
      window.toastr?.error("导入失败：文件格式不正确。");
    } finally {
      input.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function addSymbol(): void {
  const name = symbolDraft.name.trim();
  const left = symbolDraft.left;
  const right = symbolDraft.right;
  if (!name || !left) {
    window.toastr?.warning("按钮名称和左侧符号不能为空。");
    return;
  }
  const existing = settings.customSymbols.find((symbol) => symbol.name === name);
  if (existing) {
    existing.left = left;
    existing.right = right;
  } else {
    settings.customSymbols.push({ name, left, right });
  }
  settings.hiddenSymbolNames = settings.hiddenSymbolNames.filter((item) => item !== name);
  symbolDraft.name = "";
  symbolDraft.left = "";
  symbolDraft.right = "";
  save();
  window.toastr?.success("符号按钮已保存");
}

function hideSymbol(symbol: SymbolButton): void {
  if (!settings.hiddenSymbolNames.includes(symbol.name)) settings.hiddenSymbolNames.push(symbol.name);
  settings.customSymbols = settings.customSymbols.filter((item) => item.name !== symbol.name);
  save();
}

function insertQuickText(symbol: SymbolButton): void {
  if (!draftCommand.value) return;
  draftCommand.value.text += `${symbol.left}${symbol.right || ""}`;
}

function openCommands(): void {
  activeView.value = "commands";
}

function openSymbols(): void {
  activeView.value = "symbols";
}

defineExpose({
  openCommands,
  openSymbols,
  COMMAND_BUTTON_NAME,
  SYMBOL_SETTINGS_BUTTON_NAME,
});
</script>

<template>
  <div class="monkey-tools">
    <header class="tool-header">
      <div>
        <h1>猴子的小工具</h1>
        <p>{{ activeView === "commands" ? "常用指令库" : "快捷符号按钮" }}</p>
      </div>
      <div class="header-actions">
        <button :class="{ active: activeView === 'commands' }" @click="openCommands">指令库</button>
        <button :class="{ active: activeView === 'symbols' }" @click="openSymbols">符号</button>
      </div>
    </header>

    <section v-if="activeView === 'commands'" class="command-layout">
      <aside class="sidebar">
        <button
          v-for="category in settings.categories"
          :key="category.name"
          :class="{ active: activeCategory === category.name }"
          @click="switchCategory(category.name)"
        >
          {{ category.name }}
        </button>
      </aside>

      <main class="panel">
        <div class="toolbar">
          <input v-model="searchText" placeholder="搜索标题、内容或标签" />
          <button @click="startNewCommand">新建</button>
          <button @click="importFile?.click()">导入</button>
          <button @click="exportData">导出</button>
          <input ref="importFile" type="file" accept=".json" hidden @change="importData" />
        </div>

        <div class="format-row">
          <label>
            前缀
            <input v-model="currentCategory.prefix" placeholder="复制时自动加在前面" @change="saveCategoryFormat" />
          </label>
          <label>
            后缀
            <input v-model="currentCategory.suffix" placeholder="复制时自动加在后面" @change="saveCategoryFormat" />
          </label>
        </div>

        <div class="tag-row">
          <button
            v-for="tag in tags"
            :key="tag"
            :class="{ active: activeTagFilters.includes(tag) }"
            @click="toggleTagFilter(tag)"
          >
            {{ tag }}
          </button>
        </div>

        <form v-if="draftCommand" class="editor" @submit.prevent="saveCommand">
          <input v-model="draftCommand.title" placeholder="指令标题，留空时自动截取内容前 10 字" />
          <textarea v-model="draftCommand.text" rows="4" placeholder="输入指令内容"></textarea>
          <div class="quick-row">
            <button type="button" @click="insertQuickText(charMacro)">{{ charMacro.name }}</button>
            <button type="button" @click="insertQuickText(userMacro)">{{ userMacro.name }}</button>
            <button v-for="symbol in visibleSymbols" :key="symbol.name" type="button" @click="insertQuickText(symbol)">
              {{ symbol.name }}
            </button>
          </div>
          <div class="draft-tags">
            <span v-for="tag in draftCommand.tags" :key="tag" @click="removeDraftTag(tag)">{{ tag }} ×</span>
            <input
              placeholder="输入标签后回车"
              @keydown.enter.prevent="addDraftTag(($event.target as HTMLInputElement).value); ($event.target as HTMLInputElement).value = ''"
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="cancelEdit">取消</button>
            <button type="submit">保存指令</button>
          </div>
        </form>

        <div class="command-list">
          <article v-for="command in filteredCommands" :key="command.id" class="command-card" @click="copyCommand(command)">
            <div>
              <h2>{{ command.title || command.text.slice(0, 10) }}</h2>
              <p>{{ command.text }}</p>
              <div class="mini-tags">
                <span v-for="tag in command.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="card-actions" @click.stop>
              <button :class="{ favorite: command.favorite }" @click="toggleFavorite(command)">♥</button>
              <button @click="startEdit(command)">改</button>
              <button class="danger" @click="deleteCommand(command)">删</button>
            </div>
          </article>
          <div v-if="!filteredCommands.length" class="empty">当前分类还没有指令。</div>
        </div>
      </main>
    </section>

    <section v-else class="panel">
      <div class="symbol-editor">
        <input v-model="symbolDraft.name" placeholder="按钮名称" />
        <input v-model="symbolDraft.left" placeholder="左侧或单独插入内容" />
        <input v-model="symbolDraft.right" placeholder="右侧内容，可留空" />
        <button @click="addSymbol">保存符号</button>
      </div>
      <div class="symbol-grid">
        <article v-for="symbol in visibleSymbols" :key="symbol.name">
          <strong>{{ symbol.name }}</strong>
          <span>{{ symbol.left }}{{ symbol.right || "" }}</span>
          <button @click="hideSymbol(symbol)">删除</button>
        </article>
      </div>
    </section>
  </div>
</template>
