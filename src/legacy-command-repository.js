// ==========================================
// 🛠️ 用户自定义配置区（默认大类名称）
// ==========================================
const CMD_CATEGORIES = {
    "肘击指令": { prefix: "", suffix: "" },
    "剧情指令": { prefix: "", suffix: "" },
    "小剧场指令": { prefix: "", suffix: "" },
    "其他指令": { prefix: "", suffix: "" }
};

// ==========================================
// 🚀 系统核心逻辑区
// ==========================================
const PUNCT_LOG_PREFIX = '[PunctuationButtons]';
const PUNCT_STORAGE_KEY = 'punctuation_custom_buttons_v1';
const PUNCT_DELETED_KEY = 'punctuation_deleted_buttons_v1';
const CMD_STORAGE_KEY = 'punctuation_quick_commands_v3'; 
const CMD_CAT_STORAGE_KEY = 'punctuation_cmd_cats_v3'; 
const CMD_TAGS_STORAGE_KEY = 'punctuation_cmd_tags_v3'; 
const EXTENSION_SETTINGS_KEY = 'monkey-tools';

// 修改页签、按钮、标题、提示文字时优先改这里。
const UI_TEXT = {
    launcher: {
        symbolSettings: '新增符号',
        commandRepository: '指令仓库',
    },
    mainTabs: {
        commands: '指令仓库',
        symbols: '符号编辑',
    },
    titles: {
        commandRepository: '常用指令库',
        symbolSettings: '符号按钮设置',
    },
    actions: {
        import: '📥 导入',
        export: '📤 导出',
        format: '⚙️ 格式',
        newCommand: '➕ 新建',
        collapse: '▲ 收起',
        manageTags: '管理标签',
        saveFormat: '保存格式',
        saveCommand: '保存指令',
        saveEdit: '保存修改',
        cancel: '取消',
        save: '保存',
        back: '返回',
        edit: '修改',
        delete: '删除',
        deleteSelected: '删除选中',
        rename: '重命名',
        addTag: '新增标签',
        clearFilter: '✖ 清除筛选',
        favorite: '设为常用',
        unfavorite: '取消常用',
    },
    symbols: {
        inlineToggle: '快捷符号',
        addTab: '新增',
        editTab: '编辑',
        type: '类型',
        single: '单独标点',
        pair: '成对标点',
        buttonName: '按钮名称',
        buttonNamePlaceholder: '显示在按钮上',
        insertSymbol: '要插入的符号',
        leftSymbol: '左侧符号',
        rightSymbol: '右侧符号',
        rightSymbolOptional: '右侧符号 (可留空)',
        dragSort: '拖动排序',
    },
    fields: {
        search: '搜索指令标题、内容或标签...',
        categoryFormat: '当前分类【{category}】的前后缀设置',
        commandTitle: '指令标题 (选填，默认截取内容前10字)',
        commandText: '输入指令内容... (必填)',
        tags: '选择或新建标签 (可多选)',
        newTag: '+新标签',
        manageNewTag: '输入新标签名称...',
        prefix: '前缀内容',
        suffix: '后缀内容',
        prefixPlaceholder: '如: [动作：',
        suffixPlaceholder: '如: ]',
    },
    modal: {
        ok: '确定',
        gotIt: '我知道了',
        confirmAction: '确定操作',
        confirmDelete: '确定删除',
    },
    empty: {
        noEditableSymbols: '暂无可编辑按钮',
        noTags: '当前没有任何标签',
        noCommands: '没有找到指令',
    },
    messages: {
        fillRequired: '请填完必填项。',
        requiredCannotBeEmpty: '必填项不能为空',
        defaultDeleteOnly: '默认自带标点仅支持删除',
        selectFirst: '请先勾选',
        deletePickedSymbols: '确定要删除选中的 {count} 个标点按钮吗？',
        exportSuccess: '数据导出成功！',
        importConfirm: '即将导入备份数据！\n为防止误删，导入的数据将与现有数据进行【合并】。\n是否继续？',
        importSuccess: '导入成功！共新增 {count} 条指令。',
        importFailed: '读取失败：文件格式不正确或已损坏！',
        formatSaved: '格式保存成功',
        tagExists: '标签已存在',
        renameTag: '将标签 [{tag}] 重命名为:',
        deleteTag: '确定要全局删除标签 [{tag}] 吗？\n包含此标签的指令不会被删除，只是失去该标签。',
        commandEmpty: '指令内容不能为空！',
        deleteCommand: '你确定删除 [{category}] 下面的 1 条指令吗？',
    },
    tooltips: {
        import: '合并导入JSON文件',
        export: '导出所有数据备份',
        format: '设置当前分类的前后缀',
        backToList: '返回列表',
        defaultDeleteOnly: '默认按钮只能删',
    },
};

const PUNCT_CMD_BUTTON = UI_TEXT.launcher.commandRepository; 

const DEFAULT_CMD_CATEGORIES = CMD_CATEGORIES;

