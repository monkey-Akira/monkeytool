//#region src/legacy-command-repository.js
var CMD_CATEGORIES = {
	"肘击指令": {
		prefix: "",
		suffix: ""
	},
	"剧情指令": {
		prefix: "",
		suffix: ""
	},
	"小剧场指令": {
		prefix: "",
		suffix: ""
	},
	"其他指令": {
		prefix: "",
		suffix: ""
	}
};
var PUNCT_STORAGE_KEY = "punctuation_custom_buttons_v1";
var PUNCT_DELETED_KEY = "punctuation_deleted_buttons_v1";
var CMD_STORAGE_KEY = "punctuation_quick_commands_v3";
var CMD_CAT_STORAGE_KEY = "punctuation_cmd_cats_v3";
var CMD_TAGS_STORAGE_KEY = "punctuation_cmd_tags_v3";
var EXTENSION_SETTINGS_KEY = "monkey-tools";
var UI_TEXT = {
	launcher: {
		symbolSettings: "新增符号",
		commandRepository: "指令仓库"
	},
	mainTabs: {
		commands: "指令仓库",
		symbols: "符号编辑"
	},
	titles: {
		commandRepository: "常用指令库",
		symbolSettings: "符号按钮设置"
	},
	actions: {
		import: "📥 导入",
		export: "📤 导出",
		format: "⚙️ 格式",
		newCommand: "➕ 新建",
		collapse: "▲ 收起",
		manageTags: "管理标签",
		saveFormat: "保存格式",
		saveCommand: "保存指令",
		saveEdit: "保存修改",
		cancel: "取消",
		save: "保存",
		back: "返回",
		edit: "修改",
		delete: "删除",
		deleteSelected: "删除选中",
		rename: "重命名",
		addTag: "新增标签",
		clearFilter: "✖ 清除筛选",
		favorite: "设为常用",
		unfavorite: "取消常用"
	},
	symbols: {
		inlineToggle: "快捷符号",
		addTab: "新增",
		editTab: "编辑",
		type: "类型",
		single: "单独标点",
		pair: "成对标点",
		buttonName: "按钮名称",
		buttonNamePlaceholder: "显示在按钮上",
		insertSymbol: "要插入的符号",
		leftSymbol: "左侧符号",
		rightSymbol: "右侧符号",
		rightSymbolOptional: "右侧符号 (可留空)",
		dragSort: "拖动排序"
	},
	fields: {
		search: "搜索指令标题、内容或标签...",
		categoryFormat: "当前分类【{category}】的前后缀设置",
		commandTitle: "指令标题 (选填，默认截取内容前10字)",
		commandText: "输入指令内容... (必填)",
		tags: "选择或新建标签 (可多选)",
		newTag: "+新标签",
		manageNewTag: "输入新标签名称...",
		prefix: "前缀内容",
		suffix: "后缀内容",
		prefixPlaceholder: "如: [动作：",
		suffixPlaceholder: "如: ]"
	},
	modal: {
		ok: "确定",
		gotIt: "我知道了",
		confirmAction: "确定操作",
		confirmDelete: "确定删除"
	},
	empty: {
		noEditableSymbols: "暂无可编辑按钮",
		noTags: "当前没有任何标签",
		noCommands: "没有找到指令"
	},
	messages: {
		fillRequired: "请填完必填项。",
		requiredCannotBeEmpty: "必填项不能为空",
		defaultDeleteOnly: "默认自带标点仅支持删除",
		selectFirst: "请先勾选",
		deletePickedSymbols: "确定要删除选中的 {count} 个标点按钮吗？",
		exportSuccess: "数据导出成功！",
		importConfirm: "即将导入备份数据！\n为防止误删，导入的数据将与现有数据进行【合并】。\n是否继续？",
		importSuccess: "导入成功！共新增 {count} 条指令。",
		importFailed: "读取失败：文件格式不正确或已损坏！",
		formatSaved: "格式保存成功",
		tagExists: "标签已存在",
		renameTag: "将标签 [{tag}] 重命名为:",
		deleteTag: "确定要全局删除标签 [{tag}] 吗？\n包含此标签的指令不会被删除，只是失去该标签。",
		commandEmpty: "指令内容不能为空！",
		deleteCommand: "你确定删除 [{category}] 下面的 1 条指令吗？"
	},
	tooltips: {
		import: "合并导入JSON文件",
		export: "导出所有数据备份",
		format: "设置当前分类的前后缀",
		backToList: "返回列表",
		defaultDeleteOnly: "默认按钮只能删"
	}
};
UI_TEXT.launcher.commandRepository;
var DEFAULT_CMD_CATEGORIES = CMD_CATEGORIES;
var PunctuationButtons = {
	debugLogged: false,
	boundNames: {},
	migratedLocalStorage: false,
	symbolBarObserver: null,
	symbolBarRetryTimer: null,
	symbolBarTextarea: null,
	symbolBarHideTimer: null,
	symbolBarShowTimer: null,
	defaultSymbols: [
		{
			name: "**",
			left: "*",
			right: "*"
		},
		{
			name: "\"\"",
			left: "\"",
			right: "\""
		},
		{
			name: "()",
			left: "(",
			right: ")"
		},
		{
			name: "，",
			left: "，",
			right: ""
		},
		{
			name: "。",
			left: "。",
			right: ""
		},
		{
			name: "？",
			left: "？",
			right: ""
		},
		{
			name: "！",
			left: "！",
			right: ""
		},
		{
			name: "/",
			left: "/",
			right: ""
		}
	],
	getSettingsRoot: () => {
		const extensionSettings = (window.SillyTavern?.getContext?.() || {}).extensionSettings || window.extension_settings || {};
		window.extension_settings = extensionSettings;
		if (!extensionSettings[EXTENSION_SETTINGS_KEY] || typeof extensionSettings[EXTENSION_SETTINGS_KEY] !== "object") extensionSettings[EXTENSION_SETTINGS_KEY] = {};
		return extensionSettings[EXTENSION_SETTINGS_KEY];
	},
	saveExtensionSettings: () => {
		const context = window.SillyTavern?.getContext?.() || {};
		if (typeof window.saveSettingsDebounced === "function") window.saveSettingsDebounced();
		if (typeof context.saveSettingsDebounced === "function") context.saveSettingsDebounced();
		if (typeof context.saveSettings === "function") context.saveSettings();
		window.dispatchEvent(new CustomEvent("monkey-tools:settings-changed"));
	},
	migrateLocalStorageOnce: () => {
		if (PunctuationButtons.migratedLocalStorage) return;
		PunctuationButtons.migratedLocalStorage = true;
		const settings = PunctuationButtons.getSettingsRoot();
		try {
			if (!settings.categorySettings || typeof settings.categorySettings !== "object") {
				if (Array.isArray(settings.categories)) settings.categorySettings = settings.categories.reduce((result, category) => {
					if (category && category.name) result[category.name] = {
						prefix: category.prefix || "",
						suffix: category.suffix || ""
					};
					return result;
				}, {});
			}
			if (!Array.isArray(settings.deletedSymbolNames) && Array.isArray(settings.hiddenSymbolNames)) settings.deletedSymbolNames = settings.hiddenSymbolNames.map(String);
			if (Array.isArray(settings.commands)) settings.commands = settings.commands.map((cmd) => ({
				...cmd,
				isFavorite: typeof cmd.isFavorite === "boolean" ? cmd.isFavorite : !!cmd.favorite,
				timestamp: Number(cmd.timestamp || cmd.updatedAt || cmd.createdAt || Date.now())
			}));
			if (!Array.isArray(settings.customSymbols)) {
				const raw = localStorage.getItem(PUNCT_STORAGE_KEY);
				const parsed = raw ? JSON.parse(raw) : [];
				if (Array.isArray(parsed)) settings.customSymbols = parsed.filter((item) => item && item.name && typeof item.left === "string");
			}
			if (!Array.isArray(settings.deletedSymbolNames)) {
				const raw = localStorage.getItem(PUNCT_DELETED_KEY);
				const parsed = raw ? JSON.parse(raw) : [];
				if (Array.isArray(parsed)) settings.deletedSymbolNames = parsed.map(String);
			}
			if (!Array.isArray(settings.commands)) {
				const raw = localStorage.getItem(CMD_STORAGE_KEY);
				const parsed = raw ? JSON.parse(raw) : [];
				if (Array.isArray(parsed)) settings.commands = parsed;
			}
			if (!Array.isArray(settings.globalTags)) {
				const raw = localStorage.getItem(CMD_TAGS_STORAGE_KEY);
				const parsed = raw ? JSON.parse(raw) : [];
				if (Array.isArray(parsed)) settings.globalTags = parsed;
			}
			if (!settings.categorySettings || typeof settings.categorySettings !== "object") {
				const raw = localStorage.getItem(CMD_CAT_STORAGE_KEY);
				const parsed = raw ? JSON.parse(raw) : null;
				if (parsed && typeof parsed === "object") settings.categorySettings = parsed;
			}
			PunctuationButtons.saveExtensionSettings();
		} catch (error) {}
	},
	loadCustomSymbols: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const parsed = PunctuationButtons.getSettingsRoot().customSymbols || [];
			if (!Array.isArray(parsed)) return [];
			return parsed.filter((item) => item && item.name && typeof item.left === "string");
		} catch (error) {
			return [];
		}
	},
	saveCustomSymbols: (items) => {
		PunctuationButtons.getSettingsRoot().customSymbols = items;
		PunctuationButtons.saveExtensionSettings();
	},
	loadDeletedNames: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const parsed = PunctuationButtons.getSettingsRoot().deletedSymbolNames || [];
			return Array.isArray(parsed) ? parsed.map(String) : [];
		} catch (error) {
			return [];
		}
	},
	saveDeletedNames: (items) => {
		PunctuationButtons.getSettingsRoot().deletedSymbolNames = [...new Set(items)];
		PunctuationButtons.saveExtensionSettings();
	},
	rememberDeletedName: (name) => {
		const deleted = PunctuationButtons.loadDeletedNames();
		if (!deleted.includes(name)) {
			deleted.push(name);
			PunctuationButtons.saveDeletedNames(deleted);
		}
	},
	forgetDeletedName: (name) => PunctuationButtons.saveDeletedNames(PunctuationButtons.loadDeletedNames().filter((item) => item !== name)),
	loadSymbolOrder: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const parsed = PunctuationButtons.getSettingsRoot().symbolOrder || [];
			return Array.isArray(parsed) ? parsed.map(String) : [];
		} catch (error) {
			return [];
		}
	},
	saveSymbolOrder: (items) => {
		PunctuationButtons.getSettingsRoot().symbolOrder = [...new Set(items.map(String))];
		PunctuationButtons.saveExtensionSettings();
	},
	applySymbolOrder: (items) => {
		const order = PunctuationButtons.loadSymbolOrder();
		if (!order.length) return items;
		const indexByName = new Map(order.map((name, index) => [name, index]));
		return [...items].sort((a, b) => {
			return (indexByName.has(a.name) ? indexByName.get(a.name) : Number.MAX_SAFE_INTEGER) - (indexByName.has(b.name) ? indexByName.get(b.name) : Number.MAX_SAFE_INTEGER);
		});
	},
	getAllSymbols: () => PunctuationButtons.applySymbolOrder(PunctuationButtons.defaultSymbols.concat(PunctuationButtons.loadCustomSymbols())),
	getVisibleSymbols: () => {
		const deleted = new Set(PunctuationButtons.loadDeletedNames());
		return PunctuationButtons.getAllSymbols().filter((item) => !deleted.has(item.name));
	},
	getInlineSymbolsEnabled: () => {
		const value = PunctuationButtons.getSettingsRoot().showInlineSymbols;
		return typeof value === "boolean" ? value : true;
	},
	saveInlineSymbolsEnabled: (enabled) => {
		PunctuationButtons.getSettingsRoot().showInlineSymbols = !!enabled;
		PunctuationButtons.saveExtensionSettings();
	},
	generateId: () => "cmd_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
	loadCommands: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const parsed = PunctuationButtons.getSettingsRoot().commands || [];
			return Array.isArray(parsed) ? parsed.map((cmd) => ({
				...cmd,
				isFavorite: typeof cmd.isFavorite === "boolean" ? cmd.isFavorite : !!cmd.favorite,
				timestamp: Number(cmd.timestamp || cmd.updatedAt || cmd.createdAt || Date.now())
			})) : [];
		} catch (error) {
			return [];
		}
	},
	saveCommands: (cmds) => {
		PunctuationButtons.getSettingsRoot().commands = cmds;
		PunctuationButtons.saveExtensionSettings();
	},
	loadGlobalTags: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const tags = PunctuationButtons.getSettingsRoot().globalTags || [];
			return Array.isArray(tags) ? tags : [];
		} catch (e) {
			return [];
		}
	},
	saveGlobalTags: (tags) => {
		PunctuationButtons.getSettingsRoot().globalTags = [...new Set(tags)];
		PunctuationButtons.saveExtensionSettings();
	},
	getCombinedTags: () => {
		const cmds = PunctuationButtons.loadCommands();
		const tags = new Set(PunctuationButtons.loadGlobalTags());
		cmds.forEach((cmd) => cmd.tags && cmd.tags.forEach((t) => tags.add(t)));
		return Array.from(tags).sort();
	},
	loadCategorySettings: () => {
		PunctuationButtons.migrateLocalStorageOnce();
		try {
			const categories = PunctuationButtons.getSettingsRoot().categorySettings;
			return categories && typeof categories === "object" ? {
				...DEFAULT_CMD_CATEGORIES,
				...categories
			} : { ...DEFAULT_CMD_CATEGORIES };
		} catch (e) {
			return DEFAULT_CMD_CATEGORIES;
		}
	},
	saveCategorySettings: (data) => {
		const settings = PunctuationButtons.getSettingsRoot();
		settings.categorySettings = { ...data };
		settings.categories = Object.entries(settings.categorySettings).map(([name, value]) => ({
			name,
			prefix: value?.prefix || "",
			suffix: value?.suffix || ""
		}));
		PunctuationButtons.saveExtensionSettings();
	},
	copyToClipboard: async (text, showToast = true) => {
		const value = String(text ?? "");
		const notifySuccess = () => {
			if (showToast && window.toastr) window.toastr.success("指令已复制");
		};
		const notifyManual = () => window.prompt("复制失败，请手动复制：", value);
		const importModule = new Function("path", "return import(path)");
		for (const path of [
			"../../../../utils.js",
			"../../../utils.js",
			"../../../scripts/utils.js"
		]) try {
			const utils = await importModule(path);
			if (typeof utils.copyText !== "function") continue;
			await utils.copyText(value);
			notifySuccess();
			return;
		} catch (error) {}
		notifyManual();
	},
	hideButtonByName: (name) => {
		PunctuationButtons.getDocuments().forEach((doc) => {
			doc.querySelectorAll(".menu_button.interactable, .menu_button, button").forEach((button) => {
				if ([
					button.textContent,
					button.innerText,
					button.getAttribute("title"),
					button.getAttribute("aria-label"),
					button.value
				].map((t) => typeof t === "string" ? t.trim() : "").filter(Boolean).includes(name)) button.remove();
			});
		});
	},
	hideDeletedButtons: () => {
		const symbolNames = new Set(PunctuationButtons.getAllSymbols().map((item) => item.name));
		PunctuationButtons.loadDeletedNames().filter((name) => symbolNames.has(name)).forEach((name) => PunctuationButtons.hideButtonByName(name));
	},
	removeNamesFromObject: (value, names) => {
		if (Array.isArray(value)) {
			let changed = false;
			const next = [];
			value.forEach((item) => {
				if (item && typeof item === "object") {
					const label = String(item.name ?? item.label ?? item.text ?? item.title ?? "");
					if (names.includes(label)) {
						changed = true;
						return;
					}
					const result = PunctuationButtons.removeNamesFromObject(item, names);
					if (result.changed) {
						changed = true;
						next.push(result.value);
						return;
					}
				} else if (typeof item === "string" && names.includes(item)) {
					changed = true;
					return;
				}
				next.push(item);
			});
			return {
				value: next,
				changed
			};
		}
		if (value && typeof value === "object") {
			let changed = false;
			const next = { ...value };
			Object.keys(next).forEach((key) => {
				if (names.includes(key)) {
					delete next[key];
					changed = true;
					return;
				}
				const child = next[key];
				if (child && typeof child === "object") {
					const result = PunctuationButtons.removeNamesFromObject(child, names);
					if (result.changed) {
						next[key] = result.value;
						changed = true;
					}
				}
			});
			return {
				value: next,
				changed
			};
		}
		return {
			value,
			changed: false
		};
	},
	cleanupHelperButtonStorage: (names) => {
		const targets = names.filter(Boolean);
		if (!targets.length) return;
		[localStorage, sessionStorage].forEach((store) => {
			for (let index = 0; index < store.length; index++) {
				const key = store.key(index);
				const raw = store.getItem(key);
				if (!raw || !targets.some((name) => raw.includes(name))) continue;
				if (!/script|button|quick|helper|tavern|setting|config/i.test(key + raw.slice(0, 200))) continue;
				try {
					const parsed = JSON.parse(raw);
					const result = PunctuationButtons.removeNamesFromObject(parsed, targets);
					if (result.changed) store.setItem(key, JSON.stringify(result.value));
				} catch (error) {}
			}
		});
	},
	deleteCustomByNames: (names) => {
		const targets = [...new Set(names.filter(Boolean))];
		if (!targets.length) return;
		const targetSet = new Set(targets);
		const current = PunctuationButtons.loadCustomSymbols();
		PunctuationButtons.saveCustomSymbols(current.filter((item) => !targetSet.has(item.name)));
		targets.forEach((name) => {
			PunctuationButtons.rememberDeletedName(name);
			PunctuationButtons.hideButtonByName(name);
		});
		PunctuationButtons.cleanupHelperButtonStorage(targets);
		if (typeof window !== "undefined" && window.extension_settings) {
			let settingsChanged = false;
			[
				"quickReplies",
				"scriptButtons",
				"customButtons",
				"slashCommands"
			].forEach((key) => {
				if (Array.isArray(window.extension_settings[key])) {
					const originalLen = window.extension_settings[key].length;
					window.extension_settings[key] = window.extension_settings[key].filter((btn) => {
						const btnName = String(btn.name ?? btn.label ?? btn.text ?? btn.title ?? "");
						return !targetSet.has(btnName);
					});
					if (window.extension_settings[key].length < originalLen) settingsChanged = true;
				}
			});
			if (settingsChanged && typeof window.saveSettingsDebounced === "function") window.saveSettingsDebounced();
		}
		PunctuationButtons.register();
	},
	getDocuments: () => {
		const docs = [];
		const addDoc = (doc) => {
			if (doc && !docs.includes(doc)) docs.push(doc);
		};
		addDoc(document);
		try {
			addDoc(window.parent?.document);
		} catch (error) {}
		try {
			addDoc(window.top?.document);
		} catch (error) {}
		return docs;
	},
	isEditable: (element) => {
		if (!element) return false;
		const tag = element.tagName ? element.tagName.toLowerCase() : "";
		return tag === "textarea" || tag === "input" || element.isContentEditable;
	},
	resolveEditable: (element) => {
		if (!element) return null;
		if (PunctuationButtons.isEditable(element)) return element;
		return element.querySelector?.("textarea, input, [contenteditable=\"true\"]") || null;
	},
	getSendTextarea: () => {
		for (const doc of PunctuationButtons.getDocuments()) {
			const editable = PunctuationButtons.resolveEditable(doc.querySelector("#send_textarea"));
			if (editable) return editable;
		}
		return null;
	},
	notifyInput: (element) => {
		if (window.jQuery) window.jQuery(element).trigger("input").trigger("change");
		element.dispatchEvent(new Event("input", { bubbles: true }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
	},
	getElementValue: (element) => element.isContentEditable ? element.textContent || "" : element.value || "",
	setElementValue: (element, value) => {
		if (element.isContentEditable) {
			element.textContent = value;
			return;
		}
		const proto = element.tagName.toLowerCase() === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
		const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
		if (descriptor && descriptor.set) descriptor.set.call(element, value);
		else element.value = value;
	},
	setCursor: (element, index) => {
		element.focus();
		if (typeof element.setSelectionRange === "function") {
			element.setSelectionRange(index, index);
			return true;
		}
		return false;
	},
	retryCursor: (index) => {
		[
			0,
			30,
			80,
			160
		].forEach((delay) => {
			setTimeout(() => {
				const textarea = PunctuationButtons.getSendTextarea();
				if (!textarea) return;
				PunctuationButtons.setCursor(textarea, index);
				PunctuationButtons.notifyInput(textarea);
			}, delay);
		});
	},
	insertByTextarea: (item) => {
		const textarea = PunctuationButtons.getSendTextarea();
		if (!textarea) return false;
		textarea.focus();
		const value = PunctuationButtons.getElementValue(textarea);
		const start = typeof textarea.selectionStart === "number" ? textarea.selectionStart : value.length;
		const end = typeof textarea.selectionEnd === "number" ? textarea.selectionEnd : value.length;
		const selected = value.slice(start, end);
		const left = item.left, right = item.right || "";
		PunctuationButtons.setElementValue(textarea, value.slice(0, start) + left + selected + right + value.slice(end));
		PunctuationButtons.notifyInput(textarea);
		PunctuationButtons.retryCursor(selected ? start + left.length + selected.length + right.length : start + left.length);
		return true;
	},
	insertByName: (name) => {
		const item = PunctuationButtons.getVisibleSymbols().find((symbol) => symbol.name === name);
		if (!item) return;
		PunctuationButtons.insertByTextarea(item);
	},
	escapeHtml: (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
	openPopup: (content, options = {}) => {
		const context = window.SillyTavern?.getContext?.() || {};
		const popupFunc = window.SillyTavern?.callGenericPopup || window.callGenericPopup || context.callGenericPopup;
		const popupOwner = window.SillyTavern?.callGenericPopup ? window.SillyTavern : window.callGenericPopup ? window : context;
		if (!popupFunc || !window.jQuery) {
			window.toastr?.error("无法打开弹窗：当前环境缺少原生弹窗 API 或 jQuery。");
			return;
		}
		const popupOptions = { ...options };
		delete popupOptions.forceCustom;
		popupFunc.call(popupOwner, content, 1, "", popupOptions);
	},
	ensureFloatingCss: () => {
		if (document.getElementById("monkey-tools-floating-style")) return;
		const style = document.createElement("style");
		style.id = "monkey-tools-floating-style";
		style.textContent = `
            .monkey-tools-floating { position:fixed; left:calc(100vw - 76px); top:45vh; z-index:2147483000; width:64px; height:64px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif; touch-action:none; user-select:none; overflow:visible; }
            .monkey-tools-floating-main { width:64px; height:64px; border:none; background:transparent; color:inherit; padding:0; cursor:grab; font-size:44px; line-height:64px; font-weight:700; box-shadow:none; text-shadow:0 3px 12px rgba(0,0,0,.28); }
            .monkey-tools-floating-main:active { cursor:grabbing; }
            .monkey-tools-floating-main:hover { background:transparent; }
            .monkey-tools-floating-menu { display:none; position:absolute; right:72px; top:50%; transform:translateY(-50%); width:max-content; min-width:128px; max-width:min(280px, calc(100vw - 96px)); max-height:48vh; overflow:auto; grid-template-columns:repeat(2,max-content); gap:6px; padding:10px; border:1px solid #d0d7de; border-radius:10px; background:#fff; box-shadow:0 10px 34px rgba(0,0,0,.2); touch-action:auto; }
            .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:72px; right:auto; }
            .monkey-tools-floating.open .monkey-tools-floating-menu { display:grid; }
            .monkey-tools-floating-menu button { white-space:nowrap; border:1px solid #d0d7de; border-radius:8px; background:#fff; color:#24292f; padding:7px 10px; cursor:pointer; font-size:13px; font-weight:700; }
            .monkey-tools-floating-menu button:hover { background:#f6f8fa; }
            #monkey-tools-inline-symbols { display:flex; flex-wrap:wrap; gap:4px; padding:0; border:none; background:transparent; box-shadow:none; }
            #monkey-tools-inline-symbols button { border:1px solid rgba(0,0,0,0.12); border-radius:999px; background:rgba(255,255,255,0.9); color:#2f343a; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:600; line-height:1.2; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
            #monkey-tools-inline-symbols button:hover { background:rgba(255,255,255,1); border-color:rgba(0,0,0,0.18); }
            @media (max-width: 768px) {
                .monkey-tools-floating { left:calc(100vw - 72px); top:42vh; right:auto; bottom:auto; width:60px; height:60px; }
                .monkey-tools-floating-main { width:60px; height:60px; padding:0; font-size:42px; line-height:60px; }
                .monkey-tools-floating-menu { right:68px; min-width:120px; max-width:calc(100vw - 88px); max-height:42vh; grid-template-columns:1fr; }
                .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:68px; right:auto; }
            }
        `;
		document.head.appendChild(style);
	},
	buildFloatingLauncher: () => {
		if (!document.body) {
			setTimeout(PunctuationButtons.buildFloatingLauncher, 300);
			return;
		}
		PunctuationButtons.ensureFloatingCss();
		document.getElementById("monkey-tools-floating")?.remove();
		const launcher = document.createElement("div");
		launcher.id = "monkey-tools-floating";
		launcher.className = "monkey-tools-floating";
		const savedPosition = PunctuationButtons.getSettingsRoot().floatingPosition;
		if (savedPosition && Number.isFinite(savedPosition.left) && Number.isFinite(savedPosition.top)) {
			launcher.style.left = `${Math.max(8, Math.min(window.innerWidth - 72, savedPosition.left))}px`;
			launcher.style.top = `${Math.max(8, Math.min(window.innerHeight - 72, savedPosition.top))}px`;
		}
		const mainButton = document.createElement("button");
		mainButton.type = "button";
		mainButton.className = "monkey-tools-floating-main";
		mainButton.textContent = "🐵";
		let dragState = null;
		const dragThreshold = 12;
		const startDrag = (event) => {
			if (event.button !== 0) return;
			const rect = launcher.getBoundingClientRect();
			dragState = {
				startX: event.clientX,
				startY: event.clientY,
				left: rect.left,
				top: rect.top,
				dragging: false
			};
			launcher.style.right = "auto";
			launcher.style.bottom = "auto";
			try {
				mainButton.setPointerCapture?.(event.pointerId);
			} catch (_) {}
			window.addEventListener("pointermove", onDrag);
			window.addEventListener("pointerup", endDrag, { once: true });
			window.addEventListener("pointercancel", cancelDrag, { once: true });
			event.preventDefault();
		};
		const onDrag = (event) => {
			if (!dragState) return;
			const deltaX = event.clientX - dragState.startX;
			const deltaY = event.clientY - dragState.startY;
			if (!dragState.dragging && Math.hypot(deltaX, deltaY) < dragThreshold) return;
			dragState.dragging = true;
			launcher.classList.remove("open");
			const buttonWidth = mainButton.offsetWidth || 64;
			const buttonHeight = mainButton.offsetHeight || 64;
			const nextLeft = Math.max(8, Math.min(window.innerWidth - buttonWidth - 8, dragState.left + deltaX));
			const nextTop = Math.max(8, Math.min(window.innerHeight - buttonHeight - 8, dragState.top + deltaY));
			launcher.style.left = `${nextLeft}px`;
			launcher.style.top = `${nextTop}px`;
		};
		const endDrag = () => {
			if (!dragState) return;
			if (!dragState.dragging) {
				launcher.classList.remove("open");
				PunctuationButtons.openCommandPanel();
			} else {
				const rect = launcher.getBoundingClientRect();
				PunctuationButtons.getSettingsRoot().floatingPosition = {
					left: rect.left,
					top: rect.top
				};
				PunctuationButtons.saveExtensionSettings();
			}
			dragState = null;
			window.removeEventListener("pointermove", onDrag);
			window.removeEventListener("pointercancel", cancelDrag);
		};
		const cancelDrag = () => {
			dragState = null;
			window.removeEventListener("pointermove", onDrag);
		};
		mainButton.addEventListener("pointerdown", startDrag);
		launcher.append(mainButton);
		document.body.appendChild(launcher);
	},
	buildInlineSymbolBar: () => {
		PunctuationButtons.stopInlineSymbolBarTracking();
		document.getElementById("monkey-tools-inline-symbols")?.remove();
		if (!PunctuationButtons.getInlineSymbolsEnabled()) return;
		const textarea = PunctuationButtons.getSendTextarea();
		if (!textarea) {
			PunctuationButtons.scheduleInlineSymbolBarRetry();
			return;
		}
		PunctuationButtons.symbolBarTextarea = textarea;
		const bar = document.createElement("div");
		bar.id = "monkey-tools-inline-symbols";
		PunctuationButtons.getVisibleSymbols().forEach((symbol) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = symbol.name;
			button.title = `插入 ${symbol.name}`;
			button.dataset.symbolName = symbol.name;
			button.style.cssText = "border:1px solid rgba(0,0,0,0.12);border-radius:999px;background:rgba(255,255,255,0.9);color:#2f343a;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:600;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);";
			bar.appendChild(button);
		});
		bar.addEventListener("pointerdown", (event) => {
			const button = event.target.closest("button[data-symbol-name]");
			if (!button) return;
			event.preventDefault();
			event.stopPropagation();
			PunctuationButtons.insertByName(button.dataset.symbolName);
		}, true);
		document.body.appendChild(bar);
		PunctuationButtons.positionInlineSymbolBar();
		PunctuationButtons.hideInlineSymbolBar();
		PunctuationButtons.bindInlineSymbolBarActivation(textarea, bar);
		if (document.activeElement === textarea || bar.contains(document.activeElement)) PunctuationButtons.showInlineSymbolBar();
		PunctuationButtons.watchInlineSymbolBarHost();
	},
	showInlineSymbolBar: () => {
		if (!PunctuationButtons.getInlineSymbolsEnabled()) return;
		if (!document.getElementById("monkey-tools-inline-symbols")) return;
		if (PunctuationButtons.symbolBarHideTimer) {
			clearTimeout(PunctuationButtons.symbolBarHideTimer);
			PunctuationButtons.symbolBarHideTimer = null;
		}
		PunctuationButtons.positionInlineSymbolBar(true);
	},
	scheduleInlineSymbolBarShow: () => {
		if (PunctuationButtons.symbolBarShowTimer) {
			cancelAnimationFrame(PunctuationButtons.symbolBarShowTimer);
			PunctuationButtons.symbolBarShowTimer = null;
		}
		const textarea = PunctuationButtons.symbolBarTextarea;
		PunctuationButtons.symbolBarShowTimer = requestAnimationFrame(() => {
			PunctuationButtons.symbolBarShowTimer = null;
			if (document.activeElement !== textarea) return;
			PunctuationButtons.showInlineSymbolBar();
		});
	},
	hideInlineSymbolBar: () => {
		const bar = document.getElementById("monkey-tools-inline-symbols");
		if (!bar) return;
		bar.style.display = "none";
	},
	scheduleInlineSymbolBarHide: () => {
		if (PunctuationButtons.symbolBarHideTimer) clearTimeout(PunctuationButtons.symbolBarHideTimer);
		PunctuationButtons.symbolBarHideTimer = window.setTimeout(() => {
			PunctuationButtons.symbolBarHideTimer = null;
			const bar = document.getElementById("monkey-tools-inline-symbols");
			const textarea = PunctuationButtons.symbolBarTextarea;
			const active = document.activeElement;
			if (bar?.contains(active) || active === textarea) return;
			PunctuationButtons.hideInlineSymbolBar();
		}, 120);
	},
	bindInlineSymbolBarActivation: (textarea, bar) => {
		if (textarea.dataset.monkeyToolsInlineBound === "1") return;
		textarea.dataset.monkeyToolsInlineBound = "1";
		textarea.addEventListener("focus", PunctuationButtons.scheduleInlineSymbolBarShow);
		textarea.addEventListener("focusin", PunctuationButtons.scheduleInlineSymbolBarShow);
		textarea.addEventListener("blur", PunctuationButtons.scheduleInlineSymbolBarHide);
		bar.addEventListener("pointerdown", () => {
			if (PunctuationButtons.symbolBarHideTimer) {
				clearTimeout(PunctuationButtons.symbolBarHideTimer);
				PunctuationButtons.symbolBarHideTimer = null;
			}
		}, true);
	},
	positionInlineSymbolBar: (show = false) => {
		const bar = document.getElementById("monkey-tools-inline-symbols");
		const textarea = PunctuationButtons.getSendTextarea();
		if (!bar || !textarea) return;
		const rect = textarea.getBoundingClientRect();
		const width = Math.max(220, Math.min(rect.width, window.innerWidth - 24));
		const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
		const display = show || bar.style.display === "flex" ? "flex" : "none";
		const visibility = show ? "hidden" : bar.style.visibility || "visible";
		bar.style.cssText = `position:fixed;left:${left}px;top:8px;width:${width}px;z-index:2147482500;display:${display};visibility:${visibility};flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
		const top = Math.max(8, rect.top - bar.offsetHeight - 8);
		bar.style.top = `${top}px`;
		if (show) bar.style.visibility = "visible";
	},
	scheduleInlineSymbolBarRetry: () => {
		if (PunctuationButtons.symbolBarRetryTimer) return;
		PunctuationButtons.symbolBarRetryTimer = window.setTimeout(() => {
			PunctuationButtons.symbolBarRetryTimer = null;
			PunctuationButtons.buildInlineSymbolBar();
		}, 600);
	},
	stopInlineSymbolBarTracking: () => {
		if (PunctuationButtons.symbolBarRetryTimer) {
			clearTimeout(PunctuationButtons.symbolBarRetryTimer);
			PunctuationButtons.symbolBarRetryTimer = null;
		}
		if (PunctuationButtons.symbolBarHideTimer) {
			clearTimeout(PunctuationButtons.symbolBarHideTimer);
			PunctuationButtons.symbolBarHideTimer = null;
		}
		if (PunctuationButtons.symbolBarShowTimer) {
			cancelAnimationFrame(PunctuationButtons.symbolBarShowTimer);
			PunctuationButtons.symbolBarShowTimer = null;
		}
	},
	watchInlineSymbolBarHost: () => {
		if (typeof MutationObserver === "undefined") return;
		if (PunctuationButtons.symbolBarObserver) PunctuationButtons.symbolBarObserver.disconnect();
		PunctuationButtons.symbolBarObserver = new MutationObserver(() => {
			const textarea = PunctuationButtons.getSendTextarea();
			if (!textarea) {
				document.getElementById("monkey-tools-inline-symbols")?.remove();
				PunctuationButtons.scheduleInlineSymbolBarRetry();
				return;
			}
			if (textarea !== PunctuationButtons.symbolBarTextarea) {
				PunctuationButtons.buildInlineSymbolBar();
				return;
			}
			PunctuationButtons.positionInlineSymbolBar();
		});
		PunctuationButtons.symbolBarObserver.observe(document.body, {
			childList: true,
			subtree: true
		});
	},
	baseCss: () => `
        <style>
            @font-face { font-family:"fugu"; src:url("https://files.catbox.moe/5bdcr7.ttf") format("truetype"); font-display:swap; font-weight:normal; font-style:normal; }
            :root { --monkey-tools-font:"fugu", "YouYuan", "Comic Sans MS", var(--mainFontFamily), "Microsoft YaHei", sans-serif; }
            .punct-settings *, .punct-settings *::before, .punct-settings *::after { box-sizing: border-box; }
            .punct-settings { position:relative; overflow-x:hidden; overflow-y:auto; max-height:85vh; color:#000; padding:16px; width:100%; min-width:280px; max-width:620px; font-family:var(--monkey-tools-font); -webkit-overflow-scrolling: touch; background:#fff; text-shadow:none; font-weight:600; border-radius:20px; }
            .punct-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap: wrap; gap: 8px; }
            .punct-title { font-size:18px; font-weight:800; letter-spacing:0; background:#fff; border:1.5px solid #000; border-left:2px solid #000; border-radius:14px; outline:none; padding:10px 18px; }
            
            .punct-tabs { display:flex; gap:6px; margin-bottom:16px; background:#f0f0f0; padding:5px; border:1.5px dashed #000; border-radius:16px; flex-shrink: 0; }
            .punct-tab { flex:1; border:1.5px solid #000; background:#fff; color:#000; border-radius:12px; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:none; }
            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            
            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:14px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:none; }
            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }
            .punct-action:active { transform:translateY(0); box-shadow:none; }
            .punct-action.active { background:#e7e7e7; color:#000; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }
            
            .punct-panel { border:1.5px solid #000; border-radius:18px; padding:16px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; }
            .punct-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; width: 100%; }
            .punct-field label { font-size:12px; font-weight:700; opacity:1; color:#000; }
            .punct-field input, .punct-field select, .punct-field textarea, .cmd-search { border:1.5px dashed #000; border-radius:14px; padding:10px 12px; background:#f0f0f0; transition:all 0.2s; outline:none; font-family:inherit; color:#000; width: 100%; text-shadow:none; }
            .punct-field input:focus, .punct-field textarea:focus, .punct-field select:focus, .cmd-search:focus { background:#fff; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            
            .cmd-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; flex-shrink: 0; }
            .cmd-search { flex:1; min-width: 150px; height:38px; }
            .cmd-filter-bar { display:flex; flex-wrap:wrap; gap:6px; flex:1; }
            .cmd-tag { font-size:12px; padding:4px 12px; border-radius:999px; background:#fff; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; font-weight:700; border:1.5px dashed #000; text-shadow:none; }
            .cmd-tag:hover { background:#f0f0f0; color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-tag.active { background:#fff; color:#000; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }
            
            .cmd-editor-wrap { border:1.5px solid #000; background:#fff; padding:16px; border-radius:18px; margin-bottom:16px; display:none; box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-tag-editor { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; align-items:center; }
            .cmd-tag-add { border:1.5px dashed #000; background:#fff; display:flex; align-items:center; padding:2px 8px; border-radius:999px; transition:border-color 0.2s; }
            .cmd-tag-add:focus-within { border-color:#222; }
            .cmd-tag-add input { border:none; background:transparent; width:70px; outline:none; font-size:12px; padding:4px 0; font-family:inherit; text-shadow:none; }
            
            .cmd-list-wrap { max-height:50vh; overflow-y:auto; padding-right:8px; display:flex; flex-direction:column; gap:12px; scrollbar-width: none; scrollbar-color: transparent transparent; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
            .cmd-list-wrap::-webkit-scrollbar { width:6px; }
            .cmd-list-wrap::-webkit-scrollbar-thumb { background:transparent; border-radius:999px; }
            .cmd-list-wrap::-webkit-scrollbar-thumb:hover { background:transparent; }
            
            .cmd-row { border:1.5px solid #000; border-radius:18px; padding:14px; background:#fff; cursor:pointer; display:flex; gap:12px; transition:all 0.25s; box-shadow:1px 2px 5px #a7a7a7; position:relative; overflow:hidden; align-items: center; flex-shrink: 0; }
            .cmd-row:hover { border-color:#000; box-shadow:3px 3px 3px #80808075; transform:translateY(-1px); }
            .cmd-row.favorite { border-left:4px solid #000; }
            .cmd-row.dragging { opacity:.55; border-style:dashed; box-shadow:none; transform:none; }
            .drag-handle { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; color:#000; background:#f0f0f0; border:1.5px dashed #000; cursor:grab; flex-shrink:0; font-weight:900; line-height:1; touch-action:none; }
            .drag-handle:active { cursor:grabbing; }
            .symbol-edit-row { touch-action:auto; }
            .symbol-edit-row.reorder-active { touch-action:none; }
            @media (hover:none), (pointer:coarse) {
                .drag-handle { width:42px; height:42px; font-size:18px; }
                .symbol-edit-row { min-height:58px; padding:8px 10px !important; gap:10px; }
                .symbol-edit-row input[type="checkbox"] { width:22px; height:22px; }
            }
             
            .cmd-content { flex:1; display:flex; flex-direction:column; gap:6px; min-width: 0; }
            .cmd-title { font-weight:800; font-size:15px; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .cmd-text { font-size:12px; color:#333; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-all; }
            .cmd-tags-display { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }
            .cmd-tag-mini { font-size:11px; background:#f0f0f0; color:#000; padding:2px 8px; border-radius:999px; font-weight:700; white-space: nowrap; border:1px dashed #000; }
            
            .cmd-actions { display:flex; flex-direction:column; gap:10px; align-items:center; justify-content:center; border-left:1.5px dashed #000; padding-left:12px; flex-shrink:0; }
            .cmd-btn-icon { cursor:pointer; font-size:16px; opacity:0.5; transition:all 0.2s; user-select:none; }
            .cmd-btn-icon:hover { opacity:1; transform:scale(1.1); }
            .cmd-btn-heart { color:#000; opacity:1; }
            
            .tag-manage-btn { background:#fff; border:1.5px solid #000; color:#000; cursor:pointer; font-size:12px; font-weight:700; padding:6px 12px; border-radius:999px; white-space:nowrap; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; font-family:inherit; text-shadow:none; box-shadow:1px 2px 5px #a7a7a7; }
            .tag-manage-btn:hover { background:#f0f0f0; color:#000; box-shadow:3px 3px 3px #80808075; }
            .tag-manage-btn.back-mode { width:34px; height:34px; padding:0; border-radius:999px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; color:#000; }
            .tag-manage-btn.back-mode:hover { transform:scale(1.04); box-shadow:3px 3px 3px #80808075; background:#f0f0f0; }

            .cmd-modal-overlay { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(255,255,255,0.72); backdrop-filter:none; -webkit-backdrop-filter:none; z-index:9999; border-radius:18px; display:none; }
            #custom-modal-layer { z-index:10001; }
            #cmd-manager-layer { position:fixed; inset:0; width:100vw; height:100dvh; border-radius:0; z-index:10000; }
            .cmd-confirm-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:20px; padding:24px; box-shadow:3px 3px 3px #80808075; text-align:center; width:85%; max-width:320px; box-sizing:border-box; outline:1.5px solid #000; outline-offset:-7px; }
            .cmd-confirm-text { font-size:15px; font-weight:700; color:#000; margin-bottom:20px; line-height:1.6; word-break:break-all; white-space:pre-wrap; }
            .cmd-confirm-actions { display:flex; justify-content:center; gap:12px; }
            .cmd-manager-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:20px; padding:18px; box-shadow:3px 3px 3px #80808075; width:92%; max-width:560px; max-height:78vh; overflow:hidden; display:flex; flex-direction:column; gap:12px; outline:1.5px solid #000; outline-offset:-7px; }
            .cmd-manager-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 2px; }
            .cmd-manager-title { font-size:18px; font-weight:800; color:#000; }
            .cmd-manager-list { overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding-right:6px; scrollbar-width:none; }
            .cmd-manager-group { border:1.5px dashed #000; border-radius:16px; padding:10px; background:#fff; }
            .cmd-manager-group-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; font-weight:800; }
            .cmd-manager-check { display:inline-flex; align-items:center; gap:8px; cursor:pointer; }
            .cmd-manager-check input[type="checkbox"] { width:16px; height:16px; min-width:16px; min-height:16px; flex:0 0 16px; margin:0; accent-color:#000; }
            .cmd-manager-row { display:flex; align-items:flex-start; gap:10px; padding:8px 0; border-top:1px dashed #d0d0d0; }
            .cmd-manager-row-text { flex:1; min-width:0; }
            .cmd-manager-row-title { font-size:14px; font-weight:800; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
            .cmd-manager-row-body { font-size:12px; color:#333; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-all; }
            .cmd-manager-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; padding-top:4px; }

            .cmd-quick-inserts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
            .cmd-quick-btn { font-size:12px; font-weight:700; padding:4px 8px; border-radius:999px; background:#fff; border:1.5px dashed #000; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; text-shadow:none; }
            .cmd-quick-btn:hover { background:#f0f0f0; color:#000; border-color:#000; transform:translateY(-1px); box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-quick-btn:active { transform:scale(0.95); }

            .preset-shell { display:flex; flex-direction:column; gap:12px; }
            .preset-step { border:1px solid #d0d7de; border-radius:12px; background:#fff; overflow:hidden; }
            .preset-step-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-bottom:1px solid #d0d7de; background:#f8fafc; }
            .preset-step-head h4 { margin:0; font-size:14px; font-weight:800; }
            .preset-step-body { padding:12px; display:flex; flex-direction:column; gap:10px; }
            .preset-setup { display:flex; flex-direction:column; gap:10px; }
            .preset-setup-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) auto; gap:10px; align-items:end; }
            .preset-target-setup-row { grid-template-columns:minmax(120px,.8fr) minmax(0,1.2fr) auto auto; }
            .preset-source-row { display:grid; grid-template-columns:180px minmax(0,1fr); gap:10px; align-items:end; }
            .preset-setup .preset-field { display:flex; flex-direction:column; gap:6px; }
            .preset-field label { font-size:12px; font-weight:800; color:#344054; }
            .preset-setup select, .preset-setup input, .preset-setup button, .preset-step select, .preset-step input, .preset-step button { max-width:100%; min-width:0; }
            .preset-setup select, .preset-setup input, .preset-setup button { height:38px; }
            .preset-category-strip { display:flex; gap:6px; flex-wrap:wrap; align-items:center; padding:8px; border:1px dashed #d0d7de; border-radius:10px; background:#fff; min-height:38px; }
            .preset-category-strip button { min-height:28px; padding:4px 9px; border-radius:999px; font-size:12px; box-shadow:none; }
            .preset-category-strip button.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            .preset-toolbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:space-between; }
            .preset-toggle-group { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
            .preset-toggle { display:inline-flex; gap:6px; align-items:center; font-size:12px; font-weight:700; }
            .preset-insert-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:center; padding:10px; border:1px solid #d0d7de; border-radius:12px; background:#fff; }
            .preset-insert-bar button { min-height:36px; padding:7px 12px; font-size:13px; }
            .preset-insert-hint { color:#667085; font-size:12px; font-weight:700; line-height:1.4; }
            .preset-workbench { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; align-items:start; }
            .preset-column { border:1px solid #d0d7de; border-radius:12px; background:#fff; overflow:hidden; }
            .preset-column-head { padding:10px 12px; border-bottom:1px solid #d0d7de; background:#f8fafc; display:flex; flex-direction:column; gap:8px; }
            .preset-column-title { display:flex; justify-content:space-between; gap:8px; align-items:center; }
            .preset-column-title h4 { margin:0; font-size:14px; font-weight:800; }
            .preset-column-title-actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
            .preset-collapse-btn { min-height:26px; padding:3px 9px; border-radius:999px; font-size:12px; box-shadow:none; }
            .preset-column-tools { display:grid; grid-template-columns:minmax(0,1fr) auto auto; gap:6px; }
            .preset-column-tools.target-tools { grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto auto; }
            .preset-column-tools select, .preset-column-tools input, .preset-column-tools button { width:100%; min-width:0; height:34px; padding:6px 8px; font-size:12px; }
            .preset-list { min-height:360px; max-height:54vh; overflow:auto; padding:10px; display:flex; flex-direction:column; gap:8px; background:#fbfcfe; }
            .preset-slot { border:1px dashed #2da44e; border-radius:8px; background:#f0fff4; color:#1a7f37; padding:8px; text-align:center; font-size:12px; font-weight:800; cursor:pointer; }
            .preset-item { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:8px; align-items:start; border:1px solid #d8dee4; border-radius:10px; background:#fff; padding:9px; }
            .preset-item.clickable { cursor:pointer; }
            .preset-item.clickable:hover { border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            .preset-item.uninserted { border-style:dashed; background:#fffaf0; }
            .preset-item input[type="checkbox"] { width:16px; height:16px; min-width:16px; min-height:16px; margin-top:3px; accent-color:#1f6feb; }
            .preset-item-main { min-width:0; }
            .preset-item-name { font-size:13px; font-weight:800; line-height:1.35; word-break:break-word; }
            .preset-item-meta { margin-top:4px; color:#667085; font-size:11px; line-height:1.5; }
            .preset-item-text { margin-top:5px; color:#52606d; font-size:12px; line-height:1.45; display:-webkit-box; -webkit-line-clamp:3; line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; }
            .preset-tags { display:flex; gap:5px; flex-wrap:wrap; margin-top:5px; }
            .preset-tag { border-radius:999px; background:#edf2f7; color:#52606d; padding:2px 7px; font-size:11px; font-weight:700; }
            .preset-tag.warn { background:#fff0c2; color:#8a6100; }
            .preset-item-actions { display:flex; flex-direction:column; gap:5px; }
            .preset-item-actions .icon-btn { min-width:30px; min-height:28px; padding:0 8px; border-radius:8px; white-space:nowrap; }
            .preset-list-hint { border:1px dashed #d0d7de; border-radius:10px; background:#fff; color:#667085; padding:9px 10px; font-size:12px; line-height:1.45; font-weight:700; }
            .preset-editor { display:grid; grid-template-columns:minmax(200px,220px) minmax(0,1fr); gap:12px; }
            .preset-panel { border:1px solid #d0d7de; border-radius:12px; background:#fff; overflow:hidden; }
            .preset-panel-head { padding:10px 12px; border-bottom:1px solid #d0d7de; background:#f8fafc; font-size:14px; font-weight:800; }
            .preset-panel-body { padding:12px; display:flex; flex-direction:column; gap:10px; }
            .preset-template { border:1px solid #d8dee4; border-radius:8px; background:#fbfcfd; padding:9px; cursor:pointer; }
            .preset-template strong { display:block; margin-bottom:4px; font-size:13px; }
            .preset-template span { color:#667085; font-size:12px; line-height:1.45; }
            .preset-form-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:9px; }
            .preset-quick-row { display:flex; gap:6px; flex-wrap:wrap; padding:8px; border:1px solid #d0d7de; border-radius:8px; background:#f8fafc; }
            .preset-quick-row button { border-radius:999px; min-height:28px; padding:4px 8px; font-size:12px; box-shadow:none; }
            .preset-form-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
            .preset-dialog-mask { position:absolute; inset:0; display:none; place-items:center; padding:18px; background:rgba(15, 23, 42, .42); z-index:10005; border-radius:20px; }
            .preset-dialog-mask.open { display:grid; }
            .preset-dialog { width:min(620px, calc(100% - 24px)); max-height:min(90vh, calc(100% - 24px)); overflow:auto; border-radius:14px; background:#fff; box-shadow:0 24px 70px rgba(15, 23, 42, .32); }
            .preset-dialog-head { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid #d0d7de; }
            .preset-dialog-head h3 { margin:0; font-size:17px; }
            .preset-dialog-body { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
            .preset-detail-content { max-height:55vh; overflow:auto; white-space:pre-wrap; word-break:break-word; border:1px dashed #d0d7de; border-radius:10px; background:#fbfcfd; padding:12px; color:#24292f; font-size:13px; line-height:1.55; }
            .preset-wide { max-width:min(1040px, 96vw); }
            .preset-hidden { display:none !important; }
            .preset-empty { padding:32px 14px; text-align:center; color:#667085; border:1px dashed #d0d7de; border-radius:10px; background:#fff; }
            .preset-badge { border:1px dashed #d0d7de; border-radius:999px; padding:3px 8px; font-size:11px; font-weight:700; color:#475467; background:#fff; white-space:nowrap; }
            .preset-badge.warn { background:#fff0c2; color:#8a6100; border-color:#f2c94c; }

            @media (max-width: 920px) {
                .preset-setup-row, .preset-source-row, .preset-workbench, .preset-editor, .preset-form-grid { grid-template-columns:1fr; }
                .preset-insert-bar { justify-content:stretch; }
                .preset-insert-bar button { flex:1 1 42%; }
                .preset-insert-hint { flex-basis:100%; text-align:center; }
            }
            @media (max-width: 620px) {
                .punct-settings { padding:10px; min-width:0; }
                .preset-shell { gap:10px; }
                .preset-step, .preset-column { border-radius:10px; }
                .preset-step-head { align-items:flex-start; flex-direction:column; }
                .preset-step-body { padding:10px; }
                .preset-setup-row, .preset-source-row { gap:8px; }
                .preset-setup select, .preset-setup input, .preset-setup button, .preset-step select, .preset-step input, .preset-step button { width:100%; }
                .preset-toggle-group { flex-direction:column; align-items:stretch; }
                .preset-toggle { justify-content:flex-start; }
                .preset-column-title, .preset-toolbar { flex-direction:column; align-items:stretch; }
                .preset-column-tools, .preset-column-tools.target-tools { grid-template-columns:1fr; }
                .preset-column-tools button, .preset-insert-bar button { min-height:34px; padding:6px 8px; white-space:normal; line-height:1.25; }
                .preset-list { min-height:280px; max-height:none; }
                .preset-insert-bar button { flex-basis:100%; }
                .preset-item { grid-template-columns:1fr; }
                .preset-item input[type="checkbox"] { margin:0; }
                .preset-item-actions { flex-direction:row; justify-content:flex-end; }
                .preset-item-actions .icon-btn { width:auto; min-width:36px; }
                .preset-category-strip { max-height:150px; overflow:auto; }
            }
        </style>
    `,
	modalHtml: `
        <div class="cmd-modal-overlay" id="custom-modal-layer">
            <div class="cmd-confirm-box">
                <div class="cmd-confirm-text" id="custom-modal-msg"></div>
                <input type="text" id="custom-modal-input" style="display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:14px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;">
                <div class="cmd-confirm-actions">
                    <button class="punct-action" id="custom-modal-cancel">${UI_TEXT.actions.cancel}</button>
                    <button class="punct-action" id="custom-modal-ok">${UI_TEXT.modal.ok}</button>
                </div>
            </div>
        </div>
        <div class="cmd-modal-overlay" id="cmd-manager-layer">
            <div class="cmd-manager-box">
                <div class="cmd-manager-head">
                    <div class="cmd-manager-title">指令管理</div>
                    <button class="tag-manage-btn back-mode" id="cmd-manager-close" title="关闭">×</button>
                </div>
                <div class="cmd-manager-list" id="cmd-manager-list"></div>
                <div class="cmd-manager-actions">
                    <button class="punct-action" id="cmd-manager-delete">删除选中</button>
                    <button class="punct-action" id="cmd-manager-export">导出选中</button>
                </div>
            </div>
        </div>
    `,
	openCommandPanel: (initialView = "commands") => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开指令面板。");
			return;
		}
		const $ = window.jQuery;
		let state = {
			activeMainView: initialView === "symbols" ? "symbols" : initialView === "presets" ? "presets" : "commands",
			activeTab: Object.keys(DEFAULT_CMD_CATEGORIES)[0],
			searchText: "",
			filterTags: [],
			editingId: null,
			editorTags: [],
			isTagManageMode: false
		};
		const quickInsertsHtml = [
			{
				name: "{{char}}",
				left: "{{char}}",
				right: ""
			},
			{
				name: "{{user}}",
				left: "{{user}}",
				right: ""
			},
			...PunctuationButtons.getVisibleSymbols()
		].map((item) => `<span class="cmd-quick-btn" data-left="${PunctuationButtons.escapeHtml(item.left)}" data-right="${PunctuationButtons.escapeHtml(item.right || "")}">${PunctuationButtons.escapeHtml(item.name)}</span>`).join("");
		const $wrap = $(`
            <div class="punct-settings">
                ${PunctuationButtons.baseCss()}
                <div class="punct-tabs monkey-main-tabs">
                    <button class="punct-tab monkey-main-tab ${state.activeMainView === "commands" ? "active" : ""}" data-main-view="commands">${UI_TEXT.mainTabs.commands}</button>
                    <button class="punct-tab monkey-main-tab ${state.activeMainView === "symbols" ? "active" : ""}" data-main-view="symbols">${UI_TEXT.mainTabs.symbols}</button>
                    <button class="punct-tab monkey-main-tab ${state.activeMainView === "presets" ? "active" : ""}" data-main-view="presets">预设插入</button>
                </div>
                <div data-main-panel="commands">
                <div class="punct-head" style="justify-content:flex-end;">
                    <div style="display:flex; gap:8px;">
                        <button class="punct-action" id="cmd-import-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="${UI_TEXT.tooltips.import}">${UI_TEXT.actions.import}</button>
                        <button class="punct-action" id="cmd-export-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="${UI_TEXT.tooltips.export}">${UI_TEXT.actions.export}</button>
                        <input type="file" id="cmd-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                
                <div class="punct-tabs" id="cmd-tabs-container">
                    ${Object.keys(DEFAULT_CMD_CATEGORIES).map((cat) => `<button class="punct-tab ${state.activeTab === cat ? "active" : ""}" data-cat="${cat}">${cat}</button>`).join("")}
                </div>

                <div class="cmd-toolbar">
                    <input type="text" class="cmd-search" id="cmd-search-input" placeholder="${UI_TEXT.fields.search}">
                    <button class="punct-action" id="cmd-toggle-cat-btn" style="height:38px; padding:0 12px;" title="${UI_TEXT.tooltips.format}">${UI_TEXT.actions.format}</button>
                    <button class="punct-action" id="cmd-toggle-editor-btn" style="height:38px;">${UI_TEXT.actions.newCommand}</button>
                    <button class="punct-action" id="cmd-manager-btn" style="height:38px;">指令管理</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; min-height: 28px;">
                    <div class="cmd-filter-bar" id="cmd-filter-container"></div>
                    <button class="tag-manage-btn" id="cmd-manage-tags-btn">${UI_TEXT.actions.manageTags}</button>
                </div>

                <div class="cmd-editor-wrap" id="cmd-cat-panel">
                    <div class="punct-field" style="margin-bottom:12px;">
                        <label>${UI_TEXT.fields.categoryFormat.replace("{category}", "<span id=\"current-cat-name\" style=\"color:#000; font-size:14px; font-weight:800;\"></span>")}</label>
                    </div>
                    <div class="punct-field">
                        <label>${UI_TEXT.fields.prefix}</label>
                        <input type="text" id="cmd-cat-prefix" placeholder="${UI_TEXT.fields.prefixPlaceholder}" style="font-size:14px; padding:10px;">
                    </div>
                    <div class="punct-field">
                        <label>${UI_TEXT.fields.suffix}</label>
                        <input type="text" id="cmd-cat-suffix" placeholder="${UI_TEXT.fields.suffixPlaceholder}" style="font-size:14px; padding:10px;">
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="punct-action" id="cmd-cat-cancel-btn">${UI_TEXT.actions.cancel}</button>
                        <button class="punct-action" id="cmd-cat-save-btn">${UI_TEXT.actions.saveFormat}</button>
                    </div>
                </div>

                <div class="cmd-editor-wrap" id="cmd-editor-panel">
                    <div class="punct-field">
                        <input type="text" id="cmd-input-title" placeholder="${UI_TEXT.fields.commandTitle}">
                    </div>
                    
                    <div class="punct-field">
                        <div class="cmd-quick-inserts">${quickInsertsHtml}</div>
                        <textarea id="cmd-input-text" rows="3" placeholder="${UI_TEXT.fields.commandText}"></textarea>
                    </div>
                    
                    <div class="punct-field">
                        <label>${UI_TEXT.fields.tags}</label>
                        <div class="cmd-tag-editor" id="cmd-editor-tags"></div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="punct-action" id="cmd-cancel-btn">${UI_TEXT.actions.cancel}</button>
                        <button class="punct-action" id="cmd-save-btn">${UI_TEXT.actions.saveCommand}</button>
                    </div>
                </div>

                <div class="cmd-list-wrap" id="cmd-list-container"></div>
                </div>
                <div data-main-panel="symbols" style="display:none;">
                    <div class="punct-head" style="justify-content:flex-end;">
                        <label class="punct-action" style="gap:8px; cursor:pointer;">
                            <input type="checkbox" id="symbol-inline-toggle" style="width:16px; height:16px; min-width:16px; min-height:16px; flex:0 0 16px; margin:0; accent-color:#000;" ${PunctuationButtons.getInlineSymbolsEnabled() ? "checked" : ""}>
                            <span>${UI_TEXT.symbols.inlineToggle}</span>
                        </label>
                    </div>
                    <div class="punct-tabs" id="symbol-tabs-container">
                        <button class="punct-tab active" data-symbol-view="add">${UI_TEXT.symbols.addTab}</button>
                        <button class="punct-tab" data-symbol-view="edit">${UI_TEXT.symbols.editTab}</button>
                    </div>
                    <div class="punct-panel" id="symbol-content"></div>
                </div>
                <div data-main-panel="presets" style="display:none;">
                    <div class="preset-shell">
                        <div class="preset-setup">
                            <div class="preset-step">
                                <div class="preset-step-head">
                                    <h4>1. 选择来源</h4>
                                </div>
                                <div class="preset-step-body">
                                    <div class="preset-setup-row">
                                        <div class="preset-field">
                                            <label>左侧来源</label>
                                            <select id="preset-source-kind">
                                                <option value="preset">源预设</option>
                                                <option value="commands">指令仓库</option>
                                            </select>
                                        </div>
                                        <div class="preset-field" id="preset-source-preset-field">
                                            <label>源预设</label>
                                            <select id="preset-source-preset"><option value="">请选择源预设</option></select>
                                        </div>
                                        <button class="punct-action" id="preset-current-source">当前预设为源</button>
                                    </div>
                                </div>
                            </div>

                            <div class="preset-step">
                                <div class="preset-step-head">
                                    <h4>2. 选择目标</h4>
                                </div>
                                <div class="preset-step-body">
                                    <div class="preset-setup-row preset-target-setup-row">
                                        <div class="preset-field">
                                            <label>目标类型</label>
                                            <select id="preset-target-kind">
                                                <option value="preset">目标预设</option>
                                                <option value="commands">指令仓库</option>
                                            </select>
                                        </div>
                                        <div class="preset-field">
                                            <label>目标预设</label>
                                            <select id="preset-target-preset"><option value="">请选择目标预设</option></select>
                                        </div>
                                        <button class="punct-action" id="preset-current-target">当前预设为目标</button>
                                        <button class="punct-action" id="preset-load-btn" style="height:38px;">读取</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="preset-step">
                            <div class="preset-step-head">
                                <h4>3. 插入到目标</h4>
                                <span class="preset-insert-hint">单向写入：只修改目标预设。</span>
                            </div>
                            <div class="preset-step-body">
                                <div class="preset-insert-bar">
                                    <button class="punct-action" id="preset-insert-selected">插入到目标</button>
                                </div>
                            </div>
                        </div>

                        <div class="preset-workbench">
                            <div class="preset-column">
                                <div class="preset-column-head">
                                    <div class="preset-column-title">
                                        <h4 id="preset-source-title">源内容</h4>
                                        <div class="preset-column-title-actions">
                                            <span class="preset-badge" id="preset-source-count">0 条</span>
                                            <button class="punct-action preset-collapse-btn" id="preset-source-collapse" type="button">折叠</button>
                                        </div>
                                    </div>
                                    <div class="preset-column-tools">
                                        <input type="text" id="preset-source-search" placeholder="搜索源内容">
                                        <button class="punct-action" id="preset-source-all">全选</button>
                                        <button class="punct-action" id="preset-source-none">清空</button>
                                    </div>
                                    <div class="preset-field preset-hidden" id="preset-command-category-field">
                                        <label>指令分类</label>
                                        <select id="preset-command-category"></select>
                                    </div>
                                    <div class="preset-field preset-hidden" id="preset-command-category-strip-field">
                                        <label>分类快捷选择</label>
                                        <div class="preset-category-strip" id="preset-command-category-strip"></div>
                                    </div>
                                </div>
                                <div class="preset-list" id="preset-source-list"></div>
                            </div>

                            <div class="preset-column">
                                <div class="preset-column-head">
                                    <div class="preset-column-title">
                                        <h4 id="preset-target-title">目标预设</h4>
                                        <div class="preset-column-title-actions">
                                            <span class="preset-badge" id="preset-target-count">0 条</span>
                                            <button class="punct-action preset-collapse-btn" id="preset-target-collapse" type="button">折叠</button>
                                        </div>
                                    </div>
                                    <div class="preset-column-tools target-tools">
                                        <input type="text" id="preset-target-search" placeholder="搜索目标条目">
                                        <select id="preset-target-mode">
                                            <option value="inserted">已插入条目</option>
                                            <option value="uninserted">显示未插入提示词</option>
                                            <option value="all">显示全部</option>
                                        </select>
                                        <button class="punct-action" id="preset-target-all">全选</button>
                                        <button class="punct-action" id="preset-delete-target">批量删除</button>
                                    </div>
                                    <div class="preset-field preset-hidden" id="preset-target-command-category-field">
                                        <label>目标指令分类</label>
                                        <select id="preset-target-command-category"></select>
                                    </div>
                                    <div class="preset-field preset-hidden" id="preset-target-command-category-strip-field">
                                        <label>分类快捷选择</label>
                                        <div class="preset-category-strip" id="preset-target-command-category-strip"></div>
                                    </div>
                                </div>
                                <div class="preset-list" id="preset-target-list"></div>
                            </div>
                        </div>
                    </div>
                    <div class="preset-dialog-mask" id="preset-edit-layer">
                        <div class="preset-dialog">
                            <div class="preset-dialog-head">
                                <h3>编辑目标条目</h3>
                                <button class="tag-manage-btn back-mode" id="preset-edit-close" title="关闭">×</button>
                            </div>
                            <div class="preset-dialog-body">
                                <div class="preset-form-grid">
                                    <div class="punct-field">
                                        <label>条目名称</label>
                                        <input type="text" id="preset-edit-name">
                                    </div>
                                    <div class="punct-field">
                                        <label>角色</label>
                                        <select id="preset-edit-role">
                                            <option value="system">system</option>
                                            <option value="user">user</option>
                                            <option value="assistant">assistant</option>
                                        </select>
                                    </div>
                                    <div class="punct-field">
                                        <label>注入位置</label>
                                        <select id="preset-edit-position">
                                            <option value="relative">相对</option>
                                            <option value="chat">聊天中</option>
                                        </select>
                                    </div>
                                    <div class="punct-field">
                                        <label>注入深度</label>
                                        <input type="number" id="preset-edit-depth" min="0" max="100">
                                    </div>
                                </div>
                                <div class="preset-form-grid">
                                    <div class="punct-field">
                                        <label>注入顺序</label>
                                        <input type="number" id="preset-edit-order">
                                    </div>
                                    <div class="punct-field" style="grid-column: span 3;">
                                        <label>触发条件，逗号分隔</label>
                                        <input type="text" id="preset-edit-triggers" placeholder="user, assistant">
                                    </div>
                                </div>
                                <div class="punct-field">
                                    <label>内容</label>
                                    <div class="preset-quick-row" id="preset-edit-quick-row">
                                        ${quickInsertsHtml}
                                    </div>
                                    <textarea id="preset-edit-content" rows="8"></textarea>
                                </div>
                                <div class="preset-form-actions">
                                    <button class="punct-action" id="preset-edit-cancel">取消</button>
                                    <button class="punct-action" id="preset-edit-save">保存</button>
                                    <button class="punct-action" id="preset-edit-save-insert">保存并插入</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="preset-dialog-mask" id="preset-detail-layer">
                        <div class="preset-dialog">
                            <div class="preset-dialog-head">
                                <h3 id="preset-detail-title">条目详情</h3>
                                <button class="tag-manage-btn back-mode" id="preset-detail-close" title="关闭">×</button>
                            </div>
                            <div class="preset-dialog-body">
                                <div class="preset-tags" id="preset-detail-meta"></div>
                                <div class="preset-detail-content" id="preset-detail-content"></div>
                            </div>
                        </div>
                    </div>
                </div>
                ${PunctuationButtons.modalHtml}
            </div>
        `);
		let modalCallback = null;
		let modalCancelCallback = null;
		let isPromptMode = false;
		const showModal = (options) => {
			$wrap.find("#custom-modal-msg").text(options.msg);
			modalCallback = options.onOk;
			modalCancelCallback = options.onCancel || null;
			isPromptMode = !!options.prompt;
			const $input = $wrap.find("#custom-modal-input");
			if (isPromptMode) {
				$input.val(options.defaultVal || "").show();
				$wrap.find("#custom-modal-ok").text(UI_TEXT.modal.ok);
			} else {
				$input.hide();
				if (options.isAlert) $wrap.find("#custom-modal-ok").text(UI_TEXT.modal.gotIt);
				else $wrap.find("#custom-modal-ok").text(options.okText || UI_TEXT.modal.confirmAction);
			}
			$wrap.find("#custom-modal-cancel").text(options.cancelText || UI_TEXT.actions.cancel);
			if (options.isAlert) $wrap.find("#custom-modal-cancel").hide();
			else $wrap.find("#custom-modal-cancel").show();
			$wrap.find("#custom-modal-layer").fadeIn(150);
			if (isPromptMode) setTimeout(() => $input.focus(), 160);
		};
		$wrap.find("#custom-modal-cancel").on("click", () => {
			if (modalCancelCallback) modalCancelCallback();
			modalCallback = null;
			modalCancelCallback = null;
			$wrap.find("#custom-modal-layer").fadeOut(150);
		});
		$wrap.find("#custom-modal-ok").on("click", () => {
			const val = isPromptMode ? $wrap.find("#custom-modal-input").val() : true;
			if (modalCallback) modalCallback(val);
			modalCallback = null;
			modalCancelCallback = null;
			$wrap.find("#custom-modal-layer").fadeOut(150);
		});
		const downloadJson = (data, filenamePrefix) => {
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${filenamePrefix}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		};
		const buildCommandExportData = (commands, includeFormat, includeSymbols = false) => {
			const exportedCommands = commands.map((command) => ({ ...command }));
			const payload = {
				version: 1,
				commands: exportedCommands,
				tags: Array.from(new Set(exportedCommands.flatMap((command) => command.tags || [])))
			};
			if (includeFormat) {
				const currentCategories = PunctuationButtons.loadCategorySettings();
				payload.categories = includeSymbols ? { ...currentCategories } : {};
				if (!includeSymbols) exportedCommands.forEach((command) => {
					const categoryName = command.category || Object.keys(DEFAULT_CMD_CATEGORIES)[0];
					if (!payload.categories[categoryName]) payload.categories[categoryName] = currentCategories[categoryName] || {
						prefix: "",
						suffix: ""
					};
				});
			}
			if (includeSymbols) {
				payload.tags = Array.from(new Set([...PunctuationButtons.loadGlobalTags(), ...payload.tags]));
				payload.symbols = PunctuationButtons.loadCustomSymbols();
			}
			return payload;
		};
		const askExportFormat = (onChoice) => {
			showModal({
				msg: "是否连同格式导出？",
				okText: "带格式",
				cancelText: "不带格式",
				onOk: () => onChoice(true),
				onCancel: () => onChoice(false)
			});
		};
		const exportCommands = (commands, includeFormat, includeSymbols = false, filenamePrefix = "sillytavern_commands_backup") => {
			downloadJson(buildCommandExportData(commands, includeFormat, includeSymbols), filenamePrefix);
			if (window.toastr) toastr.success(UI_TEXT.messages.exportSuccess);
		};
		const normalizeCategoryName = (categoryName) => {
			const categories = Object.keys(DEFAULT_CMD_CATEGORIES);
			return categories.includes(categoryName) ? categoryName : categories[0];
		};
		const presetState = {
			sourceKind: "preset",
			targetKind: "preset",
			sourcePreset: "",
			targetPreset: "",
			sourceCategory: Object.keys(DEFAULT_CMD_CATEGORIES)[0],
			targetCategory: Object.keys(DEFAULT_CMD_CATEGORIES)[0],
			sourceSearch: "",
			targetSearch: "",
			targetMode: "inserted",
			sourceCollapsed: false,
			targetCollapsed: false,
			sourceSelection: /* @__PURE__ */ new Set(),
			targetSelection: /* @__PURE__ */ new Set(),
			editEntry: null,
			editIsNew: false,
			editShouldInsert: false
		};
		const presetTimestamp = () => {
			const now = /* @__PURE__ */ new Date();
			const pad = (value) => String(value).padStart(2, "0");
			return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
		};
		const presetApiInfo = () => {
			try {
				const context = window.SillyTavern?.getContext?.() || window.parent?.SillyTavern?.getContext?.() || {};
				const mainApi = context.mainApi;
				const manager = context.getPresetManager?.(mainApi === "koboldhorde" ? "kobold" : mainApi) || context.presetManager;
				if (!manager) return null;
				return {
					context,
					mainApi,
					presetManager: manager,
					presetNames: (() => {
						try {
							const list = manager.getPresetList?.();
							const normalizeNames = (items) => Array.from(new Set((items || []).map((item) => typeof item === "string" ? item : item?.name || item?.preset_name || item?.value).filter(Boolean).map(String)));
							if (Array.isArray(list?.preset_names)) return normalizeNames(list.preset_names);
							if (list?.preset_names && typeof list.preset_names === "object") return normalizeNames(Object.keys(list.preset_names));
							if (Array.isArray(list?.presets)) return normalizeNames(list.presets);
							if (list?.presets && typeof list.presets === "object") return normalizeNames(Object.keys(list.presets));
							if (Array.isArray(list)) return normalizeNames(list);
							if (Array.isArray(manager.preset_names)) return normalizeNames(manager.preset_names);
							if (manager.preset_names && typeof manager.preset_names === "object") return normalizeNames(Object.keys(manager.preset_names));
							return [];
						} catch (_) {
							return [];
						}
					})()
				};
			} catch (error) {
				return null;
			}
		};
		const getPresetNames = () => {
			const names = presetApiInfo()?.presetNames || [];
			const current = getLoadedPresetName();
			return current && !names.includes(current) ? [current, ...names] : names;
		};
		const getLoadedPresetName = () => window.getLoadedPresetName?.() || window.TavernHelper?.getLoadedPresetName?.() || null;
		const cloneData = (value) => JSON.parse(JSON.stringify(value));
		const getPresetDataByName = (name) => {
			const apiInfo = presetApiInfo();
			if (!apiInfo || !name) return null;
			try {
				return apiInfo.presetManager.getCompletionPresetByName(name);
			} catch (error) {
				return null;
			}
		};
		const savePresetData = async (name, data) => {
			const apiInfo = presetApiInfo();
			if (!apiInfo) throw new Error("无法获取预设管理器");
			await apiInfo.presetManager.savePreset(name, data);
		};
		const ensureOrderBucket = (presetData) => {
			if (!presetData.prompt_order) presetData.prompt_order = [];
			let bucket = presetData.prompt_order.find((order) => order.character_id === 100001);
			if (!bucket) {
				bucket = {
					character_id: 100001,
					order: []
				};
				presetData.prompt_order.push(bucket);
			}
			return bucket;
		};
		const ensureUniqueTargetName = (presetData, baseName) => {
			const existingNames = new Set((presetData.prompts || []).map((item) => item && item.name).filter(Boolean));
			if (!existingNames.has(baseName)) return baseName;
			const stamp = presetTimestamp();
			let candidate = `${baseName}_${stamp}`;
			let index = 2;
			while (existingNames.has(candidate)) {
				candidate = `${baseName}_${stamp}_${index}`;
				index += 1;
			}
			return candidate;
		};
		const normalizePromptItem = (prompt, enabled = true, isUninserted = false) => ({
			...cloneData(prompt),
			enabled: !!enabled,
			isUninserted: !!isUninserted
		});
		const getPromptEntriesFromPreset = (presetData, mode = "all") => {
			const prompts = Array.isArray(presetData?.prompts) ? presetData.prompts.filter((prompt) => prompt && !prompt.system_prompt && !prompt.marker && String(prompt.name || "").trim()) : [];
			const orderBucket = presetData?.prompt_order?.find((order) => order.character_id === 100001);
			const ordered = [];
			const insertedIds = /* @__PURE__ */ new Set();
			if (orderBucket?.order?.length) orderBucket.order.forEach((orderEntry) => {
				const prompt = prompts.find((item) => item.identifier === orderEntry.identifier);
				if (!prompt) return;
				insertedIds.add(prompt.identifier);
				ordered.push(normalizePromptItem(prompt, orderEntry.enabled !== false, false));
			});
			const uninserted = prompts.filter((prompt) => !insertedIds.has(prompt.identifier)).map((prompt) => normalizePromptItem(prompt, false, true));
			if (mode === "inserted") return ordered;
			if (mode === "uninserted") return uninserted;
			return ordered.concat(uninserted);
		};
		const getAvailableCommandCategories = () => {
			const categories = new Set(Object.keys(PunctuationButtons.loadCategorySettings()));
			PunctuationButtons.loadCommands().forEach((command) => {
				if (command?.category) categories.add(String(command.category));
			});
			const result = Array.from(categories).filter(Boolean);
			return result.length ? result : Object.keys(DEFAULT_CMD_CATEGORIES);
		};
		const normalizePresetSourceCategory = () => {
			const categories = getAvailableCommandCategories();
			if (!categories.includes(presetState.sourceCategory)) presetState.sourceCategory = categories[0] || Object.keys(DEFAULT_CMD_CATEGORIES)[0];
			return presetState.sourceCategory;
		};
		const normalizePresetTargetCategory = () => {
			const categories = getAvailableCommandCategories();
			if (!categories.includes(presetState.targetCategory)) presetState.targetCategory = categories[0] || Object.keys(DEFAULT_CMD_CATEGORIES)[0];
			return presetState.targetCategory;
		};
		const getSourceEntries = () => {
			if (presetState.sourceKind === "commands") {
				const selectedCategory = normalizePresetSourceCategory();
				return PunctuationButtons.loadCommands().filter((command) => String(command.category || "") === selectedCategory).map((command) => ({
					sourceType: "command",
					commandId: command.id,
					name: command.title || command.text?.slice(0, 12) || "指令内容",
					content: command.text || "",
					role: "system",
					isCommand: true
				})).filter((entry) => {
					const query = presetState.sourceSearch.trim().toLowerCase();
					if (!query) return true;
					return [entry.content, entry.name].some((value) => String(value || "").toLowerCase().includes(query));
				});
			}
			if (!presetState.sourcePreset) return [];
			return getPromptEntriesFromPreset(getPresetDataByName(presetState.sourcePreset), "all").filter((entry) => {
				const query = presetState.sourceSearch.trim().toLowerCase();
				if (!query) return true;
				return [
					entry.name,
					entry.content,
					entry.role,
					entry.injection_order,
					entry.injection_depth
				].map((value) => String(value ?? "")).join(" ").toLowerCase().includes(query);
			});
		};
		const getTargetEntries = () => {
			if (presetState.targetKind === "commands") {
				const selectedCategory = normalizePresetTargetCategory();
				return PunctuationButtons.loadCommands().filter((command) => String(command.category || "") === selectedCategory).map((command) => ({
					sourceType: "command",
					commandId: command.id,
					identifier: command.id,
					name: command.title || command.text?.slice(0, 12) || "指令内容",
					content: command.text || "",
					role: "指令仓库",
					tags: Array.isArray(command.tags) ? command.tags : []
				})).filter((entry) => {
					const query = presetState.targetSearch.trim().toLowerCase();
					if (!query) return true;
					return [
						entry.name,
						entry.content,
						entry.role,
						...entry.tags || []
					].map((value) => String(value ?? "")).join(" ").toLowerCase().includes(query);
				});
			}
			if (!presetState.targetPreset) return [];
			return getPromptEntriesFromPreset(getPresetDataByName(presetState.targetPreset), presetState.targetMode).filter((entry) => {
				const query = presetState.targetSearch.trim().toLowerCase();
				if (!query) return true;
				return [
					entry.name,
					entry.content,
					entry.role,
					entry.injection_order,
					entry.injection_depth
				].map((value) => String(value ?? "")).join(" ").toLowerCase().includes(query);
			});
		};
		const commandCategoryOptions = () => {
			normalizePresetSourceCategory();
			return getAvailableCommandCategories().map((category) => `<option value="${PunctuationButtons.escapeHtml(category)}" ${presetState.sourceCategory === category ? "selected" : ""}>${PunctuationButtons.escapeHtml(category)}</option>`).join("");
		};
		const targetCommandCategoryOptions = () => {
			normalizePresetTargetCategory();
			return getAvailableCommandCategories().map((category) => `<option value="${PunctuationButtons.escapeHtml(category)}" ${presetState.targetCategory === category ? "selected" : ""}>${PunctuationButtons.escapeHtml(category)}</option>`).join("");
		};
		const commandCategoryButtons = () => {
			normalizePresetSourceCategory();
			return getAvailableCommandCategories().map((category) => `<button type="button" class="${presetState.sourceCategory === category ? "active" : ""}" data-preset-category="${PunctuationButtons.escapeHtml(category)}">${PunctuationButtons.escapeHtml(category)}</button>`).join("");
		};
		const targetCommandCategoryButtons = () => {
			normalizePresetTargetCategory();
			return getAvailableCommandCategories().map((category) => `<button type="button" class="${presetState.targetCategory === category ? "active" : ""}" data-preset-target-category="${PunctuationButtons.escapeHtml(category)}">${PunctuationButtons.escapeHtml(category)}</button>`).join("");
		};
		const fillPresetSelectors = () => {
			const names = getPresetNames();
			const selectedSource = presetState.sourcePreset;
			const selectedTarget = presetState.targetPreset;
			$wrap.find("#preset-source-preset").html(`<option value="">请选择源预设</option>${names.map((name) => `<option value="${PunctuationButtons.escapeHtml(name)}" ${selectedSource === name ? "selected" : ""}>${PunctuationButtons.escapeHtml(name)}</option>`).join("")}`);
			$wrap.find("#preset-target-preset").html(`<option value="">请选择目标预设</option>${names.map((name) => `<option value="${PunctuationButtons.escapeHtml(name)}" ${selectedTarget === name ? "selected" : ""}>${PunctuationButtons.escapeHtml(name)}</option>`).join("")}`);
			$wrap.find("#preset-command-category").html(commandCategoryOptions());
			$wrap.find("#preset-command-category-strip").html(commandCategoryButtons());
			$wrap.find("#preset-target-command-category").html(targetCommandCategoryOptions());
			$wrap.find("#preset-target-command-category-strip").html(targetCommandCategoryButtons());
		};
		const renderPresetSourceList = () => {
			const entries = getSourceEntries();
			presetState.sourceEntries = entries;
			$wrap.find("#preset-source-count").text(`${entries.length} 条`);
			const hint = presetState.sourceKind === "commands" ? "<div class=\"preset-list-hint\">点击条目查看完整内容；勾选要插入的具体指令，然后点击上方插入按钮。写入预设时只会插入指令内容，默认 system。</div>" : "<div class=\"preset-list-hint\">点击条目查看完整内容；勾选源预设条目后插入到目标预设，源预设不会被修改。</div>";
			if (!entries.length) {
				const emptyText = presetState.sourceKind === "commands" ? `当前分类「${PunctuationButtons.escapeHtml(presetState.sourceCategory)}」没有指令，请切换分类或先在指令仓库新增指令。` : presetState.sourcePreset ? "当前源预设没有可插入条目。" : "请选择源预设。";
				$wrap.find("#preset-source-list").html(`${hint}<div class="preset-empty">${emptyText}</div>`);
				return;
			}
			const html = entries.map((entry, index) => {
				const id = entry.identifier || entry.commandId || `source-${index}`;
				const checked = presetState.sourceSelection.has(id) ? "checked" : "";
				const badgeHtml = entry.isUninserted ? "<span class=\"preset-tag warn\">未插入</span>" : "";
				const roleMeta = entry.sourceType === "command" ? "<span class=\"preset-tag\">指令仓库</span><span class=\"preset-tag\">system</span>" : `<span class="preset-tag">${PunctuationButtons.escapeHtml(entry.role || "system")}</span><span class="preset-tag">${entry.isUninserted ? "未插入" : "已插入"}</span>`;
				return `
                    <article class="preset-item clickable ${entry.isUninserted ? "uninserted" : ""}" data-source-detail="${PunctuationButtons.escapeHtml(id)}" data-id="${PunctuationButtons.escapeHtml(id)}">
                        <input type="checkbox" data-source-check="${PunctuationButtons.escapeHtml(id)}" ${checked}>
                        <div class="preset-item-main">
                            <div class="preset-item-name">${PunctuationButtons.escapeHtml(entry.name || "未命名")}</div>
                            <div class="preset-tags">${roleMeta}${badgeHtml}</div>
                            <div class="preset-item-text">${PunctuationButtons.escapeHtml(entry.content || "")}</div>
                        </div>
                    </article>
                `;
			}).join("");
			$wrap.find("#preset-source-list").html(`${hint}${html}`);
		};
		const renderPresetTargetList = () => {
			const entries = getTargetEntries();
			presetState.targetEntries = entries;
			$wrap.find("#preset-target-count").text(`${entries.length} 条`);
			if (presetState.targetKind === "commands") {
				if (!entries.length) {
					$wrap.find("#preset-target-list").html(`<div class="preset-empty">当前目标分类「${PunctuationButtons.escapeHtml(presetState.targetCategory)}」还没有指令</div>`);
					return;
				}
				const html = entries.map((entry, index) => {
					const id = entry.identifier || entry.commandId || `target-${index}`;
					const checked = presetState.targetSelection.has(id) ? "checked" : "";
					const tagHtml = (entry.tags || []).slice(0, 4).map((tag) => `<span class="preset-tag">${PunctuationButtons.escapeHtml(tag)}</span>`).join("");
					return `
                        <article class="preset-item" data-id="${PunctuationButtons.escapeHtml(id)}">
                            <input type="checkbox" data-target-check="${PunctuationButtons.escapeHtml(id)}" ${checked}>
                            <div class="preset-item-main">
                                <div class="preset-item-name">${PunctuationButtons.escapeHtml(entry.name || "未命名")}</div>
                                <div class="preset-tags"><span class="preset-tag">指令仓库</span>${tagHtml}</div>
                                <div class="preset-item-text">${PunctuationButtons.escapeHtml(entry.content || "")}</div>
                            </div>
                        </article>
                    `;
				}).join("");
				$wrap.find("#preset-target-list").html(html);
				return;
			}
			if (!presetState.targetPreset) {
				$wrap.find("#preset-target-list").html("<div class=\"preset-empty\">请选择目标预设</div>");
				return;
			}
			if (!entries.length) {
				$wrap.find("#preset-target-list").html("<div class=\"preset-empty\">没有可显示的目标条目</div>");
				return;
			}
			const html = entries.map((entry, index) => {
				const id = entry.identifier || `target-${index}`;
				const checked = presetState.targetSelection.has(id) ? "checked" : "";
				const isUninserted = !!entry.isUninserted;
				return `
                    <article class="preset-item ${isUninserted ? "uninserted" : ""}" data-id="${PunctuationButtons.escapeHtml(id)}">
                        <input type="checkbox" data-target-check="${PunctuationButtons.escapeHtml(id)}" ${checked}>
                        <div class="preset-item-main">
                            <div class="preset-item-name">${PunctuationButtons.escapeHtml(entry.name || "未命名")}</div>
                            <div class="preset-tags">
                                <span class="preset-tag">${PunctuationButtons.escapeHtml(entry.role || "system")}</span>
                                ${isUninserted ? "<span class=\"preset-tag warn\">未插入提示词</span>" : "<span class=\"preset-tag\">已插入</span>"}
                                <span class="preset-tag">顺序 ${PunctuationButtons.escapeHtml(String(entry.injection_order ?? 100))}</span>
                            </div>
                            <div class="preset-item-text">${PunctuationButtons.escapeHtml(entry.content || "")}</div>
                        </div>
                        <div class="preset-item-actions">
                            <button class="icon-btn preset-target-edit" data-target-edit="${PunctuationButtons.escapeHtml(id)}" title="编辑">✎</button>
                            <button class="icon-btn preset-target-insert" data-target-insert="${PunctuationButtons.escapeHtml(id)}" title="插入到指定位置">⌖</button>
                        </div>
                    </article>
                `;
			}).join("");
			$wrap.find("#preset-target-list").html(`${html}`);
		};
		const renderPresetPanel = () => {
			fillPresetSelectors();
			$wrap.find("#preset-source-kind").val(presetState.sourceKind);
			$wrap.find("#preset-target-kind").val(presetState.targetKind);
			$wrap.find("#preset-source-search").val(presetState.sourceSearch);
			$wrap.find("#preset-target-search").val(presetState.targetSearch);
			$wrap.find("#preset-target-mode").val(presetState.targetMode);
			$wrap.find("#preset-source-title").text(presetState.sourceKind === "commands" ? `选择要插入的指令：${presetState.sourceCategory}` : `源预设: ${presetState.sourcePreset || "未选择"}`);
			$wrap.find("#preset-target-title").text(presetState.targetKind === "commands" ? `目标指令仓库: ${presetState.targetCategory}` : `目标预设: ${presetState.targetPreset || "未选择"}`);
			$wrap.find("#preset-source-preset-field").toggleClass("preset-hidden", presetState.sourceKind !== "preset");
			$wrap.find("#preset-command-category-field").toggleClass("preset-hidden", presetState.sourceKind !== "commands");
			$wrap.find("#preset-command-category-strip-field").toggleClass("preset-hidden", presetState.sourceKind !== "commands");
			$wrap.find("#preset-target-preset").closest(".preset-field").toggleClass("preset-hidden", presetState.targetKind !== "preset");
			$wrap.find("#preset-current-target, #preset-target-mode, #preset-delete-target").toggleClass("preset-hidden", presetState.targetKind !== "preset");
			$wrap.find("#preset-target-command-category-field").toggleClass("preset-hidden", presetState.targetKind !== "commands");
			$wrap.find("#preset-target-command-category-strip-field").toggleClass("preset-hidden", presetState.targetKind !== "commands");
			$wrap.find("#preset-source-collapse").text(presetState.sourceCollapsed ? "展开" : "折叠");
			$wrap.find("#preset-target-collapse").text(presetState.targetCollapsed ? "展开" : "折叠");
			$wrap.find("#preset-source-list").toggleClass("preset-hidden", presetState.sourceCollapsed);
			$wrap.find("#preset-target-list").toggleClass("preset-hidden", presetState.targetCollapsed);
			renderPresetSourceList();
			renderPresetTargetList();
			$wrap.find("#preset-source-list").toggleClass("preset-hidden", presetState.sourceCollapsed);
			$wrap.find("#preset-target-list").toggleClass("preset-hidden", presetState.targetCollapsed);
			$wrap.toggleClass("preset-wide", true);
		};
		const setPresetSelectionFromCurrent = (side) => {
			const current = getLoadedPresetName();
			if (!current) return showModal({
				msg: "无法获取当前预设名称。",
				isAlert: true
			});
			if (!getPresetNames().includes(current)) return showModal({
				msg: `当前预设 "${current}" 不在可用列表中。`,
				isAlert: true
			});
			if (side === "source") presetState.sourcePreset = current;
			else presetState.targetPreset = current;
			renderPresetPanel();
		};
		const buildCommandSourcePrompt = (entry) => {
			const baseName = `指令_${presetTimestamp()}`;
			return {
				identifier: PunctuationButtons.generateId(),
				name: baseName,
				role: "system",
				content: entry.content || "",
				injection_position: null,
				injection_depth: 4,
				injection_order: 100,
				injection_trigger: [],
				system_prompt: false,
				marker: false
			};
		};
		const buildPresetCopyPrompt = (entry, targetData) => {
			const copy = cloneData(entry);
			copy.identifier = PunctuationButtons.generateId();
			copy.name = ensureUniqueTargetName(targetData, copy.name || `条目_${presetTimestamp()}`);
			if (!copy.hasOwnProperty("injection_order")) copy.injection_order = 100;
			if (!Array.isArray(copy.injection_trigger)) copy.injection_trigger = [];
			copy.system_prompt = !!copy.system_prompt;
			copy.marker = !!copy.marker;
			delete copy.enabled;
			delete copy.isUninserted;
			return copy;
		};
		const buildCommandFromPresetEntry = (entry, targetCategory) => {
			const title = String(entry?.name || entry?.title || entry?.content?.slice(0, 10) || "预设条目").trim();
			const text = String(entry?.content || entry?.text || "").trim();
			return {
				id: PunctuationButtons.generateId(),
				category: targetCategory,
				title: title || text.slice(0, 10) || "预设条目",
				text,
				isFavorite: false,
				tags: Array.isArray(entry?.tags) ? [...entry.tags] : [],
				timestamp: Date.now()
			};
		};
		const insertEntriesToCommandRepository = async (sourceEntries) => {
			const targetCategory = normalizePresetTargetCategory();
			const entries = sourceEntries.map((entry) => buildCommandFromPresetEntry(entry, targetCategory)).filter((command) => command.text);
			if (!entries.length) return showModal({
				msg: "没有可写入指令仓库的内容。",
				isAlert: true
			});
			const commands = PunctuationButtons.loadCommands();
			entries.forEach((entry) => {
				if (!commands.some((command) => command.category === entry.category && command.title === entry.title && command.text === entry.text)) commands.push(entry);
			});
			PunctuationButtons.saveCommands(commands);
			presetState.targetSelection.clear();
			renderPresetPanel();
		};
		const getTargetInsertIndex = (targetData, position, refId) => {
			const orderBucket = ensureOrderBucket(targetData);
			if (position === "top") return 0;
			if (position === "bottom") return orderBucket.order.length;
			if (position === "after" && refId) {
				const idx = orderBucket.order.findIndex((item) => item.identifier === refId);
				return idx >= 0 ? idx + 1 : orderBucket.order.length;
			}
			return orderBucket.order.length;
		};
		const getDefaultTargetInsertRef = () => [...presetState.targetSelection][0] || null;
		const getDefaultTargetInsertArgs = () => {
			const refId = getDefaultTargetInsertRef();
			return {
				position: refId ? "after" : "bottom",
				refId
			};
		};
		const insertPromptsToTarget = async (sourceEntries, position = "bottom", refId = null) => {
			if (presetState.targetKind === "commands") return insertEntriesToCommandRepository(sourceEntries);
			const targetName = presetState.targetPreset;
			if (!targetName) return showModal({
				msg: "请先选择目标预设。",
				isAlert: true
			});
			const targetData = getPresetDataByName(targetName);
			if (!targetData) return showModal({
				msg: "无法获取目标预设数据。",
				isAlert: true
			});
			if (!Array.isArray(targetData.prompts)) targetData.prompts = [];
			const orderBucket = ensureOrderBucket(targetData);
			const newOrderEntries = [];
			sourceEntries.forEach((entry) => {
				if (!entry) return;
				if (entry.sourceType === "command") {
					const newPrompt = buildCommandSourcePrompt(entry);
					newPrompt.name = ensureUniqueTargetName(targetData, newPrompt.name);
					targetData.prompts.push(newPrompt);
					newOrderEntries.push({
						identifier: newPrompt.identifier,
						enabled: true
					});
				} else {
					const newPrompt = buildPresetCopyPrompt(entry, targetData);
					targetData.prompts.push(newPrompt);
					newOrderEntries.push({
						identifier: newPrompt.identifier,
						enabled: true
					});
				}
			});
			const insertIndex = getTargetInsertIndex(targetData, position, refId);
			orderBucket.order.splice(insertIndex, 0, ...newOrderEntries);
			await savePresetData(targetName, targetData);
			presetState.targetSelection.clear();
			renderPresetPanel();
		};
		const updateTargetPromptById = async (entryId, updatedEntry, shouldInsert = false, insertMode = "bottom") => {
			const targetName = presetState.targetPreset;
			if (!targetName) return showModal({
				msg: "请先选择目标预设。",
				isAlert: true
			});
			const targetData = getPresetDataByName(targetName);
			if (!targetData) return showModal({
				msg: "无法获取目标预设数据。",
				isAlert: true
			});
			if (!Array.isArray(targetData.prompts)) targetData.prompts = [];
			const index = targetData.prompts.findIndex((item) => item && item.identifier === entryId);
			if (index < 0) throw new Error("未找到目标条目");
			const current = targetData.prompts[index];
			const next = {
				...current,
				...updatedEntry,
				identifier: current.identifier,
				system_prompt: !!current.system_prompt,
				marker: !!current.marker
			};
			targetData.prompts[index] = next;
			const orderBucket = ensureOrderBucket(targetData);
			const existingOrderIndex = orderBucket.order.findIndex((item) => item.identifier === current.identifier);
			if (shouldInsert && existingOrderIndex < 0) {
				const insertIndex = getTargetInsertIndex(targetData, insertMode, null);
				orderBucket.order.splice(insertIndex, 0, {
					identifier: current.identifier,
					enabled: true
				});
			}
			await savePresetData(targetName, targetData);
			renderPresetPanel();
		};
		const insertExistingTargetEntry = async (entryId, position = "bottom", refId = null) => {
			const targetName = presetState.targetPreset;
			if (!targetName) return showModal({
				msg: "请先选择目标预设。",
				isAlert: true
			});
			const targetData = getPresetDataByName(targetName);
			if (!targetData) return showModal({
				msg: "无法获取目标预设数据。",
				isAlert: true
			});
			if (!(targetData.prompts || []).find((item) => item && item.identifier === entryId)) return showModal({
				msg: "未找到目标条目。",
				isAlert: true
			});
			const orderBucket = ensureOrderBucket(targetData);
			const existingIndex = orderBucket.order.findIndex((item) => item.identifier === entryId);
			if (existingIndex >= 0) orderBucket.order[existingIndex].enabled = true;
			else {
				const insertIndex = getTargetInsertIndex(targetData, position, refId);
				orderBucket.order.splice(insertIndex, 0, {
					identifier: entryId,
					enabled: true
				});
			}
			await savePresetData(targetName, targetData);
			renderPresetPanel();
		};
		const deleteSelectedTargetEntries = async () => {
			const targetName = presetState.targetPreset;
			if (!targetName) return showModal({
				msg: "请先选择目标预设。",
				isAlert: true
			});
			const targetData = getPresetDataByName(targetName);
			if (!targetData) return showModal({
				msg: "无法获取目标预设数据。",
				isAlert: true
			});
			const ids = new Set(presetState.targetSelection);
			if (!ids.size) return showModal({
				msg: "请先勾选要删除的条目。",
				isAlert: true
			});
			if (!window.confirm(`确定删除选中的 ${ids.size} 个目标条目吗？`)) return;
			targetData.prompts = (targetData.prompts || []).filter((item) => item && !ids.has(item.identifier));
			if (targetData.prompt_order) targetData.prompt_order.forEach((order) => {
				if (Array.isArray(order.order)) order.order = order.order.filter((item) => !ids.has(item.identifier));
			});
			await savePresetData(targetName, targetData);
			presetState.targetSelection.clear();
			renderPresetPanel();
		};
		const openEditDialog = (entryId, shouldInsert = false) => {
			const targetData = getPresetDataByName(presetState.targetPreset);
			if (!targetData) return showModal({
				msg: "请先选择目标预设。",
				isAlert: true
			});
			const prompt = (targetData.prompts || []).find((item) => item && item.identifier === entryId);
			if (!prompt) return showModal({
				msg: "未找到要编辑的条目。",
				isAlert: true
			});
			presetState.editEntry = cloneData(prompt);
			presetState.editIsNew = false;
			presetState.editShouldInsert = shouldInsert || !!prompt.isUninserted;
			$wrap.find("#preset-edit-name").val(prompt.name || "");
			$wrap.find("#preset-edit-role").val(prompt.role || "system");
			$wrap.find("#preset-edit-position").val(prompt.injection_position == 1 ? "chat" : "relative");
			$wrap.find("#preset-edit-depth").val(prompt.injection_depth ?? 4);
			$wrap.find("#preset-edit-order").val(prompt.injection_order ?? 100);
			$wrap.find("#preset-edit-triggers").val(Array.isArray(prompt.injection_trigger) ? prompt.injection_trigger.join(", ") : "");
			$wrap.find("#preset-edit-content").val(prompt.content || "");
			$wrap.find("#preset-edit-layer").addClass("open");
		};
		const openSourceDetailDialog = (entryId) => {
			const entry = getSourceEntries().find((item, index) => (item.identifier || item.commandId || `source-${index}`) === entryId);
			if (!entry) return;
			const meta = [];
			if (entry.sourceType === "command") meta.push("指令仓库");
			if (entry.role) meta.push(entry.role);
			if (entry.isUninserted) meta.push("未插入");
			else if (entry.sourceType !== "command") meta.push("已插入");
			if (entry.injection_order !== void 0) meta.push(`顺序 ${entry.injection_order}`);
			if (entry.injection_depth !== void 0) meta.push(`深度 ${entry.injection_depth}`);
			$wrap.find("#preset-detail-title").text(entry.name || "未命名");
			$wrap.find("#preset-detail-meta").html(meta.map((item) => `<span class="preset-tag">${PunctuationButtons.escapeHtml(item)}</span>`).join(""));
			$wrap.find("#preset-detail-content").text(entry.content || "");
			$wrap.find("#preset-detail-layer").addClass("open");
		};
		const insertSelectedSourceEntries = async () => {
			const ids = new Set(presetState.sourceSelection);
			const entries = getSourceEntries().filter((entry, index) => {
				const id = entry.identifier || entry.commandId || `source-${index}`;
				return ids.has(id);
			});
			if (!entries.length) return showModal({
				msg: "请先勾选源内容。",
				isAlert: true
			});
			const insertArgs = getDefaultTargetInsertArgs();
			await insertPromptsToTarget(entries, insertArgs.position, insertArgs.refId);
		};
		const loadPresetPanel = () => {
			fillPresetSelectors();
			renderPresetPanel();
		};
		const collectCommandsByCategory = () => {
			const grouped = {};
			Object.keys(DEFAULT_CMD_CATEGORIES).forEach((category) => {
				grouped[category] = [];
			});
			PunctuationButtons.loadCommands().forEach((command) => {
				const categoryName = normalizeCategoryName(command.category);
				if (!grouped[categoryName]) grouped[categoryName] = [];
				grouped[categoryName].push(command);
			});
			return grouped;
		};
		const managerSelection = /* @__PURE__ */ new Set();
		const setManagerLayerVisible = (visible) => {
			const $layer = $wrap.find("#cmd-manager-layer");
			if (visible) $layer.fadeIn(120);
			else $layer.fadeOut(120);
		};
		const renderCommandManager = () => {
			const grouped = collectCommandsByCategory();
			const blocks = Object.keys(DEFAULT_CMD_CATEGORIES).map((category) => {
				const items = grouped[category] || [];
				const itemRows = items.map((command) => {
					const checked = managerSelection.has(command.id);
					return `
                        <div class="cmd-manager-row">
                            <label class="cmd-manager-check">
                                <input type="checkbox" data-manager-command="${command.id}" ${checked ? "checked" : ""}>
                            </label>
                            <div class="cmd-manager-row-text">
                                <div class="cmd-manager-row-title">${PunctuationButtons.escapeHtml(command.title || command.text.substring(0, 10))}</div>
                                <div class="cmd-manager-row-body">${PunctuationButtons.escapeHtml(command.text)}</div>
                                ${command.tags && command.tags.length ? `<div class="cmd-tags-display">${command.tags.map((tag) => `<span class="cmd-tag-mini">${PunctuationButtons.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
                            </div>
                        </div>
                    `;
				}).join("");
				const allChecked = items.length > 0 && items.every((command) => managerSelection.has(command.id));
				return `
                    <div class="cmd-manager-group">
                        <div class="cmd-manager-group-head">
                            <label class="cmd-manager-check">
                                <input type="checkbox" data-manager-category-check="${PunctuationButtons.escapeHtml(category)}" ${allChecked ? "checked" : ""}>
                                <span>${PunctuationButtons.escapeHtml(category)}</span>
                            </label>
                            <span style="font-size:12px; color:#666;">${items.length} 条</span>
                        </div>
                        ${itemRows || `<div style="font-size:12px; color:#999; padding:6px 0;">暂无指令</div>`}
                    </div>
                `;
			}).join("");
			$wrap.find("#cmd-manager-list").html(blocks || `<div style="text-align:center; padding:24px; color:#999;">暂无指令</div>`);
			$wrap.find("[data-manager-category-check]").each(function() {
				const items = grouped[String(window.jQuery(this).attr("data-manager-category-check"))] || [];
				const allChecked = items.length > 0 && items.every((command) => managerSelection.has(command.id));
				const someChecked = items.some((command) => managerSelection.has(command.id));
				this.indeterminate = !allChecked && someChecked;
			});
		};
		const openCommandManager = () => {
			managerSelection.clear();
			renderCommandManager();
			setManagerLayerVisible(true);
		};
		const closeCommandManager = () => {
			managerSelection.clear();
			setManagerLayerVisible(false);
		};
		const renderSymbolAdd = () => {
			$wrap.find("#symbol-content").html(`
                <div class="punct-field"><label>类型</label><select data-add-type><option value="single">单独标点</option><option value="pair">成对标点</option></select></div>
                <div class="punct-field"><label>按钮名称</label><input data-add-name placeholder="显示在按钮上"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label data-left-label>要插入的符号</label><input data-add-left></div>
                    <div class="punct-field" data-right-wrap style="display:none;"><label>右侧符号</label><input data-add-right></div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" data-save-add>保存</button></div>
            `);
			$wrap.find("[data-add-type]").on("change", function() {
				const isPair = window.jQuery(this).val() === "pair";
				$wrap.find("[data-right-wrap]").toggle(isPair);
				$wrap.find("[data-left-label]").text(isPair ? "左侧符号" : "要插入的符号");
			});
			$wrap.find("[data-save-add]").on("click", () => {
				const type = $wrap.find("[data-add-type]").val(), name = String($wrap.find("[data-add-name]").val() || "").trim();
				const left = String($wrap.find("[data-add-left]").val() || ""), right = type === "pair" ? String($wrap.find("[data-add-right]").val() || "") : "";
				if (!name || !left || type === "pair" && !right) return showModal({
					msg: "请填完必填项。",
					isAlert: true
				});
				const custom = PunctuationButtons.loadCustomSymbols();
				custom.push({
					name,
					left,
					right
				});
				PunctuationButtons.saveCustomSymbols(custom);
				PunctuationButtons.forgetDeletedName(name);
				PunctuationButtons.register();
				renderSymbolEdit();
			});
		};
		const renderSymbolEditForm = (item, oldName) => {
			$wrap.find("#symbol-content").html(`
                <div class="punct-field"><label>按钮名称</label><input data-edit-name value="${PunctuationButtons.escapeHtml(item.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>左侧符号</label><input data-edit-left value="${PunctuationButtons.escapeHtml(item.left)}"></div>
                    <div class="punct-field"><label>右侧符号 (可留空)</label><input data-edit-right value="${PunctuationButtons.escapeHtml(item.right || "")}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-back-edit>返回</button>
                    <button class="punct-action" data-save-edit>保存</button>
                </div>
            `);
			$wrap.find("[data-back-edit]").on("click", renderSymbolEdit);
			$wrap.find("[data-save-edit]").on("click", () => {
				const name = String($wrap.find("[data-edit-name]").val() || "").trim(), left = String($wrap.find("[data-edit-left]").val() || ""), right = String($wrap.find("[data-edit-right]").val() || "");
				if (!name || !left) return showModal({
					msg: "必填项不能为空",
					isAlert: true
				});
				if (name !== oldName) {
					PunctuationButtons.rememberDeletedName(oldName);
					PunctuationButtons.hideButtonByName(oldName);
					PunctuationButtons.forgetDeletedName(name);
				}
				const custom = PunctuationButtons.loadCustomSymbols(), idx = custom.findIndex((i) => i.name === oldName);
				if (idx !== -1) {
					custom[idx] = {
						name,
						left,
						right
					};
					PunctuationButtons.saveCustomSymbols(custom);
					PunctuationButtons.register();
					renderSymbolEdit();
				}
			});
		};
		const renderSymbolEdit = () => {
			const all = PunctuationButtons.getVisibleSymbols(), defaultNames = new Set(PunctuationButtons.defaultSymbols.map((item) => item.name));
			const rows = all.length ? all.map((item) => {
				const isDefault = defaultNames.has(item.name);
				return `<div class="cmd-row symbol-edit-row" data-name="${PunctuationButtons.escapeHtml(item.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="拖动排序">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${PunctuationButtons.escapeHtml(item.name)}</div></div>
                    <button class="punct-action" data-edit-one ${isDefault ? "style=\"opacity:.45;\" title=\"默认按钮只能删\"" : ""}>修改</button>
                </div>`;
			}).join("") : `<div style="text-align:center; padding:20px; color:#999;">${UI_TEXT.empty.noEditableSymbols}</div>`;
			$wrap.find("#symbol-content").html(`<div class="cmd-list-wrap">${rows}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" data-delete-picked>${UI_TEXT.actions.deleteSelected}</button></div>`);
			const $list = $wrap.find(".cmd-list-wrap");
			let draggedRow = null;
			let pointerDragId = null;
			const saveCurrentOrder = () => {
				const orderedNames = $list.find(".cmd-row").map(function() {
					return window.jQuery(this).attr("data-name");
				}).get();
				PunctuationButtons.saveSymbolOrder(orderedNames);
				PunctuationButtons.register();
			};
			$list.on("dragstart", ".cmd-row", function(event) {
				draggedRow = this;
				window.jQuery(this).addClass("dragging");
				event.originalEvent.dataTransfer.effectAllowed = "move";
				event.originalEvent.dataTransfer.setData("text/plain", window.jQuery(this).attr("data-name"));
			});
			$list.on("dragover", ".cmd-row", function(event) {
				event.preventDefault();
				const $target = window.jQuery(this);
				if (!draggedRow || this === draggedRow) return;
				const targetRect = this.getBoundingClientRect();
				if (event.originalEvent.clientY > targetRect.top + targetRect.height / 2) $target.after(draggedRow);
				else $target.before(draggedRow);
			});
			$list.on("dragend", ".cmd-row", function() {
				window.jQuery(this).removeClass("dragging");
				if (draggedRow) saveCurrentOrder();
				draggedRow = null;
			});
			$list.on("pointerdown", ".drag-handle", function(event) {
				const row = window.jQuery(this).closest(".cmd-row")[0];
				if (!row) return;
				draggedRow = row;
				pointerDragId = event.originalEvent.pointerId;
				try {
					this.setPointerCapture?.(pointerDragId);
				} catch (_) {}
				window.jQuery(row).addClass("dragging reorder-active");
				window.jQuery(document).one("pointerup pointercancel", () => {
					if (!draggedRow) return;
					window.jQuery(draggedRow).removeClass("dragging reorder-active");
					saveCurrentOrder();
					draggedRow = null;
					pointerDragId = null;
				});
				event.preventDefault();
			});
			$list.on("pointermove", function(event) {
				if (!draggedRow) return;
				if (pointerDragId !== null && event.originalEvent.pointerId !== pointerDragId) return;
				const pointerEvent = event.originalEvent;
				const row = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest?.(".cmd-row");
				if (!row || row === draggedRow || !window.jQuery.contains($list[0], row)) return;
				const targetRect = row.getBoundingClientRect();
				if (pointerEvent.clientY > targetRect.top + targetRect.height / 2) window.jQuery(row).after(draggedRow);
				else window.jQuery(row).before(draggedRow);
				event.preventDefault();
			});
			$wrap.find("[data-edit-one]").on("click", function() {
				const name = window.jQuery(this).closest(".cmd-row").attr("data-name");
				if (defaultNames.has(name)) return showModal({
					msg: UI_TEXT.messages.defaultDeleteOnly,
					isAlert: true
				});
				const item = PunctuationButtons.loadCustomSymbols().find((i) => i.name === name);
				if (item) renderSymbolEditForm(item, name);
			});
			$wrap.find("[data-delete-picked]").on("click", () => {
				const picked = $wrap.find("[data-pick]:checked").map(function() {
					return window.jQuery(this).closest(".cmd-row").attr("data-name");
				}).get();
				if (!picked.length) return showModal({
					msg: UI_TEXT.messages.selectFirst,
					isAlert: true
				});
				showModal({
					msg: UI_TEXT.messages.deletePickedSymbols.replace("{count}", picked.length),
					onOk: () => {
						PunctuationButtons.deleteCustomByNames(picked);
						renderSymbolEdit();
					}
				});
			});
		};
		const renderMainView = () => {
			$wrap.find("[data-main-panel=\"commands\"]").toggle(state.activeMainView === "commands");
			$wrap.find("[data-main-panel=\"symbols\"]").toggle(state.activeMainView === "symbols");
			$wrap.find("[data-main-panel=\"presets\"]").toggle(state.activeMainView === "presets");
			$wrap.find(".monkey-main-tab").removeClass("active");
			$wrap.find(`.monkey-main-tab[data-main-view="${state.activeMainView}"]`).addClass("active");
			$wrap.toggleClass("preset-wide", state.activeMainView === "presets");
			if (state.activeMainView === "commands") renderUI();
			else if (state.activeMainView === "presets") loadPresetPanel();
			else $wrap.find("#symbol-tabs-container .punct-tab.active").data("symbol-view") === "edit" ? renderSymbolEdit() : renderSymbolAdd();
		};
		$wrap.find("#cmd-export-btn").on("click", () => {
			askExportFormat((includeFormat) => {
				exportCommands(PunctuationButtons.loadCommands(), includeFormat, true, "sillytavern_commands_backup");
			});
		});
		$wrap.find("#cmd-import-btn").on("click", () => {
			$wrap.find("#cmd-import-file").click();
		});
		$wrap.find("#cmd-import-file").on("change", function(e) {
			const file = e.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = function(event) {
				try {
					const data = JSON.parse(event.target.result);
					if (!data.commands && !data.categories && !data.symbols && !data.tags) throw new Error("Invalid Format");
					showModal({
						msg: UI_TEXT.messages.importConfirm,
						onOk: () => {
							let importedCmds = Array.isArray(data.commands) ? data.commands : [];
							let existingCmds = PunctuationButtons.loadCommands();
							let addedCmdsCount = 0;
							importedCmds.forEach((ic) => {
								const imported = {
									...ic,
									id: PunctuationButtons.generateId(),
									category: normalizeCategoryName(ic.category),
									tags: Array.isArray(ic.tags) ? ic.tags : [],
									timestamp: Number(ic.timestamp || Date.now()),
									isFavorite: typeof ic.isFavorite === "boolean" ? ic.isFavorite : !!ic.favorite
								};
								if (!existingCmds.find((ec) => ec.category === imported.category && ec.title === imported.title && ec.text === imported.text)) {
									existingCmds.push(imported);
									addedCmdsCount++;
								}
							});
							PunctuationButtons.saveCommands(existingCmds);
							if (data.categories) {
								let existingCats = PunctuationButtons.loadCategorySettings();
								Object.keys(data.categories).forEach((k) => existingCats[k] = data.categories[k]);
								PunctuationButtons.saveCategorySettings(existingCats);
							}
							let existingTags = PunctuationButtons.loadGlobalTags();
							const importedTags = Array.isArray(data.tags) ? data.tags : [];
							importedCmds.forEach((cmd) => {
								if (Array.isArray(cmd.tags)) importedTags.push(...cmd.tags);
							});
							importedTags.forEach((t) => {
								if (t && !existingTags.includes(t)) existingTags.push(t);
							});
							PunctuationButtons.saveGlobalTags(existingTags);
							if (Array.isArray(data.symbols)) {
								let existingSymbols = PunctuationButtons.loadCustomSymbols();
								data.symbols.forEach((is) => {
									if (!existingSymbols.find((es) => es.name === is.name) && is.name && typeof is.left === "string") existingSymbols.push(is);
								});
								PunctuationButtons.saveCustomSymbols(existingSymbols);
								PunctuationButtons.register();
							}
							renderUI();
							if (window.toastr) toastr.success(UI_TEXT.messages.importSuccess.replace("{count}", addedCmdsCount));
						}
					});
				} catch (err) {
					showModal({
						msg: UI_TEXT.messages.importFailed,
						isAlert: true
					});
				}
				$wrap.find("#cmd-import-file").val("");
			};
			reader.readAsText(file);
		});
		$wrap.find("#cmd-manager-btn").on("click", openCommandManager);
		$wrap.find("#cmd-manager-close").on("click", closeCommandManager);
		$wrap.find("#cmd-manager-layer").on("click", function(event) {
			if (event.target === this) closeCommandManager();
		});
		$wrap.on("change", "[data-manager-category-check]", function() {
			const category = String($(this).attr("data-manager-category-check"));
			const grouped = collectCommandsByCategory();
			const shouldSelect = $(this).is(":checked");
			(grouped[category] || []).forEach((command) => {
				if (shouldSelect) managerSelection.add(command.id);
				else managerSelection.delete(command.id);
			});
			renderCommandManager();
		});
		$wrap.on("change", "[data-manager-command]", function() {
			const id = String($(this).attr("data-manager-command"));
			if ($(this).is(":checked")) managerSelection.add(id);
			else managerSelection.delete(id);
			renderCommandManager();
		});
		$wrap.find("#cmd-manager-delete").on("click", () => {
			if (!managerSelection.size) return showModal({
				msg: UI_TEXT.messages.selectFirst,
				isAlert: true
			});
			showModal({
				msg: `确定删除选中的 ${managerSelection.size} 条指令吗？`,
				onOk: () => {
					const selectedIds = new Set(managerSelection);
					const remaining = PunctuationButtons.loadCommands().filter((command) => !selectedIds.has(command.id));
					PunctuationButtons.saveCommands(remaining);
					managerSelection.clear();
					renderCommandManager();
					renderUI();
				}
			});
		});
		$wrap.find("#cmd-manager-export").on("click", () => {
			if (!managerSelection.size) return showModal({
				msg: UI_TEXT.messages.selectFirst,
				isAlert: true
			});
			const selectedIds = new Set(managerSelection);
			const selectedCommands = PunctuationButtons.loadCommands().filter((command) => selectedIds.has(command.id));
			askExportFormat((includeFormat) => {
				exportCommands(selectedCommands, includeFormat, false, "sillytavern_commands_selected");
			});
		});
		let activeInput = null;
		$wrap.on("focus", "#cmd-input-title, #cmd-input-text, #cmd-cat-prefix, #cmd-cat-suffix, #preset-edit-content, #preset-edit-name", function() {
			activeInput = this;
		});
		$wrap.on("click", ".cmd-quick-btn", function(e) {
			e.preventDefault();
			const left = $(this).attr("data-left") || "";
			const right = $(this).attr("data-right") || "";
			const presetInput = $wrap.find("#preset-edit-content")[0];
			if ($(this).closest("#preset-edit-quick-row").length) activeInput = presetInput;
			if (!activeInput) activeInput = $wrap.find("#cmd-input-text")[0] || presetInput;
			if (!activeInput) return;
			activeInput.focus();
			const start = activeInput.selectionStart || 0;
			const end = activeInput.selectionEnd || 0;
			const val = activeInput.value || "";
			const selected = val.slice(start, end);
			const newVal = val.slice(0, start) + left + selected + right + val.slice(end);
			activeInput.value = newVal;
			$(activeInput).trigger("input");
			const newCursor = start + left.length + selected.length;
			activeInput.setSelectionRange(newCursor, newCursor);
		});
		const renderUI = () => {
			const allCmds = PunctuationButtons.loadCommands();
			const globalTags = PunctuationButtons.getCombinedTags();
			if (state.isTagManageMode) {
				$wrap.find(".cmd-toolbar, #cmd-filter-container, #cmd-editor-panel, #cmd-cat-panel").hide();
				$wrap.find("#cmd-manage-tags-btn").html(`<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`).addClass("back-mode").attr("title", "返回列表");
				const manageHeader = `
                    <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="manage-new-tag-input" class="cmd-search" placeholder="${UI_TEXT.fields.manageNewTag}" style="height:38px;">
                        <button class="punct-action" id="manage-add-tag-btn" style="height:38px; padding:0 16px;">${UI_TEXT.actions.addTag}</button>
                    </div>
                `;
				if (globalTags.length === 0) $wrap.find("#cmd-list-container").html(manageHeader + `<div style="text-align:center; padding:30px; color:#999;">${UI_TEXT.empty.noTags}</div>`);
				else {
					const tagRows = globalTags.map((tag) => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${PunctuationButtons.escapeHtml(tag)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px;">${UI_TEXT.actions.rename}</button>
                                <button class="punct-action tag-del-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px;">${UI_TEXT.actions.delete}</button>
                            </div>
                        </div>
                    `).join("");
					$wrap.find("#cmd-list-container").html(manageHeader + tagRows);
				}
				return;
			}
			$wrap.find(".cmd-toolbar, #cmd-filter-container").show();
			$wrap.find("#cmd-manage-tags-btn").html(UI_TEXT.actions.manageTags).removeClass("back-mode").removeAttr("title");
			if ($wrap.find("#cmd-toggle-cat-btn").hasClass("active")) {
				$wrap.find("#cmd-cat-panel").css("display", "block");
				$wrap.find("#current-cat-name").text(state.activeTab);
			} else $wrap.find("#cmd-cat-panel").css("display", "none");
			if (state.editingId || $wrap.find("#cmd-toggle-editor-btn").text().includes(UI_TEXT.actions.collapse.slice(-2))) $wrap.find("#cmd-editor-panel").css("display", "block");
			else $wrap.find("#cmd-editor-panel").css("display", "none");
			$wrap.find("#cmd-filter-container").html(globalTags.map((tag) => `<div class="cmd-tag ${state.filterTags.includes(tag) ? "active" : ""}" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join("") + (state.filterTags.length > 0 ? `<div class="cmd-tag active" id="cmd-clear-filter">✖ 清除筛选</div>` : ""));
			const editorAvailableTags = Array.from(new Set([...globalTags, ...state.editorTags])).sort();
			$wrap.find("#cmd-editor-tags").html(editorAvailableTags.map((tag) => `<div class="cmd-tag ${state.editorTags.includes(tag) ? "active" : ""} editor-tag-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join("") + `<div class="cmd-tag-add"><input type="text" id="cmd-new-tag-input" placeholder="+新标签"><button id="cmd-add-tag-btn" style="border:none;background:none;cursor:pointer;font-weight:bold;color:#666;">✔</button></div>`);
			let displayCmds = allCmds.filter((c) => c.category === state.activeTab);
			if (state.filterTags.length > 0) displayCmds = displayCmds.filter((c) => c.tags && state.filterTags.every((t) => c.tags.includes(t)));
			if (state.searchText) {
				const q = state.searchText.toLowerCase();
				displayCmds = displayCmds.filter((c) => c.title && c.title.toLowerCase().includes(q) || c.text.toLowerCase().includes(q) || c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));
			}
			displayCmds.sort((a, b) => {
				if (a.isFavorite === b.isFavorite) return b.timestamp - a.timestamp;
				return a.isFavorite ? -1 : 1;
			});
			if (displayCmds.length === 0) $wrap.find("#cmd-list-container").html(`<div style="text-align:center; padding:40px; color:#999;">${UI_TEXT.empty.noCommands}</div>`);
			else {
				const rows = displayCmds.map((cmd) => {
					const displayTitle = cmd.title || cmd.text.substring(0, 10);
					return `
                    <div class="cmd-row ${cmd.isFavorite ? "favorite" : ""}" data-id="${cmd.id}">
                        <div class="cmd-content copy-trigger">
                            <div class="cmd-title">${PunctuationButtons.escapeHtml(displayTitle)}</div>
                            <div class="cmd-text">${PunctuationButtons.escapeHtml(cmd.text)}</div>
                            ${cmd.tags && cmd.tags.length ? `<div class="cmd-tags-display">${cmd.tags.map((t) => `<span class="cmd-tag-mini">${PunctuationButtons.escapeHtml(t)}</span>`).join("")}</div>` : ""}
                        </div>
                        <div class="cmd-actions">
                            <div class="cmd-btn-icon ${cmd.isFavorite ? "cmd-btn-heart" : ""} fav-trigger" title="${cmd.isFavorite ? UI_TEXT.actions.unfavorite : UI_TEXT.actions.favorite}">${cmd.isFavorite ? "❤" : "♡"}</div>
                            <div class="cmd-btn-icon edit-trigger" title="${UI_TEXT.actions.edit}">✎</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="${UI_TEXT.actions.delete}">✖</div>
                        </div>
                    </div>
                `;
				});
				$wrap.find("#cmd-list-container").html(rows.join(""));
			}
		};
		const resetEditor = () => {
			state.editingId = null;
			state.editorTags = [];
			$wrap.find("#cmd-input-title").val("");
			$wrap.find("#cmd-input-text").val("");
			$wrap.find("#cmd-editor-panel").css("display", "none");
			$wrap.find("#cmd-toggle-editor-btn").text(UI_TEXT.actions.newCommand);
			$wrap.find("#cmd-save-btn").text(UI_TEXT.actions.saveCommand);
			renderUI();
		};
		$wrap.on("click", ".monkey-main-tab", function() {
			state.activeMainView = String($(this).data("main-view"));
			renderMainView();
		});
		$wrap.on("change", "#symbol-inline-toggle", function() {
			PunctuationButtons.saveInlineSymbolsEnabled($(this).is(":checked"));
			if ($(this).is(":checked")) PunctuationButtons.buildInlineSymbolBar();
			else document.getElementById("monkey-tools-inline-symbols")?.remove();
		});
		$wrap.on("click", "#symbol-tabs-container .punct-tab", function() {
			$wrap.find("#symbol-tabs-container .punct-tab").removeClass("active");
			$(this).addClass("active");
			$(this).data("symbol-view") === "add" ? renderSymbolAdd() : renderSymbolEdit();
		});
		$wrap.on("change", "#preset-source-kind", function() {
			presetState.sourceKind = String($(this).val() || "preset");
			presetState.sourceSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-target-kind", function() {
			presetState.targetKind = String($(this).val() || "preset");
			presetState.targetSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-source-preset", function() {
			presetState.sourcePreset = String($(this).val() || "");
			presetState.sourceSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-target-preset", function() {
			presetState.targetPreset = String($(this).val() || "");
			presetState.targetSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-command-category", function() {
			presetState.sourceCategory = String($(this).val() || Object.keys(DEFAULT_CMD_CATEGORIES)[0]);
			presetState.sourceSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-target-command-category", function() {
			presetState.targetCategory = String($(this).val() || Object.keys(DEFAULT_CMD_CATEGORIES)[0]);
			presetState.targetSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("click", "[data-preset-category]", function() {
			presetState.sourceCategory = String($(this).attr("data-preset-category") || Object.keys(DEFAULT_CMD_CATEGORIES)[0]);
			presetState.sourceSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("click", "[data-preset-target-category]", function() {
			presetState.targetCategory = String($(this).attr("data-preset-target-category") || Object.keys(DEFAULT_CMD_CATEGORIES)[0]);
			presetState.targetSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("change", "#preset-target-mode", function() {
			presetState.targetMode = String($(this).val() || "inserted");
			presetState.targetSelection.clear();
			renderPresetPanel();
		});
		$wrap.on("input", "#preset-source-search", function() {
			presetState.sourceSearch = String($(this).val() || "");
			renderPresetSourceList();
		});
		$wrap.on("input", "#preset-target-search", function() {
			presetState.targetSearch = String($(this).val() || "");
			renderPresetTargetList();
		});
		$wrap.on("click", "#preset-load-btn", renderPresetPanel);
		$wrap.on("click", "#preset-current-source", () => setPresetSelectionFromCurrent("source"));
		$wrap.on("click", "#preset-current-target", () => setPresetSelectionFromCurrent("target"));
		$wrap.on("click", "#preset-source-collapse", () => {
			presetState.sourceCollapsed = !presetState.sourceCollapsed;
			renderPresetPanel();
		});
		$wrap.on("click", "#preset-target-collapse", () => {
			presetState.targetCollapsed = !presetState.targetCollapsed;
			renderPresetPanel();
		});
		$wrap.on("change", "[data-source-check]", function() {
			const id = String($(this).attr("data-source-check"));
			if ($(this).is(":checked")) presetState.sourceSelection.add(id);
			else presetState.sourceSelection.delete(id);
			$wrap.find("#preset-source-count").text(`${getSourceEntries().length} 条 / 已选 ${presetState.sourceSelection.size}`);
		});
		$wrap.on("change", "[data-target-check]", function() {
			const id = String($(this).attr("data-target-check"));
			if ($(this).is(":checked")) presetState.targetSelection.add(id);
			else presetState.targetSelection.delete(id);
			$wrap.find("#preset-target-count").text(`${getTargetEntries().length} 条 / 已选 ${presetState.targetSelection.size}`);
		});
		$wrap.on("click", "#preset-source-all", () => {
			getSourceEntries().forEach((entry, index) => {
				presetState.sourceSelection.add(entry.identifier || entry.commandId || `source-${index}`);
			});
			renderPresetSourceList();
		});
		$wrap.on("click", "#preset-source-none", () => {
			presetState.sourceSelection.clear();
			renderPresetSourceList();
		});
		$wrap.on("click", "#preset-target-all", () => {
			getTargetEntries().forEach((entry, index) => {
				presetState.targetSelection.add(entry.identifier || `target-${index}`);
			});
			renderPresetTargetList();
		});
		$wrap.on("click", "[data-source-detail]", function(event) {
			if (window.jQuery(event.target).is("input, button, select, textarea, label")) return;
			openSourceDetailDialog(String(window.jQuery(this).attr("data-source-detail")));
		});
		$wrap.on("click", "#preset-insert-selected", async () => {
			try {
				await insertSelectedSourceEntries();
			} catch (error) {
				showModal({
					msg: `插入失败：${error.message}`,
					isAlert: true
				});
			}
		});
		$wrap.on("click", ".preset-target-edit", function() {
			openEditDialog(String($(this).attr("data-target-edit")));
		});
		$wrap.on("click", ".preset-target-insert", async function() {
			try {
				const id = String($(this).attr("data-target-insert"));
				const refId = [...presetState.targetSelection].find((selected) => selected !== id) || null;
				await insertExistingTargetEntry(id, refId ? "after" : "bottom", refId);
			} catch (error) {
				showModal({
					msg: `插入失败：${error.message}`,
					isAlert: true
				});
			}
		});
		$wrap.on("click", "#preset-delete-target", deleteSelectedTargetEntries);
		const closePresetEditor = () => {
			presetState.editEntry = null;
			$wrap.find("#preset-edit-layer").removeClass("open");
		};
		$wrap.on("click", "#preset-edit-close, #preset-edit-cancel", closePresetEditor);
		$wrap.on("click", "#preset-edit-layer", function(event) {
			if (event.target === this) closePresetEditor();
		});
		const closePresetDetail = () => $wrap.find("#preset-detail-layer").removeClass("open");
		$wrap.on("click", "#preset-detail-close", closePresetDetail);
		$wrap.on("click", "#preset-detail-layer", function(event) {
			if (event.target === this) closePresetDetail();
		});
		const collectPresetEditForm = () => {
			const position = String($wrap.find("#preset-edit-position").val() || "relative");
			const triggers = String($wrap.find("#preset-edit-triggers").val() || "").split(",").map((item) => item.trim()).filter(Boolean);
			return {
				name: String($wrap.find("#preset-edit-name").val() || "").trim() || `条目_${presetTimestamp()}`,
				role: String($wrap.find("#preset-edit-role").val() || "system"),
				content: String($wrap.find("#preset-edit-content").val() || ""),
				injection_position: position === "chat" ? 1 : null,
				injection_depth: position === "chat" ? parseInt($wrap.find("#preset-edit-depth").val(), 10) || 4 : 4,
				injection_order: parseInt($wrap.find("#preset-edit-order").val(), 10) || 100,
				injection_trigger: triggers
			};
		};
		$wrap.on("click", "#preset-edit-save", async () => {
			if (!presetState.editEntry?.identifier) return;
			try {
				await updateTargetPromptById(presetState.editEntry.identifier, collectPresetEditForm(), false);
				closePresetEditor();
			} catch (error) {
				showModal({
					msg: `保存失败：${error.message}`,
					isAlert: true
				});
			}
		});
		$wrap.on("click", "#preset-edit-save-insert", async () => {
			if (!presetState.editEntry?.identifier) return;
			try {
				await updateTargetPromptById(presetState.editEntry.identifier, collectPresetEditForm(), true, "bottom");
				closePresetEditor();
			} catch (error) {
				showModal({
					msg: `保存失败：${error.message}`,
					isAlert: true
				});
			}
		});
		$wrap.on("click", "#cmd-tabs-container .punct-tab", function() {
			$wrap.find("#cmd-tabs-container .punct-tab").removeClass("active");
			$(this).addClass("active");
			state.activeTab = $(this).data("cat");
			state.filterTags = [];
			state.searchText = "";
			$wrap.find("#cmd-search-input").val("");
			state.isTagManageMode = false;
			if ($wrap.find("#cmd-toggle-cat-btn").hasClass("active")) {
				const conf = PunctuationButtons.loadCategorySettings()[state.activeTab] || {
					prefix: "",
					suffix: ""
				};
				$wrap.find("#cmd-cat-prefix").val(conf.prefix);
				$wrap.find("#cmd-cat-suffix").val(conf.suffix);
			}
			if (state.editingId) {
				state.editingId = null;
				$wrap.find("#cmd-save-btn").text(UI_TEXT.actions.saveCommand);
			}
			renderUI();
		});
		$wrap.on("click", "#cmd-toggle-cat-btn", function() {
			if ($(this).hasClass("active")) {
				$(this).removeClass("active");
				renderUI();
			} else {
				resetEditor();
				$(this).addClass("active");
				const conf = PunctuationButtons.loadCategorySettings()[state.activeTab] || {
					prefix: "",
					suffix: ""
				};
				$wrap.find("#cmd-cat-prefix").val(conf.prefix);
				$wrap.find("#cmd-cat-suffix").val(conf.suffix);
				renderUI();
			}
		});
		$wrap.find("#cmd-cat-cancel-btn").on("click", () => {
			$wrap.find("#cmd-toggle-cat-btn").removeClass("active");
			renderUI();
		});
		$wrap.find("#cmd-cat-save-btn").on("click", () => {
			const prefix = $wrap.find("#cmd-cat-prefix").val();
			const suffix = $wrap.find("#cmd-cat-suffix").val();
			const cats = PunctuationButtons.loadCategorySettings();
			if (!cats[state.activeTab]) cats[state.activeTab] = {};
			cats[state.activeTab].prefix = prefix;
			cats[state.activeTab].suffix = suffix;
			PunctuationButtons.saveCategorySettings(cats);
			renderUI();
			if (window.toastr) toastr.success(UI_TEXT.messages.formatSaved);
		});
		$wrap.on("click", "#cmd-manage-tags-btn", () => {
			state.isTagManageMode = !state.isTagManageMode;
			if (state.isTagManageMode) {
				resetEditor();
				$wrap.find("#cmd-toggle-cat-btn").removeClass("active");
			}
			renderUI();
		});
		$wrap.on("click", "#manage-add-tag-btn", function() {
			const newTag = $wrap.find("#manage-new-tag-input").val().trim();
			if (!newTag) return;
			const gTags = PunctuationButtons.loadGlobalTags();
			if (!gTags.includes(newTag)) {
				gTags.push(newTag);
				PunctuationButtons.saveGlobalTags(gTags);
				renderUI();
				setTimeout(() => $wrap.find("#manage-new-tag-input").focus(), 10);
			} else showModal({
				msg: UI_TEXT.messages.tagExists,
				isAlert: true
			});
		});
		$wrap.on("click", ".tag-edit-btn", function() {
			const oldTag = String($(this).attr("data-tag"));
			showModal({
				msg: UI_TEXT.messages.renameTag.replace("{tag}", oldTag),
				prompt: true,
				defaultVal: oldTag,
				onOk: (newTag) => {
					if (newTag && newTag.trim() && newTag.trim() !== oldTag) {
						const finalTag = newTag.trim();
						let cmds = PunctuationButtons.loadCommands();
						cmds.forEach((cmd) => {
							if (cmd.tags && cmd.tags.includes(oldTag)) cmd.tags = cmd.tags.map((t) => t === oldTag ? finalTag : t);
						});
						PunctuationButtons.saveCommands(cmds);
						let gTags = PunctuationButtons.loadGlobalTags();
						if (gTags.includes(oldTag)) {
							gTags[gTags.indexOf(oldTag)] = finalTag;
							PunctuationButtons.saveGlobalTags(gTags);
						}
						if (state.filterTags.includes(oldTag)) state.filterTags = state.filterTags.map((t) => t === oldTag ? finalTag : t);
						renderUI();
					}
				}
			});
		});
		$wrap.on("click", ".tag-del-btn", function() {
			const tag = String($(this).attr("data-tag"));
			showModal({
				msg: UI_TEXT.messages.deleteTag.replace("{tag}", tag),
				onOk: () => {
					let cmds = PunctuationButtons.loadCommands();
					cmds.forEach((cmd) => {
						if (cmd.tags && cmd.tags.includes(tag)) cmd.tags = cmd.tags.filter((t) => t !== tag);
					});
					PunctuationButtons.saveCommands(cmds);
					let gTags = PunctuationButtons.loadGlobalTags();
					gTags = gTags.filter((t) => t !== tag);
					PunctuationButtons.saveGlobalTags(gTags);
					if (state.filterTags.includes(tag)) state.filterTags = state.filterTags.filter((t) => t !== tag);
					renderUI();
				}
			});
		});
		$wrap.on("click", ".editor-tag-btn", function() {
			const tag = String($(this).attr("data-tag"));
			if (state.editorTags.includes(tag)) state.editorTags = state.editorTags.filter((t) => t !== tag);
			else state.editorTags.push(tag);
			renderUI();
		});
		$wrap.on("click", "#cmd-add-tag-btn", function(e) {
			e.preventDefault();
			const newTag = $wrap.find("#cmd-new-tag-input").val().trim();
			if (newTag && !state.editorTags.includes(newTag)) {
				state.editorTags.push(newTag);
				const gTags = PunctuationButtons.loadGlobalTags();
				if (!gTags.includes(newTag)) {
					gTags.push(newTag);
					PunctuationButtons.saveGlobalTags(gTags);
				}
			}
			renderUI();
			setTimeout(() => $wrap.find("#cmd-new-tag-input").focus(), 10);
		});
		$wrap.find("#cmd-search-input").on("input", function() {
			state.searchText = $(this).val().trim();
			renderUI();
		});
		$wrap.on("click", ".cmd-filter-bar .cmd-tag", function() {
			if ($(this).attr("id") === "cmd-clear-filter") state.filterTags = [];
			else {
				const tag = String($(this).attr("data-tag"));
				if (state.filterTags.includes(tag)) state.filterTags = state.filterTags.filter((t) => t !== tag);
				else state.filterTags.push(tag);
			}
			renderUI();
		});
		$wrap.on("click", "#cmd-toggle-editor-btn", function() {
			const panel = $wrap.find("#cmd-editor-panel");
			if (panel.css("display") !== "none") resetEditor();
			else {
				resetEditor();
				$wrap.find("#cmd-toggle-cat-btn").removeClass("active");
				panel.css("display", "block");
				$(this).text(UI_TEXT.actions.collapse);
				renderUI();
			}
		});
		$wrap.find("#cmd-cancel-btn").on("click", resetEditor);
		$wrap.find("#cmd-save-btn").on("click", () => {
			const text = $wrap.find("#cmd-input-text").val().trim();
			if (!text) return showModal({
				msg: UI_TEXT.messages.commandEmpty,
				isAlert: true
			});
			const title = $wrap.find("#cmd-input-title").val().trim() || text.substring(0, 10);
			let cmds = PunctuationButtons.loadCommands();
			if (state.editingId) {
				const idx = cmds.findIndex((c) => c.id === state.editingId);
				if (idx !== -1) {
					cmds[idx].title = title;
					cmds[idx].text = text;
					cmds[idx].tags = [...state.editorTags];
				}
			} else cmds.push({
				id: PunctuationButtons.generateId(),
				category: state.activeTab,
				title,
				text,
				isFavorite: false,
				tags: [...state.editorTags],
				timestamp: Date.now()
			});
			PunctuationButtons.saveCommands(cmds);
			resetEditor();
		});
		$wrap.on("click", ".copy-trigger", function() {
			const id = $(this).closest(".cmd-row").data("id");
			const cmd = PunctuationButtons.loadCommands().find((c) => c.id === id);
			if (cmd) {
				const conf = PunctuationButtons.loadCategorySettings()[cmd.category] || {
					prefix: "",
					suffix: ""
				};
				PunctuationButtons.copyToClipboard((conf.prefix || "") + cmd.text + (conf.suffix || ""));
			}
		});
		$wrap.on("click", ".fav-trigger", function(e) {
			e.stopPropagation();
			const id = $(this).closest(".cmd-row").data("id");
			let cmds = PunctuationButtons.loadCommands();
			const idx = cmds.findIndex((c) => c.id === id);
			if (idx !== -1) {
				cmds[idx].isFavorite = !cmds[idx].isFavorite;
				PunctuationButtons.saveCommands(cmds);
				renderUI();
			}
		});
		$wrap.on("click", ".edit-trigger", function(e) {
			e.stopPropagation();
			const id = $(this).closest(".cmd-row").data("id");
			const cmd = PunctuationButtons.loadCommands().find((c) => c.id === id);
			if (cmd) {
				state.editingId = cmd.id;
				state.editorTags = [...cmd.tags || []];
				$wrap.find("#cmd-input-title").val(cmd.title || "");
				$wrap.find("#cmd-input-text").val(cmd.text);
				$wrap.find("#cmd-toggle-cat-btn").removeClass("active");
				$wrap.find("#cmd-editor-panel").css("display", "block");
				$wrap.find("#cmd-toggle-editor-btn").text(UI_TEXT.actions.collapse);
				$wrap.find("#cmd-save-btn").text(UI_TEXT.actions.saveEdit);
				renderUI();
			}
		});
		$wrap.on("click", ".del-trigger", function(e) {
			e.stopPropagation();
			const id = $(this).closest(".cmd-row").data("id");
			const cmd = PunctuationButtons.loadCommands().find((c) => c.id === id);
			if (!cmd) return;
			showModal({
				msg: UI_TEXT.messages.deleteCommand.replace("{category}", cmd.category),
				onOk: () => {
					let cmds = PunctuationButtons.loadCommands().filter((c) => c.id !== id);
					PunctuationButtons.saveCommands(cmds);
					renderUI();
				}
			});
		});
		renderMainView();
		PunctuationButtons.openPopup($wrap, {
			okButton: "关闭",
			forceCustom: true
		});
	},
	openSettings: () => {
		PunctuationButtons.openCommandPanel("symbols");
	},
	bindButton: (name, handler) => {
		if (PunctuationButtons.boundNames[name]) return;
		window.eventOn(window.getButtonEvent(name), handler);
		PunctuationButtons.boundNames[name] = true;
	},
	register: () => {
		PunctuationButtons.buildFloatingLauncher();
		PunctuationButtons.buildInlineSymbolBar();
	}
};
setTimeout(PunctuationButtons.register, 1e3);
setTimeout(PunctuationButtons.register, 3e3);
window.addEventListener("resize", () => {
	const launcher = document.getElementById("monkey-tools-floating");
	if (launcher) {
		const rect = launcher.getBoundingClientRect();
		const button = launcher.querySelector(".monkey-tools-floating-main");
		const width = button?.getBoundingClientRect().width || 64;
		const height = button?.getBoundingClientRect().height || 64;
		launcher.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.left))}px`;
		launcher.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.top))}px`;
	}
	PunctuationButtons.positionInlineSymbolBar();
});
window.addEventListener("scroll", () => PunctuationButtons.positionInlineSymbolBar(), true);
window.addEventListener("monkey-tools:settings-changed", PunctuationButtons.register);
//#endregion