const PunctuationButtons = {
    debugLogged: false,
    boundNames: {},
    migratedLocalStorage: false,
    symbolBarObserver: null,
    symbolBarRetryTimer: null,
    symbolBarTextarea: null,
    symbolBarHideTimer: null,
    symbolBarShowTimer: null,

    defaultSymbols: [
        { name: '**', left: '*', right: '*' },
        { name: '""', left: '"', right: '"' },
        { name: '()', left: '(', right: ')' },
        { name: '，', left: '，', right: '' },
        { name: '。', left: '。', right: '' },
        { name: '？', left: '？', right: '' },
        { name: '！', left: '！', right: '' },
        { name: '/', left: '/', right: '' }
    ],

    getSettingsRoot: () => {
        const context = window.SillyTavern?.getContext?.() || {};
        const extensionSettings = context.extensionSettings || window.extension_settings || {};
        window.extension_settings = extensionSettings;
        if (!extensionSettings[EXTENSION_SETTINGS_KEY] || typeof extensionSettings[EXTENSION_SETTINGS_KEY] !== 'object') {
            extensionSettings[EXTENSION_SETTINGS_KEY] = {};
        }
        return extensionSettings[EXTENSION_SETTINGS_KEY];
    },
    saveExtensionSettings: () => {
        const context = window.SillyTavern?.getContext?.() || {};
        if (typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        if (typeof context.saveSettingsDebounced === 'function') context.saveSettingsDebounced();
        if (typeof context.saveSettings === 'function') context.saveSettings();
        window.dispatchEvent(new CustomEvent('monkey-tools:settings-changed'));
    },
    migrateLocalStorageOnce: () => {
        if (PunctuationButtons.migratedLocalStorage) return;
        PunctuationButtons.migratedLocalStorage = true;
        const settings = PunctuationButtons.getSettingsRoot();

        try {
            if (!settings.categorySettings || typeof settings.categorySettings !== 'object') {
                if (Array.isArray(settings.categories)) {
                    settings.categorySettings = settings.categories.reduce((result, category) => {
                        if (category && category.name) result[category.name] = { prefix: category.prefix || '', suffix: category.suffix || '' };
                        return result;
                    }, {});
                }
            }
            if (!Array.isArray(settings.deletedSymbolNames) && Array.isArray(settings.hiddenSymbolNames)) {
                settings.deletedSymbolNames = settings.hiddenSymbolNames.map(String);
            }
            if (Array.isArray(settings.commands)) {
                settings.commands = settings.commands.map((cmd) => ({
                    ...cmd,
                    isFavorite: typeof cmd.isFavorite === 'boolean' ? cmd.isFavorite : !!cmd.favorite,
                    timestamp: Number(cmd.timestamp || cmd.updatedAt || cmd.createdAt || Date.now()),
                }));
            }
            if (!Array.isArray(settings.customSymbols)) {
                const raw = localStorage.getItem(PUNCT_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                if (Array.isArray(parsed)) settings.customSymbols = parsed.filter((item) => item && item.name && typeof item.left === 'string');
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
            if (!settings.categorySettings || typeof settings.categorySettings !== 'object') {
                const raw = localStorage.getItem(CMD_CAT_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : null;
                if (parsed && typeof parsed === 'object') settings.categorySettings = parsed;
            }
            PunctuationButtons.saveExtensionSettings();
        } catch (error) {}
    },

    loadCustomSymbols: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const parsed = PunctuationButtons.getSettingsRoot().customSymbols || [];
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((item) => item && item.name && typeof item.left === 'string');
        } catch (error) { return []; }
    },
    saveCustomSymbols: (items) => { PunctuationButtons.getSettingsRoot().customSymbols = items; PunctuationButtons.saveExtensionSettings(); },
    loadDeletedNames: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const parsed = PunctuationButtons.getSettingsRoot().deletedSymbolNames || [];
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (error) { return []; }
    },
    saveDeletedNames: (items) => { PunctuationButtons.getSettingsRoot().deletedSymbolNames = [...new Set(items)]; PunctuationButtons.saveExtensionSettings(); },
    rememberDeletedName: (name) => {
        const deleted = PunctuationButtons.loadDeletedNames();
        if (!deleted.includes(name)) { deleted.push(name); PunctuationButtons.saveDeletedNames(deleted); }
    },
    forgetDeletedName: (name) => PunctuationButtons.saveDeletedNames(PunctuationButtons.loadDeletedNames().filter((item) => item !== name)),
    loadSymbolOrder: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const parsed = PunctuationButtons.getSettingsRoot().symbolOrder || [];
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (error) { return []; }
    },
    saveSymbolOrder: (items) => { PunctuationButtons.getSettingsRoot().symbolOrder = [...new Set(items.map(String))]; PunctuationButtons.saveExtensionSettings(); },
    applySymbolOrder: (items) => {
        const order = PunctuationButtons.loadSymbolOrder();
        if (!order.length) return items;
        const indexByName = new Map(order.map((name, index) => [name, index]));
        return [...items].sort((a, b) => {
            const ai = indexByName.has(a.name) ? indexByName.get(a.name) : Number.MAX_SAFE_INTEGER;
            const bi = indexByName.has(b.name) ? indexByName.get(b.name) : Number.MAX_SAFE_INTEGER;
            return ai - bi;
        });
    },
    getAllSymbols: () => PunctuationButtons.applySymbolOrder(PunctuationButtons.defaultSymbols.concat(PunctuationButtons.loadCustomSymbols())),
    getVisibleSymbols: () => {
        const deleted = new Set(PunctuationButtons.loadDeletedNames());
        return PunctuationButtons.getAllSymbols().filter((item) => !deleted.has(item.name));
    },
    getInlineSymbolsEnabled: () => {
        const value = PunctuationButtons.getSettingsRoot().showInlineSymbols;
        return typeof value === 'boolean' ? value : true;
    },
    saveInlineSymbolsEnabled: (enabled) => {
        PunctuationButtons.getSettingsRoot().showInlineSymbols = !!enabled;
        PunctuationButtons.saveExtensionSettings();
    },

    generateId: () => 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    loadCommands: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const parsed = PunctuationButtons.getSettingsRoot().commands || [];
            return Array.isArray(parsed) ? parsed.map((cmd) => ({
                ...cmd,
                isFavorite: typeof cmd.isFavorite === 'boolean' ? cmd.isFavorite : !!cmd.favorite,
                timestamp: Number(cmd.timestamp || cmd.updatedAt || cmd.createdAt || Date.now()),
            })) : [];
        } catch (error) { return []; }
    },
    saveCommands: (cmds) => { PunctuationButtons.getSettingsRoot().commands = cmds; PunctuationButtons.saveExtensionSettings(); },
    
    loadGlobalTags: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const tags = PunctuationButtons.getSettingsRoot().globalTags || [];
            return Array.isArray(tags) ? tags : [];
        }
        catch (e) { return []; }
    },
    saveGlobalTags: (tags) => { PunctuationButtons.getSettingsRoot().globalTags = [...new Set(tags)]; PunctuationButtons.saveExtensionSettings(); },
    
    getCombinedTags: () => {
        const cmds = PunctuationButtons.loadCommands();
        const tags = new Set(PunctuationButtons.loadGlobalTags());
        cmds.forEach(cmd => cmd.tags && cmd.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    },

    loadCategorySettings: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        try {
            const categories = PunctuationButtons.getSettingsRoot().categorySettings;
            return categories && typeof categories === 'object'
                ? { ...DEFAULT_CMD_CATEGORIES, ...categories }
                : { ...DEFAULT_CMD_CATEGORIES };
        } catch (e) { return DEFAULT_CMD_CATEGORIES; }
    },
    saveCategorySettings: (data) => {
        const settings = PunctuationButtons.getSettingsRoot();
        settings.categorySettings = { ...data };
        settings.categories = Object.entries(settings.categorySettings).map(([name, value]) => ({
            name,
            prefix: value?.prefix || '',
            suffix: value?.suffix || '',
        }));
        PunctuationButtons.saveExtensionSettings();
    },

    // ===============================================
    // 🔥 【核心修复】重新排查并修复的复制逻辑
    // ===============================================
    copyToClipboard: async (text, showToast = true) => {
        const value = String(text ?? '');
        const notifySuccess = () => {
            if (showToast && window.toastr) window.toastr.success('指令已复制');
        };
        const notifyManual = () => window.prompt('复制失败，请手动复制：', value);
        const importModule = new Function('path', 'return import(path)');
        const candidates = [
            '../../../../utils.js',
            '../../../utils.js',
            '../../../scripts/utils.js',
        ];

        for (const path of candidates) {
            try {
                const utils = await importModule(path);
                if (typeof utils.copyText !== 'function') continue;
                await utils.copyText(value);
                notifySuccess();
                return;
            } catch (error) {
                // Continue looking for SillyTavern's native copy helper.
            }
        }

        notifyManual();
    },
    // ===============================================

    hideButtonByName: (name) => {
        PunctuationButtons.getDocuments().forEach((doc) => {
            doc.querySelectorAll('.menu_button.interactable, .menu_button, button').forEach((button) => {
                const texts = [button.textContent, button.innerText, button.getAttribute('title'), button.getAttribute('aria-label'), button.value].map(t => typeof t === 'string' ? t.trim() : '').filter(Boolean);
                if (texts.includes(name)) button.remove();
            });
        });
    },
    hideDeletedButtons: () => {
        const symbolNames = new Set(PunctuationButtons.getAllSymbols().map((item) => item.name));
        PunctuationButtons.loadDeletedNames()
            .filter((name) => symbolNames.has(name))
            .forEach((name) => PunctuationButtons.hideButtonByName(name));
    },
    
    removeNamesFromObject: (value, names) => {
        if (Array.isArray(value)) {
            let changed = false; const next = [];
            value.forEach((item) => {
                if (item && typeof item === 'object') {
                    const label = String(item.name ?? item.label ?? item.text ?? item.title ?? '');
                    if (names.includes(label)) { changed = true; return; }
                    const result = PunctuationButtons.removeNamesFromObject(item, names);
                    if (result.changed) { changed = true; next.push(result.value); return; }
                } else if (typeof item === 'string' && names.includes(item)) { changed = true; return; }
                next.push(item);
            });
            return { value: next, changed };
        }
        if (value && typeof value === 'object') {
            let changed = false; const next = { ...value };
            Object.keys(next).forEach((key) => {
                if (names.includes(key)) { delete next[key]; changed = true; return; }
                const child = next[key];
                if (child && typeof child === 'object') {
                    const result = PunctuationButtons.removeNamesFromObject(child, names);
                    if (result.changed) { next[key] = result.value; changed = true; }
                }
            });
            return { value: next, changed };
        }
        return { value, changed: false };
    },
    cleanupHelperButtonStorage: (names) => {
        const targets = names.filter(Boolean);
        if (!targets.length) return;
        [localStorage, sessionStorage].forEach((store) => {
            for (let index = 0; index < store.length; index++) {
                const key = store.key(index); const raw = store.getItem(key);
                if (!raw || !targets.some((name) => raw.includes(name))) continue;
                if (!/script|button|quick|helper|tavern|setting|config/i.test(key + raw.slice(0, 200))) continue;
                try {
                    const parsed = JSON.parse(raw); const result = PunctuationButtons.removeNamesFromObject(parsed, targets);
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
        targets.forEach((name) => { PunctuationButtons.rememberDeletedName(name); PunctuationButtons.hideButtonByName(name); });
        PunctuationButtons.cleanupHelperButtonStorage(targets);
        if (typeof window !== 'undefined' && window.extension_settings) {
            let settingsChanged = false;
            ['quickReplies', 'scriptButtons', 'customButtons', 'slashCommands'].forEach(key => {
                if (Array.isArray(window.extension_settings[key])) {
                    const originalLen = window.extension_settings[key].length;
                    window.extension_settings[key] = window.extension_settings[key].filter(btn => {
                        const btnName = String(btn.name ?? btn.label ?? btn.text ?? btn.title ?? '');
                        return !targetSet.has(btnName);
                    });
                    if (window.extension_settings[key].length < originalLen) settingsChanged = true;
                }
            });
            if (settingsChanged && typeof window.saveSettingsDebounced === 'function') window.saveSettingsDebounced();
        }
        PunctuationButtons.register();
    },

    getDocuments: () => {
        const docs = []; const addDoc = (doc) => { if (doc && !docs.includes(doc)) docs.push(doc); };
        addDoc(document);
        try { addDoc(window.parent?.document); } catch (error) {}
        try { addDoc(window.top?.document); } catch (error) {}
        return docs;
    },
    isEditable: (element) => {
        if (!element) return false;
        const tag = element.tagName ? element.tagName.toLowerCase() : '';
        return tag === 'textarea' || tag === 'input' || element.isContentEditable;
    },
    resolveEditable: (element) => {
        if (!element) return null;
        if (PunctuationButtons.isEditable(element)) return element;
        return element.querySelector?.('textarea, input, [contenteditable="true"]') || null;
    },
    getSendTextarea: () => {
        for (const doc of PunctuationButtons.getDocuments()) {
            const editable = PunctuationButtons.resolveEditable(doc.querySelector('#send_textarea'));
            if (editable) return editable;
        }
        return null;
    },
    notifyInput: (element) => {
        if (window.jQuery) window.jQuery(element).trigger('input').trigger('change');
        element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    getElementValue: (element) => element.isContentEditable ? element.textContent || '' : element.value || '',
    setElementValue: (element, value) => {
        if (element.isContentEditable) { element.textContent = value; return; }
        const proto = element.tagName.toLowerCase() === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor && descriptor.set) descriptor.set.call(element, value); else element.value = value;
    },
    setCursor: (element, index) => {
        element.focus();
        if (typeof element.setSelectionRange === 'function') { element.setSelectionRange(index, index); return true; }
        return false;
    },
    retryCursor: (index) => {
        [0, 30, 80, 160].forEach((delay) => {
            setTimeout(() => {
                const textarea = PunctuationButtons.getSendTextarea();
                if (!textarea) return;
                PunctuationButtons.setCursor(textarea, index); PunctuationButtons.notifyInput(textarea);
            }, delay);
        });
    },
    insertByTextarea: (item) => {
        const textarea = PunctuationButtons.getSendTextarea();
        if (!textarea) return false;
        textarea.focus();
        const value = PunctuationButtons.getElementValue(textarea);
        const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : value.length;
        const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : value.length;
        const selected = value.slice(start, end);
        const left = item.left, right = item.right || '';
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
    escapeHtml: (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    openPopup: (content, options = {}) => {
        const context = window.SillyTavern?.getContext?.() || {};
        const popupFunc = window.SillyTavern?.callGenericPopup || window.callGenericPopup || context.callGenericPopup;
        const popupOwner = window.SillyTavern?.callGenericPopup ? window.SillyTavern : (window.callGenericPopup ? window : context);
        if (!popupFunc || !window.jQuery) {
            window.toastr?.error('无法打开弹窗：当前环境缺少原生弹窗 API 或 jQuery。');
            return;
        }
        const popupOptions = { ...options };
        delete popupOptions.forceCustom;
        popupFunc.call(popupOwner, content, 1, '', popupOptions);
        return;

        document.querySelector('.monkey-tools-popup-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'monkey-tools-popup-overlay';

        const overlayPadding = 18;
        overlay.style.cssText = `position:fixed;inset:0;z-index:40000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.34);padding:${overlayPadding}px;box-sizing:border-box;overflow:hidden;`;

        const dialog = document.createElement('div');
        dialog.className = 'monkey-tools-popup-dialog';
        dialog.style.cssText = 'position:relative;width:min(720px,96vw);max-height:calc(100dvh - 36px);overflow:visible;border-radius:12px;background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.28);';
        dialog.addEventListener('click', (event) => event.stopPropagation());

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.title = options.okButton || '关闭';
        closeButton.setAttribute('aria-label', options.okButton || '关闭');
        closeButton.style.cssText = 'position:absolute;right:0;top:0;transform:translate(45%,-45%);z-index:2;width:32px;height:32px;border:1px solid #d0d7de;border-radius:50%;background:#fff;color:#24292f;padding:0;cursor:pointer;font-size:20px;line-height:28px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.18);';
        closeButton.addEventListener('click', () => overlay.remove());

        overlay.addEventListener('click', () => overlay.remove());
        dialog.append(closeButton, element);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    },
    ensureFloatingCss: () => {
        if (document.getElementById('monkey-tools-floating-style')) return;
        const style = document.createElement('style');
        style.id = 'monkey-tools-floating-style';
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
        document.getElementById('monkey-tools-floating')?.remove();

        const launcher = document.createElement('div');
        launcher.id = 'monkey-tools-floating';
        launcher.className = 'monkey-tools-floating';
        const savedPosition = PunctuationButtons.getSettingsRoot().floatingPosition;
        if (savedPosition && Number.isFinite(savedPosition.left) && Number.isFinite(savedPosition.top)) {
            launcher.style.left = `${Math.max(8, Math.min(window.innerWidth - 72, savedPosition.left))}px`;
            launcher.style.top = `${Math.max(8, Math.min(window.innerHeight - 72, savedPosition.top))}px`;
        }

        const mainButton = document.createElement('button');
        mainButton.type = 'button';
        mainButton.className = 'monkey-tools-floating-main';
        mainButton.textContent = '🐵';

        let dragState = null;
        const dragThreshold = 12;
        const syncMenuSide = () => {
            const rect = launcher.getBoundingClientRect();
            launcher.classList.toggle('menu-right', rect.left < window.innerWidth / 2);
        };
        const startDrag = (event) => {
            if (event.button !== 0) return;
            const rect = launcher.getBoundingClientRect();
            dragState = {
                startX: event.clientX,
                startY: event.clientY,
                left: rect.left,
                top: rect.top,
                dragging: false,
            };
            launcher.style.right = 'auto';
            launcher.style.bottom = 'auto';
            try { mainButton.setPointerCapture?.(event.pointerId); } catch (_) {}
            window.addEventListener('pointermove', onDrag);
            window.addEventListener('pointerup', endDrag, { once: true });
            window.addEventListener('pointercancel', cancelDrag, { once: true });
            event.preventDefault();
        };
        const onDrag = (event) => {
            if (!dragState) return;
            const deltaX = event.clientX - dragState.startX;
            const deltaY = event.clientY - dragState.startY;
            if (!dragState.dragging && Math.hypot(deltaX, deltaY) < dragThreshold) return;
            dragState.dragging = true;
            launcher.classList.remove('open');
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
                launcher.classList.remove('open');
                PunctuationButtons.openCommandPanel();
            } else {
                const rect = launcher.getBoundingClientRect();
                PunctuationButtons.getSettingsRoot().floatingPosition = { left: rect.left, top: rect.top };
                PunctuationButtons.saveExtensionSettings();
            }
            dragState = null;
            window.removeEventListener('pointermove', onDrag);
            window.removeEventListener('pointercancel', cancelDrag);
        };
        const cancelDrag = () => {
            dragState = null;
            window.removeEventListener('pointermove', onDrag);
        };
        mainButton.addEventListener('pointerdown', startDrag);

        launcher.append(mainButton);
        document.body.appendChild(launcher);
    },
    buildInlineSymbolBar: () => {
        PunctuationButtons.stopInlineSymbolBarTracking();
        document.getElementById('monkey-tools-inline-symbols')?.remove();
        if (!PunctuationButtons.getInlineSymbolsEnabled()) {
            return;
        }
        const textarea = PunctuationButtons.getSendTextarea();
        if (!textarea) {
            PunctuationButtons.scheduleInlineSymbolBarRetry();
            return;
        }
        PunctuationButtons.symbolBarTextarea = textarea;

        const bar = document.createElement('div');
        bar.id = 'monkey-tools-inline-symbols';

        PunctuationButtons.getVisibleSymbols().forEach((symbol) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = symbol.name;
            button.title = `插入 ${symbol.name}`;
            button.dataset.symbolName = symbol.name;
            button.style.cssText = 'border:1px solid rgba(0,0,0,0.12);border-radius:999px;background:rgba(255,255,255,0.9);color:#2f343a;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:600;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);';
            bar.appendChild(button);
        });

        bar.addEventListener('pointerdown', (event) => {
            const button = event.target.closest('button[data-symbol-name]');
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            PunctuationButtons.insertByName(button.dataset.symbolName);
        }, true);

        document.body.appendChild(bar);
        PunctuationButtons.positionInlineSymbolBar();
        PunctuationButtons.hideInlineSymbolBar();
        PunctuationButtons.bindInlineSymbolBarActivation(textarea, bar);
        if (document.activeElement === textarea || bar.contains(document.activeElement)) {
            PunctuationButtons.showInlineSymbolBar();
        }
        PunctuationButtons.watchInlineSymbolBarHost();
    },
    showInlineSymbolBar: () => {
        if (!PunctuationButtons.getInlineSymbolsEnabled()) return;
        const bar = document.getElementById('monkey-tools-inline-symbols');
        if (!bar) return;
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
        const bar = document.getElementById('monkey-tools-inline-symbols');
        if (!bar) return;
        bar.style.display = 'none';
    },
    scheduleInlineSymbolBarHide: () => {
        if (PunctuationButtons.symbolBarHideTimer) clearTimeout(PunctuationButtons.symbolBarHideTimer);
        PunctuationButtons.symbolBarHideTimer = window.setTimeout(() => {
            PunctuationButtons.symbolBarHideTimer = null;
            const bar = document.getElementById('monkey-tools-inline-symbols');
            const textarea = PunctuationButtons.symbolBarTextarea;
            const active = document.activeElement;
            if (bar?.contains(active) || active === textarea) return;
            PunctuationButtons.hideInlineSymbolBar();
        }, 120);
    },
    bindInlineSymbolBarActivation: (textarea, bar) => {
        if (textarea.dataset.monkeyToolsInlineBound === '1') return;
        textarea.dataset.monkeyToolsInlineBound = '1';
        textarea.addEventListener('focus', PunctuationButtons.scheduleInlineSymbolBarShow);
        textarea.addEventListener('focusin', PunctuationButtons.scheduleInlineSymbolBarShow);
        textarea.addEventListener('blur', PunctuationButtons.scheduleInlineSymbolBarHide);
        bar.addEventListener('pointerdown', () => {
            if (PunctuationButtons.symbolBarHideTimer) {
                clearTimeout(PunctuationButtons.symbolBarHideTimer);
                PunctuationButtons.symbolBarHideTimer = null;
            }
        }, true);
    },
    positionInlineSymbolBar: (show = false) => {
        const bar = document.getElementById('monkey-tools-inline-symbols');
        const textarea = PunctuationButtons.getSendTextarea();
        if (!bar || !textarea) return;

        const rect = textarea.getBoundingClientRect();
        const width = Math.max(220, Math.min(rect.width, window.innerWidth - 24));
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const display = show || bar.style.display === 'flex' ? 'flex' : 'none';
        const visibility = show ? 'hidden' : (bar.style.visibility || 'visible');
        bar.style.cssText = `position:fixed;left:${left}px;top:8px;width:${width}px;z-index:2147482500;display:${display};visibility:${visibility};flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
        const top = Math.max(8, rect.top - bar.offsetHeight - 8);
        bar.style.top = `${top}px`;
        if (show) bar.style.visibility = 'visible';
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
        if (typeof MutationObserver === 'undefined') return;
        if (PunctuationButtons.symbolBarObserver) {
            PunctuationButtons.symbolBarObserver.disconnect();
        }
        PunctuationButtons.symbolBarObserver = new MutationObserver(() => {
            const textarea = PunctuationButtons.getSendTextarea();
            if (!textarea) {
                document.getElementById('monkey-tools-inline-symbols')?.remove();
                PunctuationButtons.scheduleInlineSymbolBarRetry();
                return;
            }
            if (textarea !== PunctuationButtons.symbolBarTextarea) {
                PunctuationButtons.buildInlineSymbolBar();
                return;
            }
            PunctuationButtons.positionInlineSymbolBar();
        });
        PunctuationButtons.symbolBarObserver.observe(document.body, { childList: true, subtree: true });
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
            .punct-tab { flex:1; border:1.5px solid transparent; background:transparent; color:#555; border-radius:12px; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:none; }
            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            
            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:14px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:none; }
            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }
            .punct-action:active { transform:translateY(0); box-shadow:none; }
            .punct-action.active { background:#e7e7e7; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }
            
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
            .cmd-tag.active { background:#000; color:#fff; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }
            
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
        </style>
    `,

    modalHtml: `
        <div class="cmd-modal-overlay" id="custom-modal-layer">
            <div class="cmd-confirm-box">
                <div class="cmd-confirm-text" id="custom-modal-msg"></div>
                <input type="text" id="custom-modal-input" style="display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:14px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;">
                <div class="cmd-confirm-actions">
                    <button class="punct-action" id="custom-modal-cancel" style="background:#fff; color:#000;">${UI_TEXT.actions.cancel}</button>
                    <button class="punct-action" id="custom-modal-ok" style="background:#000; color:#fff;">${UI_TEXT.modal.ok}</button>
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
                    <button class="punct-action" id="cmd-manager-delete" style="color:#000;">删除选中</button>
                    <button class="punct-action" id="cmd-manager-export" style="background:#000; color:#fff;">导出选中</button>
                </div>
            </div>
        </div>
    `,

    openCommandPanel: (initialView = 'commands') => {
        if (!window.jQuery) {
            window.toastr?.error('当前环境缺少 jQuery，无法打开指令面板。');
            return;
        }
        const $ = window.jQuery;

        let state = {
            activeMainView: initialView === 'symbols' ? 'symbols' : 'commands',
            activeTab: Object.keys(DEFAULT_CMD_CATEGORIES)[0],
            searchText: '',
            filterTags: [], 
            editingId: null,
            editorTags: [],
            isTagManageMode: false
        };

        const customSymbols = PunctuationButtons.getVisibleSymbols();
        const quickInsertData = [
            { name: '{{char}}', left: '{{char}}', right: '' },
            { name: '{{user}}', left: '{{user}}', right: '' },
            ...customSymbols
        ];
        const quickInsertsHtml = quickInsertData.map(item =>
            `<span class="cmd-quick-btn" data-left="${PunctuationButtons.escapeHtml(item.left)}" data-right="${PunctuationButtons.escapeHtml(item.right || '')}">${PunctuationButtons.escapeHtml(item.name)}</span>`
        ).join('');

        const $wrap = $(`
            <div class="punct-settings">
                ${PunctuationButtons.baseCss()}
                <div class="punct-tabs monkey-main-tabs">
                    <button class="punct-tab monkey-main-tab ${state.activeMainView === 'commands' ? 'active' : ''}" data-main-view="commands">${UI_TEXT.mainTabs.commands}</button>
                    <button class="punct-tab monkey-main-tab ${state.activeMainView === 'symbols' ? 'active' : ''}" data-main-view="symbols">${UI_TEXT.mainTabs.symbols}</button>
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
                    ${Object.keys(DEFAULT_CMD_CATEGORIES).map(cat => `<button class="punct-tab ${state.activeTab === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('')}
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
                        <label>${UI_TEXT.fields.categoryFormat.replace('{category}', '<span id="current-cat-name" style="color:#000; font-size:14px; font-weight:800;"></span>')}</label>
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
                        <button class="punct-action" id="cmd-cat-cancel-btn" style="background:#fff; color:#000;">${UI_TEXT.actions.cancel}</button>
                        <button class="punct-action" id="cmd-cat-save-btn" style="background:#000; color:#fff;">${UI_TEXT.actions.saveFormat}</button>
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
                        <button class="punct-action" id="cmd-cancel-btn" style="background:#fff; color:#000;">${UI_TEXT.actions.cancel}</button>
                        <button class="punct-action" id="cmd-save-btn" style="background:#000; color:#fff;">${UI_TEXT.actions.saveCommand}</button>
                    </div>
                </div>

                <div class="cmd-list-wrap" id="cmd-list-container"></div>
                </div>
                <div data-main-panel="symbols" style="display:none;">
                    <div class="punct-head" style="justify-content:flex-end;">
                        <label class="punct-action" style="gap:8px; cursor:pointer;">
                            <input type="checkbox" id="symbol-inline-toggle" style="width:16px; height:16px; min-width:16px; min-height:16px; flex:0 0 16px; margin:0; accent-color:#000;" ${PunctuationButtons.getInlineSymbolsEnabled() ? 'checked' : ''}>
                            <span>${UI_TEXT.symbols.inlineToggle}</span>
                        </label>
                    </div>
                    <div class="punct-tabs" id="symbol-tabs-container">
                        <button class="punct-tab active" data-symbol-view="add">${UI_TEXT.symbols.addTab}</button>
                        <button class="punct-tab" data-symbol-view="edit">${UI_TEXT.symbols.editTab}</button>
                    </div>
                    <div class="punct-panel" id="symbol-content"></div>
                </div>
                ${PunctuationButtons.modalHtml}
            </div>
        `);

        let modalCallback = null;
        let modalCancelCallback = null;
        let isPromptMode = false;
        
        const showModal = (options) => {
            $wrap.find('#custom-modal-msg').text(options.msg);
            modalCallback = options.onOk;
            modalCancelCallback = options.onCancel || null;
            isPromptMode = !!options.prompt;
            const $input = $wrap.find('#custom-modal-input');
            
            if (isPromptMode) {
                $input.val(options.defaultVal || '').show();
                $wrap.find('#custom-modal-ok').css('background', '#222').text(UI_TEXT.modal.ok);
            } else {
                $input.hide();
                if (options.isAlert) {
                    $wrap.find('#custom-modal-ok').css('background', '#222').text(UI_TEXT.modal.gotIt);
                } else {
                    $wrap.find('#custom-modal-ok').css('background', '#000').text(options.okText || UI_TEXT.modal.confirmAction);
                }
            }
            
            $wrap.find('#custom-modal-cancel').text(options.cancelText || UI_TEXT.actions.cancel);
            if (options.isAlert) $wrap.find('#custom-modal-cancel').hide();
            else $wrap.find('#custom-modal-cancel').show();

            $wrap.find('#custom-modal-layer').fadeIn(150);
            if (isPromptMode) setTimeout(() => $input.focus(), 160);
        };

        $wrap.find('#custom-modal-cancel').on('click', () => {
            if (modalCancelCallback) modalCancelCallback();
            modalCallback = null;
            modalCancelCallback = null;
            $wrap.find('#custom-modal-layer').fadeOut(150);
        });

        $wrap.find('#custom-modal-ok').on('click', () => {
            const val = isPromptMode ? $wrap.find('#custom-modal-input').val() : true;
            if (modalCallback) modalCallback(val);
            modalCallback = null;
            modalCancelCallback = null;
            $wrap.find('#custom-modal-layer').fadeOut(150);
        });

        const downloadJson = (data, filenamePrefix) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.json`;
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
                tags: Array.from(new Set(exportedCommands.flatMap((command) => command.tags || []))),
            };
            if (includeFormat) {
                const currentCategories = PunctuationButtons.loadCategorySettings();
                payload.categories = includeSymbols ? { ...currentCategories } : {};
                if (!includeSymbols) {
                    exportedCommands.forEach((command) => {
                        const categoryName = command.category || Object.keys(DEFAULT_CMD_CATEGORIES)[0];
                        if (!payload.categories[categoryName]) {
                            payload.categories[categoryName] = currentCategories[categoryName] || { prefix: '', suffix: '' };
                        }
                    });
                }
            }
            if (includeSymbols) {
                payload.tags = Array.from(new Set([...PunctuationButtons.loadGlobalTags(), ...payload.tags]));
                payload.symbols = PunctuationButtons.loadCustomSymbols();
            }
            return payload;
        };

        const askExportFormat = (onChoice) => {
            showModal({
                msg: '是否连同格式导出？',
                okText: '带格式',
                cancelText: '不带格式',
                onOk: () => onChoice(true),
                onCancel: () => onChoice(false),
            });
        };

        const exportCommands = (commands, includeFormat, includeSymbols = false, filenamePrefix = 'sillytavern_commands_backup') => {
            downloadJson(buildCommandExportData(commands, includeFormat, includeSymbols), filenamePrefix);
            if (window.toastr) toastr.success(UI_TEXT.messages.exportSuccess);
        };

        const normalizeCategoryName = (categoryName) => {
            const categories = Object.keys(DEFAULT_CMD_CATEGORIES);
            return categories.includes(categoryName) ? categoryName : categories[0];
        };

        const collectCommandsByCategory = () => {
            const grouped = {};
            Object.keys(DEFAULT_CMD_CATEGORIES).forEach((category) => { grouped[category] = []; });
            PunctuationButtons.loadCommands().forEach((command) => {
                const categoryName = normalizeCategoryName(command.category);
                if (!grouped[categoryName]) grouped[categoryName] = [];
                grouped[categoryName].push(command);
            });
            return grouped;
        };

        const managerSelection = new Set();

        const setManagerLayerVisible = (visible) => {
            const $layer = $wrap.find('#cmd-manager-layer');
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
                                <input type="checkbox" data-manager-command="${command.id}" ${checked ? 'checked' : ''}>
                            </label>
                            <div class="cmd-manager-row-text">
                                <div class="cmd-manager-row-title">${PunctuationButtons.escapeHtml(command.title || command.text.substring(0, 10))}</div>
                                <div class="cmd-manager-row-body">${PunctuationButtons.escapeHtml(command.text)}</div>
                                ${command.tags && command.tags.length ? `<div class="cmd-tags-display">${command.tags.map((tag) => `<span class="cmd-tag-mini">${PunctuationButtons.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
                const allChecked = items.length > 0 && items.every((command) => managerSelection.has(command.id));
                return `
                    <div class="cmd-manager-group">
                        <div class="cmd-manager-group-head">
                            <label class="cmd-manager-check">
                                <input type="checkbox" data-manager-category-check="${PunctuationButtons.escapeHtml(category)}" ${allChecked ? 'checked' : ''}>
                                <span>${PunctuationButtons.escapeHtml(category)}</span>
                            </label>
                            <span style="font-size:12px; color:#666;">${items.length} 条</span>
                        </div>
                        ${itemRows || `<div style="font-size:12px; color:#999; padding:6px 0;">暂无指令</div>`}
                    </div>
                `;
            }).join('');
            $wrap.find('#cmd-manager-list').html(blocks || `<div style="text-align:center; padding:24px; color:#999;">暂无指令</div>`);

            $wrap.find('[data-manager-category-check]').each(function () {
                const category = String(window.jQuery(this).attr('data-manager-category-check'));
                const items = grouped[category] || [];
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
            $wrap.find('#symbol-content').html(`
                <div class="punct-field"><label>类型</label><select data-add-type><option value="single">单独标点</option><option value="pair">成对标点</option></select></div>
                <div class="punct-field"><label>按钮名称</label><input data-add-name placeholder="显示在按钮上"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label data-left-label>要插入的符号</label><input data-add-left></div>
                    <div class="punct-field" data-right-wrap style="display:none;"><label>右侧符号</label><input data-add-right></div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" data-save-add style="background:#000; color:#fff;">保存</button></div>
            `);
            $wrap.find('[data-add-type]').on('change', function () {
                const isPair = window.jQuery(this).val() === 'pair';
                $wrap.find('[data-right-wrap]').toggle(isPair);
                $wrap.find('[data-left-label]').text(isPair ? '左侧符号' : '要插入的符号');
            });
            $wrap.find('[data-save-add]').on('click', () => {
                const type = $wrap.find('[data-add-type]').val(), name = String($wrap.find('[data-add-name]').val() || '').trim();
                const left = String($wrap.find('[data-add-left]').val() || ''), right = type === 'pair' ? String($wrap.find('[data-add-right]').val() || '') : '';
                if (!name || !left || (type === 'pair' && !right)) return showModal({msg: '请填完必填项。', isAlert:true});
                const custom = PunctuationButtons.loadCustomSymbols(); custom.push({ name, left, right });
                PunctuationButtons.saveCustomSymbols(custom); PunctuationButtons.forgetDeletedName(name);
                PunctuationButtons.register(); renderSymbolEdit();
            });
        };
        const renderSymbolEditForm = (item, oldName) => {
            $wrap.find('#symbol-content').html(`
                <div class="punct-field"><label>按钮名称</label><input data-edit-name value="${PunctuationButtons.escapeHtml(item.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>左侧符号</label><input data-edit-left value="${PunctuationButtons.escapeHtml(item.left)}"></div>
                    <div class="punct-field"><label>右侧符号 (可留空)</label><input data-edit-right value="${PunctuationButtons.escapeHtml(item.right || '')}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-back-edit style="background:#fff; color:#000;">返回</button>
                    <button class="punct-action" data-save-edit style="background:#000; color:#fff;">保存</button>
                </div>
            `);
            $wrap.find('[data-back-edit]').on('click', renderSymbolEdit);
            $wrap.find('[data-save-edit]').on('click', () => {
                const name = String($wrap.find('[data-edit-name]').val() || '').trim(), left = String($wrap.find('[data-edit-left]').val() || ''), right = String($wrap.find('[data-edit-right]').val() || '');
                if (!name || !left) return showModal({msg:'必填项不能为空', isAlert:true});
                if (name !== oldName) { PunctuationButtons.rememberDeletedName(oldName); PunctuationButtons.hideButtonByName(oldName); PunctuationButtons.forgetDeletedName(name); }
                const custom = PunctuationButtons.loadCustomSymbols(), idx = custom.findIndex(i => i.name === oldName);
                if(idx !== -1) { custom[idx] = { name, left, right }; PunctuationButtons.saveCustomSymbols(custom); PunctuationButtons.register(); renderSymbolEdit(); }
            });
        };
        const renderSymbolEdit = () => {
            const all = PunctuationButtons.getVisibleSymbols(), defaultNames = new Set(PunctuationButtons.defaultSymbols.map(item => item.name));
            const rows = all.length ? all.map((item) => {
                const isDefault = defaultNames.has(item.name);
                return `<div class="cmd-row symbol-edit-row" data-name="${PunctuationButtons.escapeHtml(item.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="拖动排序">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${PunctuationButtons.escapeHtml(item.name)}</div></div>
                    <button class="punct-action" data-edit-one ${isDefault ? 'style="opacity:.45;" title="默认按钮只能删"' : ''}>修改</button>
                </div>`;
            }).join('') : `<div style="text-align:center; padding:20px; color:#999;">${UI_TEXT.empty.noEditableSymbols}</div>`;
            $wrap.find('#symbol-content').html(`<div class="cmd-list-wrap">${rows}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-delete-picked>${UI_TEXT.actions.deleteSelected}</button></div>`);
            const $list = $wrap.find('.cmd-list-wrap');
            let draggedRow = null;
            let pointerDragId = null;
            const saveCurrentOrder = () => {
                const orderedNames = $list.find('.cmd-row').map(function () { return window.jQuery(this).attr('data-name'); }).get();
                PunctuationButtons.saveSymbolOrder(orderedNames);
                PunctuationButtons.register();
            };
            $list.on('dragstart', '.cmd-row', function (event) {
                draggedRow = this;
                window.jQuery(this).addClass('dragging');
                event.originalEvent.dataTransfer.effectAllowed = 'move';
                event.originalEvent.dataTransfer.setData('text/plain', window.jQuery(this).attr('data-name'));
            });
            $list.on('dragover', '.cmd-row', function (event) {
                event.preventDefault();
                const $target = window.jQuery(this);
                if (!draggedRow || this === draggedRow) return;
                const targetRect = this.getBoundingClientRect();
                const insertAfter = event.originalEvent.clientY > targetRect.top + targetRect.height / 2;
                if (insertAfter) $target.after(draggedRow);
                else $target.before(draggedRow);
            });
            $list.on('dragend', '.cmd-row', function () {
                window.jQuery(this).removeClass('dragging');
                if (draggedRow) saveCurrentOrder();
                draggedRow = null;
            });
            $list.on('pointerdown', '.drag-handle', function (event) {
                const row = window.jQuery(this).closest('.cmd-row')[0];
                if (!row) return;
                draggedRow = row;
                pointerDragId = event.originalEvent.pointerId;
                try { this.setPointerCapture?.(pointerDragId); } catch (_) {}
                window.jQuery(row).addClass('dragging reorder-active');
                window.jQuery(document).one('pointerup pointercancel', () => {
                    if (!draggedRow) return;
                    window.jQuery(draggedRow).removeClass('dragging reorder-active');
                    saveCurrentOrder();
                    draggedRow = null;
                    pointerDragId = null;
                });
                event.preventDefault();
            });
            $list.on('pointermove', function (event) {
                if (!draggedRow) return;
                if (pointerDragId !== null && event.originalEvent.pointerId !== pointerDragId) return;
                const pointerEvent = event.originalEvent;
                const elementAtPoint = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY);
                const row = elementAtPoint?.closest?.('.cmd-row');
                if (!row || row === draggedRow || !window.jQuery.contains($list[0], row)) return;
                const targetRect = row.getBoundingClientRect();
                const insertAfter = pointerEvent.clientY > targetRect.top + targetRect.height / 2;
                if (insertAfter) window.jQuery(row).after(draggedRow);
                else window.jQuery(row).before(draggedRow);
                event.preventDefault();
            });
             
            $wrap.find('[data-edit-one]').on('click', function () {
                const name = window.jQuery(this).closest('.cmd-row').attr('data-name');
                if (defaultNames.has(name)) return showModal({msg: UI_TEXT.messages.defaultDeleteOnly, isAlert:true});
                const item = PunctuationButtons.loadCustomSymbols().find(i => i.name === name);
                if(item) renderSymbolEditForm(item, name);
            });
            
            $wrap.find('[data-delete-picked]').on('click', () => {
                const picked = $wrap.find('[data-pick]:checked').map(function () { return window.jQuery(this).closest('.cmd-row').attr('data-name'); }).get();
                if (!picked.length) return showModal({msg:UI_TEXT.messages.selectFirst, isAlert:true});
                showModal({
                    msg: UI_TEXT.messages.deletePickedSymbols.replace('{count}', picked.length),
                    onOk: () => { PunctuationButtons.deleteCustomByNames(picked); renderSymbolEdit(); }
                });
            });
        };
        const renderMainView = () => {
            $wrap.find('[data-main-panel="commands"]').toggle(state.activeMainView === 'commands');
            $wrap.find('[data-main-panel="symbols"]').toggle(state.activeMainView === 'symbols');
            $wrap.find('.monkey-main-tab').removeClass('active');
            $wrap.find(`.monkey-main-tab[data-main-view="${state.activeMainView}"]`).addClass('active');
            if (state.activeMainView === 'commands') {
                renderUI();
            } else {
                const symbolView = $wrap.find('#symbol-tabs-container .punct-tab.active').data('symbol-view');
                symbolView === 'edit' ? renderSymbolEdit() : renderSymbolAdd();
            }
        };

        $wrap.find('#cmd-export-btn').on('click', () => {
            askExportFormat((includeFormat) => {
                exportCommands(PunctuationButtons.loadCommands(), includeFormat, true, 'sillytavern_commands_backup');
            });
        });

        $wrap.find('#cmd-import-btn').on('click', () => {
            $wrap.find('#cmd-import-file').click();
        });

        $wrap.find('#cmd-import-file').on('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!data.commands && !data.categories && !data.symbols && !data.tags) {
                        throw new Error("Invalid Format");
                    }
                    
                    showModal({
                        msg: UI_TEXT.messages.importConfirm,
                        onOk: () => {
                            let importedCmds = Array.isArray(data.commands) ? data.commands : [];
                            let existingCmds = PunctuationButtons.loadCommands();
                            let addedCmdsCount = 0;
                            importedCmds.forEach(ic => {
                                const imported = {
                                    ...ic,
                                    id: PunctuationButtons.generateId(),
                                    category: normalizeCategoryName(ic.category),
                                    tags: Array.isArray(ic.tags) ? ic.tags : [],
                                    timestamp: Number(ic.timestamp || Date.now()),
                                    isFavorite: typeof ic.isFavorite === 'boolean' ? ic.isFavorite : !!ic.favorite,
                                };
                                const exists = existingCmds.find(ec => ec.category === imported.category && ec.title === imported.title && ec.text === imported.text);
                                if (!exists) {
                                    existingCmds.push(imported);
                                    addedCmdsCount++;
                                }
                            });
                            PunctuationButtons.saveCommands(existingCmds);

                            if (data.categories) {
                                let existingCats = PunctuationButtons.loadCategorySettings();
                                Object.keys(data.categories).forEach(k => existingCats[k] = data.categories[k]);
                                PunctuationButtons.saveCategorySettings(existingCats);
                            }

                            let existingTags = PunctuationButtons.loadGlobalTags();
                            const importedTags = Array.isArray(data.tags) ? data.tags : [];
                            importedCmds.forEach(cmd => {
                                if (Array.isArray(cmd.tags)) importedTags.push(...cmd.tags);
                            });
                            importedTags.forEach(t => { if (t && !existingTags.includes(t)) existingTags.push(t); });
                            PunctuationButtons.saveGlobalTags(existingTags);

                            if (Array.isArray(data.symbols)) {
                                let existingSymbols = PunctuationButtons.loadCustomSymbols();
                                data.symbols.forEach(is => {
                                    const exists = existingSymbols.find(es => es.name === is.name);
                                    if (!exists && is.name && typeof is.left === 'string') {
                                        existingSymbols.push(is);
                                    }
                                });
                                PunctuationButtons.saveCustomSymbols(existingSymbols);
                                PunctuationButtons.register();
                            }

                            renderUI();
                            if (window.toastr) toastr.success(UI_TEXT.messages.importSuccess.replace('{count}', addedCmdsCount));
                        }
                    });
                } catch(err) {
                    showModal({ msg: UI_TEXT.messages.importFailed, isAlert: true });
                }
                $wrap.find('#cmd-import-file').val('');
            };
            reader.readAsText(file);
        });

        $wrap.find('#cmd-manager-btn').on('click', openCommandManager);
        $wrap.find('#cmd-manager-close').on('click', closeCommandManager);
        $wrap.find('#cmd-manager-layer').on('click', function (event) {
            if (event.target === this) closeCommandManager();
        });
        $wrap.on('change', '[data-manager-category-check]', function () {
            const category = String($(this).attr('data-manager-category-check'));
            const grouped = collectCommandsByCategory();
            const shouldSelect = $(this).is(':checked');
            (grouped[category] || []).forEach((command) => {
                if (shouldSelect) managerSelection.add(command.id);
                else managerSelection.delete(command.id);
            });
            renderCommandManager();
        });
        $wrap.on('change', '[data-manager-command]', function () {
            const id = String($(this).attr('data-manager-command'));
            if ($(this).is(':checked')) managerSelection.add(id);
            else managerSelection.delete(id);
            renderCommandManager();
        });
        $wrap.find('#cmd-manager-delete').on('click', () => {
            if (!managerSelection.size) return showModal({ msg: UI_TEXT.messages.selectFirst, isAlert: true });
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
        $wrap.find('#cmd-manager-export').on('click', () => {
            if (!managerSelection.size) return showModal({ msg: UI_TEXT.messages.selectFirst, isAlert: true });
            const selectedIds = new Set(managerSelection);
            const selectedCommands = PunctuationButtons.loadCommands().filter((command) => selectedIds.has(command.id));
            askExportFormat((includeFormat) => {
                exportCommands(selectedCommands, includeFormat, false, 'sillytavern_commands_selected');
            });
        });

        let activeInput = null;
        $wrap.on('focus', '#cmd-input-title, #cmd-input-text, #cmd-cat-prefix, #cmd-cat-suffix', function() {
            activeInput = this;
        });

        $wrap.on('click', '.cmd-quick-btn', function(e) {
            e.preventDefault();
            const left = $(this).attr('data-left') || '';
            const right = $(this).attr('data-right') || '';
            if (!activeInput) activeInput = $wrap.find('#cmd-input-text')[0];

            activeInput.focus();
            const start = activeInput.selectionStart || 0;
            const end = activeInput.selectionEnd || 0;
            const val = activeInput.value || '';
            const selected = val.slice(start, end);

            const newVal = val.slice(0, start) + left + selected + right + val.slice(end);
            activeInput.value = newVal;
            
            $(activeInput).trigger('input');

            const newCursor = start + left.length + selected.length;
            activeInput.setSelectionRange(newCursor, newCursor);
        });

        const renderUI = () => {
            const allCmds = PunctuationButtons.loadCommands();
            const globalTags = PunctuationButtons.getCombinedTags();

            if (state.isTagManageMode) {
                $wrap.find('.cmd-toolbar, #cmd-filter-container, #cmd-editor-panel, #cmd-cat-panel').hide();
                
                $wrap.find('#cmd-manage-tags-btn')
                     .html(`<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`)
                     .addClass('back-mode')
                     .attr('title', '返回列表');
                
                const manageHeader = `
                    <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="manage-new-tag-input" class="cmd-search" placeholder="${UI_TEXT.fields.manageNewTag}" style="height:38px;">
                        <button class="punct-action" id="manage-add-tag-btn" style="height:38px; background:#000; color:#fff; padding:0 16px;">${UI_TEXT.actions.addTag}</button>
                    </div>
                `;

                if (globalTags.length === 0) {
                    $wrap.find('#cmd-list-container').html(manageHeader + `<div style="text-align:center; padding:30px; color:#999;">${UI_TEXT.empty.noTags}</div>`);
                } else {
                    const tagRows = globalTags.map(tag => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${PunctuationButtons.escapeHtml(tag)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px;">${UI_TEXT.actions.rename}</button>
                                <button class="punct-action tag-del-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px; color:#000;">${UI_TEXT.actions.delete}</button>
                            </div>
                        </div>
                    `).join('');
                    $wrap.find('#cmd-list-container').html(manageHeader + tagRows);
                }
                return;
            }

            $wrap.find('.cmd-toolbar, #cmd-filter-container').show();
            
            $wrap.find('#cmd-manage-tags-btn')
                 .html(UI_TEXT.actions.manageTags)
                 .removeClass('back-mode')
                 .removeAttr('title');
            
            if ($wrap.find('#cmd-toggle-cat-btn').hasClass('active')) {
                $wrap.find('#cmd-cat-panel').css('display', 'block');
                $wrap.find('#current-cat-name').text(state.activeTab);
            } else {
                $wrap.find('#cmd-cat-panel').css('display', 'none');
            }

            if (state.editingId || $wrap.find('#cmd-toggle-editor-btn').text().includes(UI_TEXT.actions.collapse.slice(-2))) {
                $wrap.find('#cmd-editor-panel').css('display', 'block');
            } else {
                $wrap.find('#cmd-editor-panel').css('display', 'none');
            }

            $wrap.find('#cmd-filter-container').html(
                globalTags.map(tag => `<div class="cmd-tag ${state.filterTags.includes(tag) ? 'active' : ''}" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join('')
                + (state.filterTags.length > 0 ? `<div class="cmd-tag active" style="background:#000;" id="cmd-clear-filter">✖ 清除筛选</div>` : '')
            );

            const editorAvailableTags = Array.from(new Set([...globalTags, ...state.editorTags])).sort();
            
            $wrap.find('#cmd-editor-tags').html(
                editorAvailableTags.map(tag => `<div class="cmd-tag ${state.editorTags.includes(tag) ? 'active' : ''} editor-tag-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join('')
                + `<div class="cmd-tag-add"><input type="text" id="cmd-new-tag-input" placeholder="+新标签"><button id="cmd-add-tag-btn" style="border:none;background:none;cursor:pointer;font-weight:bold;color:#666;">✔</button></div>`
            );

            const cmdsInTab = allCmds.filter(c => c.category === state.activeTab);
            let displayCmds = cmdsInTab;

            if (state.filterTags.length > 0) {
                displayCmds = displayCmds.filter(c => c.tags && state.filterTags.every(t => c.tags.includes(t)));
            }
            
            if (state.searchText) {
                const q = state.searchText.toLowerCase();
                displayCmds = displayCmds.filter(c => 
                    (c.title && c.title.toLowerCase().includes(q)) || 
                    c.text.toLowerCase().includes(q) || 
                    (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
                );
            }

            displayCmds.sort((a, b) => {
                if (a.isFavorite === b.isFavorite) return b.timestamp - a.timestamp;
                return a.isFavorite ? -1 : 1;
            });

            if (displayCmds.length === 0) {
                $wrap.find('#cmd-list-container').html(`<div style="text-align:center; padding:40px; color:#999;">${UI_TEXT.empty.noCommands}</div>`);
            } else {
                const rows = displayCmds.map(cmd => {
                    const displayTitle = cmd.title || cmd.text.substring(0, 10);
                    return `
                    <div class="cmd-row ${cmd.isFavorite ? 'favorite' : ''}" data-id="${cmd.id}">
                        <div class="cmd-content copy-trigger">
                            <div class="cmd-title">${PunctuationButtons.escapeHtml(displayTitle)}</div>
                            <div class="cmd-text">${PunctuationButtons.escapeHtml(cmd.text)}</div>
                            ${cmd.tags && cmd.tags.length ? `<div class="cmd-tags-display">${cmd.tags.map(t => `<span class="cmd-tag-mini">${PunctuationButtons.escapeHtml(t)}</span>`).join('')}</div>` : ''}
                        </div>
                        <div class="cmd-actions">
                            <div class="cmd-btn-icon ${cmd.isFavorite ? 'cmd-btn-heart' : ''} fav-trigger" title="${cmd.isFavorite ? UI_TEXT.actions.unfavorite : UI_TEXT.actions.favorite}">${cmd.isFavorite ? '❤' : '♡'}</div>
                            <div class="cmd-btn-icon edit-trigger" title="${UI_TEXT.actions.edit}">✎</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="${UI_TEXT.actions.delete}">✖</div>
                        </div>
                    </div>
                `});
                $wrap.find('#cmd-list-container').html(rows.join(''));
            }
        };

        const resetEditor = () => {
            state.editingId = null;
            state.editorTags = [];
            $wrap.find('#cmd-input-title').val('');
            $wrap.find('#cmd-input-text').val('');
            $wrap.find('#cmd-editor-panel').css('display', 'none');
            $wrap.find('#cmd-toggle-editor-btn').text(UI_TEXT.actions.newCommand);
            $wrap.find('#cmd-save-btn').text(UI_TEXT.actions.saveCommand);
            renderUI();
        };

        $wrap.on('click', '.monkey-main-tab', function() {
            state.activeMainView = String($(this).data('main-view'));
            renderMainView();
        });

        $wrap.on('change', '#symbol-inline-toggle', function() {
            PunctuationButtons.saveInlineSymbolsEnabled($(this).is(':checked'));
            if ($(this).is(':checked')) PunctuationButtons.buildInlineSymbolBar();
            else document.getElementById('monkey-tools-inline-symbols')?.remove();
        });

        $wrap.on('click', '#symbol-tabs-container .punct-tab', function() {
            $wrap.find('#symbol-tabs-container .punct-tab').removeClass('active');
            $(this).addClass('active');
            $(this).data('symbol-view') === 'add' ? renderSymbolAdd() : renderSymbolEdit();
        });

        $wrap.on('click', '#cmd-tabs-container .punct-tab', function() {
            $wrap.find('#cmd-tabs-container .punct-tab').removeClass('active');
            $(this).addClass('active');
            state.activeTab = $(this).data('cat');
            state.filterTags = []; 
            state.searchText = '';
            $wrap.find('#cmd-search-input').val('');
            
            state.isTagManageMode = false;

            if ($wrap.find('#cmd-toggle-cat-btn').hasClass('active')) {
                const cats = PunctuationButtons.loadCategorySettings();
                const conf = cats[state.activeTab] || { prefix: '', suffix: '' };
                $wrap.find('#cmd-cat-prefix').val(conf.prefix);
                $wrap.find('#cmd-cat-suffix').val(conf.suffix);
            }

            if (state.editingId) {
                state.editingId = null;
                $wrap.find('#cmd-save-btn').text(UI_TEXT.actions.saveCommand);
            }

            renderUI();
        });

        $wrap.on('click', '#cmd-toggle-cat-btn', function() {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                renderUI();
            } else {
                resetEditor(); 
                $(this).addClass('active');
                const cats = PunctuationButtons.loadCategorySettings();
                const conf = cats[state.activeTab] || { prefix: '', suffix: '' };
                $wrap.find('#cmd-cat-prefix').val(conf.prefix);
                $wrap.find('#cmd-cat-suffix').val(conf.suffix);
                renderUI();
            }
        });

        $wrap.find('#cmd-cat-cancel-btn').on('click', () => {
            $wrap.find('#cmd-toggle-cat-btn').removeClass('active');
            renderUI();
        });

        $wrap.find('#cmd-cat-save-btn').on('click', () => {
            const prefix = $wrap.find('#cmd-cat-prefix').val();
            const suffix = $wrap.find('#cmd-cat-suffix').val();
            const cats = PunctuationButtons.loadCategorySettings();
            if (!cats[state.activeTab]) cats[state.activeTab] = {};
            cats[state.activeTab].prefix = prefix;
            cats[state.activeTab].suffix = suffix;
            PunctuationButtons.saveCategorySettings(cats);
            
            renderUI();
            if (window.toastr) toastr.success(UI_TEXT.messages.formatSaved);
        });

        $wrap.on('click', '#cmd-manage-tags-btn', () => {
            state.isTagManageMode = !state.isTagManageMode;
            if(state.isTagManageMode) {
                resetEditor();
                $wrap.find('#cmd-toggle-cat-btn').removeClass('active');
            }
            renderUI();
        });

        $wrap.on('click', '#manage-add-tag-btn', function() {
            const newTag = $wrap.find('#manage-new-tag-input').val().trim();
            if (!newTag) return;
            const gTags = PunctuationButtons.loadGlobalTags();
            if (!gTags.includes(newTag)) {
                gTags.push(newTag);
                PunctuationButtons.saveGlobalTags(gTags);
                renderUI();
                setTimeout(() => $wrap.find('#manage-new-tag-input').focus(), 10);
            } else {
                showModal({msg: UI_TEXT.messages.tagExists, isAlert: true});
            }
        });

        $wrap.on('click', '.tag-edit-btn', function() {
            const oldTag = String($(this).attr('data-tag'));
            showModal({
                msg: UI_TEXT.messages.renameTag.replace('{tag}', oldTag),
                prompt: true,
                defaultVal: oldTag,
                onOk: (newTag) => {
                    if(newTag && newTag.trim() && newTag.trim() !== oldTag) {
                        const finalTag = newTag.trim();
                        let cmds = PunctuationButtons.loadCommands();
                        cmds.forEach(cmd => { if(cmd.tags && cmd.tags.includes(oldTag)) { cmd.tags = cmd.tags.map(t => t === oldTag ? finalTag : t); } });
                        PunctuationButtons.saveCommands(cmds);
                        
                        let gTags = PunctuationButtons.loadGlobalTags();
                        if (gTags.includes(oldTag)) {
                            gTags[gTags.indexOf(oldTag)] = finalTag;
                            PunctuationButtons.saveGlobalTags(gTags);
                        }

                        if (state.filterTags.includes(oldTag)) {
                            state.filterTags = state.filterTags.map(t => t === oldTag ? finalTag : t);
                        }
                        renderUI();
                    }
                }
            });
        });

        $wrap.on('click', '.tag-del-btn', function() {
            const tag = String($(this).attr('data-tag'));
            showModal({
                msg: UI_TEXT.messages.deleteTag.replace('{tag}', tag),
                onOk: () => {
                    let cmds = PunctuationButtons.loadCommands();
                    cmds.forEach(cmd => { if(cmd.tags && cmd.tags.includes(tag)) { cmd.tags = cmd.tags.filter(t => t !== tag); } });
                    PunctuationButtons.saveCommands(cmds);
                    
                    let gTags = PunctuationButtons.loadGlobalTags();
                    gTags = gTags.filter(t => t !== tag);
                    PunctuationButtons.saveGlobalTags(gTags);

                    if (state.filterTags.includes(tag)) {
                        state.filterTags = state.filterTags.filter(t => t !== tag);
                    }
                    renderUI();
                }
            });
        });

        $wrap.on('click', '.editor-tag-btn', function() {
            const tag = String($(this).attr('data-tag'));
            if (state.editorTags.includes(tag)) state.editorTags = state.editorTags.filter(t => t !== tag);
            else state.editorTags.push(tag);
            renderUI();
        });

        $wrap.on('click', '#cmd-add-tag-btn', function(e) {
            e.preventDefault();
            const newTag = $wrap.find('#cmd-new-tag-input').val().trim();
            if (newTag && !state.editorTags.includes(newTag)) { 
                state.editorTags.push(newTag); 
                const gTags = PunctuationButtons.loadGlobalTags();
                if(!gTags.includes(newTag)) {
                    gTags.push(newTag);
                    PunctuationButtons.saveGlobalTags(gTags);
                }
            }
            renderUI();
            setTimeout(() => $wrap.find('#cmd-new-tag-input').focus(), 10);
        });

        $wrap.find('#cmd-search-input').on('input', function() {
            state.searchText = $(this).val().trim();
            renderUI();
        });

        $wrap.on('click', '.cmd-filter-bar .cmd-tag', function() {
            if ($(this).attr('id') === 'cmd-clear-filter') { 
                state.filterTags = []; 
            } else { 
                const tag = String($(this).attr('data-tag')); 
                if (state.filterTags.includes(tag)) {
                    state.filterTags = state.filterTags.filter(t => t !== tag);
                } else {
                    state.filterTags.push(tag);
                }
            }
            renderUI();
        });

        $wrap.on('click', '#cmd-toggle-editor-btn', function() {
            const panel = $wrap.find('#cmd-editor-panel');
            if (panel.css('display') !== 'none') { 
                resetEditor(); 
            } else { 
                resetEditor(); 
                $wrap.find('#cmd-toggle-cat-btn').removeClass('active'); 
                panel.css('display', 'block'); 
                $(this).text(UI_TEXT.actions.collapse); 
                renderUI(); 
            }
        });

        $wrap.find('#cmd-cancel-btn').on('click', resetEditor);

        $wrap.find('#cmd-save-btn').on('click', () => {
            const text = $wrap.find('#cmd-input-text').val().trim();
            if (!text) return showModal({msg: UI_TEXT.messages.commandEmpty, isAlert: true});
            
            const rawTitle = $wrap.find('#cmd-input-title').val().trim();
            const title = rawTitle || text.substring(0, 10);

            let cmds = PunctuationButtons.loadCommands();
            if (state.editingId) {
                const idx = cmds.findIndex(c => c.id === state.editingId);
                if (idx !== -1) { 
                    cmds[idx].title = title;
                    cmds[idx].text = text; 
                    cmds[idx].tags = [...state.editorTags]; 
                }
            } else {
                cmds.push({ 
                    id: PunctuationButtons.generateId(), category: state.activeTab, title: title, text: text, isFavorite: false, tags: [...state.editorTags], timestamp: Date.now() 
                });
            }
            PunctuationButtons.saveCommands(cmds);
            resetEditor();
        });

        // 绑定带前缀复制功能的触发器
        $wrap.on('click', '.copy-trigger', function() {
            const id = $(this).closest('.cmd-row').data('id');
            const cmd = PunctuationButtons.loadCommands().find(c => c.id === id);
            if (cmd) {
                const cats = PunctuationButtons.loadCategorySettings();
                const conf = cats[cmd.category] || { prefix: '', suffix: '' };
                // 拼接前缀与后缀并发送给修复后的 copy 函数
                PunctuationButtons.copyToClipboard((conf.prefix || '') + cmd.text + (conf.suffix || ''));
            }
        });

        $wrap.on('click', '.fav-trigger', function(e) {
            e.stopPropagation();
            const id = $(this).closest('.cmd-row').data('id');
            let cmds = PunctuationButtons.loadCommands();
            const idx = cmds.findIndex(c => c.id === id);
            if (idx !== -1) { cmds[idx].isFavorite = !cmds[idx].isFavorite; PunctuationButtons.saveCommands(cmds); renderUI(); }
        });

        $wrap.on('click', '.edit-trigger', function(e) {
            e.stopPropagation();
            const id = $(this).closest('.cmd-row').data('id');
            const cmd = PunctuationButtons.loadCommands().find(c => c.id === id);
            if (cmd) {
                state.editingId = cmd.id;
                state.editorTags = [...(cmd.tags || [])];
                $wrap.find('#cmd-input-title').val(cmd.title || '');
                $wrap.find('#cmd-input-text').val(cmd.text);
                
                $wrap.find('#cmd-toggle-cat-btn').removeClass('active');
                $wrap.find('#cmd-editor-panel').css('display', 'block');
                $wrap.find('#cmd-toggle-editor-btn').text(UI_TEXT.actions.collapse);
                $wrap.find('#cmd-save-btn').text(UI_TEXT.actions.saveEdit);
                renderUI();
            }
        });

        $wrap.on('click', '.del-trigger', function(e) {
            e.stopPropagation();
            const id = $(this).closest('.cmd-row').data('id');
            const cmd = PunctuationButtons.loadCommands().find(c => c.id === id);
            if (!cmd) return;
            showModal({
                msg: UI_TEXT.messages.deleteCommand.replace('{category}', cmd.category),
                onOk: () => {
                    let cmds = PunctuationButtons.loadCommands().filter(c => c.id !== id);
                    PunctuationButtons.saveCommands(cmds); renderUI();
                }
            });
        });

        renderMainView();
        PunctuationButtons.openPopup($wrap, { okButton: '关闭', forceCustom: true });
    },

    openSettings: () => {
        PunctuationButtons.openCommandPanel('symbols');
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

setTimeout(PunctuationButtons.register, 1000);
setTimeout(PunctuationButtons.register, 3000);
window.addEventListener('resize', () => {
    const launcher = document.getElementById('monkey-tools-floating');
    if (launcher) {
        const rect = launcher.getBoundingClientRect();
        const button = launcher.querySelector('.monkey-tools-floating-main');
        const width = button?.getBoundingClientRect().width || 64;
        const height = button?.getBoundingClientRect().height || 64;
        launcher.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.left))}px`;
        launcher.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.top))}px`;
    }
    PunctuationButtons.positionInlineSymbolBar();
});
window.addEventListener('scroll', () => PunctuationButtons.positionInlineSymbolBar(), true);
window.addEventListener('monkey-tools:settings-changed', PunctuationButtons.register);
