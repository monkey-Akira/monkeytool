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
const PUNCT_SETTINGS_BUTTON = '新增符号'; 
const PUNCT_CMD_BUTTON = '指令仓库'; 
const EXTENSION_SETTINGS_KEY = 'monkey-tools';

const DEFAULT_CMD_CATEGORIES = CMD_CATEGORIES;

const PunctuationButtons = {
    debugLogged: false,
    boundNames: {},
    migratedLocalStorage: false,
    symbolBarObserver: null,
    symbolBarRetryTimer: null,
    symbolBarTextarea: null,
    symbolBarHideTimer: null,
    symbolBarVisible: false,

    defaultSymbols: [
        { name: '**', left: '*', right: '*' },
        { name: '""', left: '"', right: '"' },
        { name: '()', left: '(', right: ')' },
        { name: '\uFF0C', left: '\uFF0C', right: '' },
        { name: '\u3002', left: '\u3002', right: '' },
        { name: '\uFF1F', left: '\uFF1F', right: '' },
        { name: '\uFF01', left: '\uFF01', right: '' },
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
            if (typeof settings.inlineSymbolBarEnabled !== 'boolean') {
                settings.inlineSymbolBarEnabled = true;
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
    loadInlineSymbolBarEnabled: () => {
        PunctuationButtons.migrateLocalStorageOnce();
        const value = PunctuationButtons.getSettingsRoot().inlineSymbolBarEnabled;
        return typeof value === 'boolean' ? value : true;
    },
    saveInlineSymbolBarEnabled: (enabled) => {
        PunctuationButtons.getSettingsRoot().inlineSymbolBarEnabled = !!enabled;
        PunctuationButtons.saveExtensionSettings();
    },
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
    copyToClipboard: (text, showToast = true) => {
        const value = String(text ?? '');
        const notifySuccess = () => {
            if (showToast && window.toastr) window.toastr.success('\u6307\u4EE4\u5DF2\u590D\u5236');
        };
        const notifyManual = () => window.prompt('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236\uFF1A', value);
        // 同步后备复制方案：避免异步导致浏览器权限拦截
        function fallbackCopy(str) {
            let success = false;
            const textArea = document.createElement("textarea");
            textArea.value = str;
            textArea.setAttribute('readonly', '');
            
            // 安全隐形处理：移出屏幕外，且不覆盖默认样式以保证可被选中
            textArea.style.position = "fixed";
            textArea.style.top = "-9999px";
            textArea.style.left = "-9999px";
            textArea.style.opacity = "0";
            
            document.body.appendChild(textArea);
            
            // 兼容 iOS 与常规浏览器的物理级选中
            const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent)
                || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            if (isIOS) {
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(textArea);
                selection.removeAllRanges();
                selection.addRange(range);
                textArea.focus();
                textArea.setSelectionRange(0, str.length);
            } else {
                textArea.focus({ preventScroll: true });
                textArea.select();
            }

            try {
                success = document.execCommand('copy');
            } catch (error) {
                success = false;
            } finally {
                document.body.removeChild(textArea);
            }
            return success;
        }

        // 1. 首选：趁用户点击事件未结束，立刻执行同步物理复制
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(value).then(() => {
                notifySuccess();
            }).catch(() => {
                if (fallbackCopy(value)) {
                    notifySuccess();
                } else {
                    notifyManual();
                }
            });
            return;
        }

        // 2. 备选：若老接口失效，尝试现代异步 API
        if (fallbackCopy(value)) {
            notifySuccess();
                // 3. 终极保底：全部受限时强行弹窗要求用户手动复制，决不报假喜
        } else {
            notifyManual();
        }
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
            window.toastr?.error('\u65E0\u6CD5\u6253\u5F00\u5F39\u7A97\uFF1A\u5F53\u524D\u73AF\u5883\u7F3A\u5C11\u539F\u751F\u5F39\u7A97 API \u6216 jQuery\u3002');
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
            #monkey-tools-inline-symbols { display:none; flex-wrap:wrap; gap:4px; padding:0; border:none; background:transparent; box-shadow:none; }
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
        PunctuationButtons.symbolBarVisible = false;
        if (!PunctuationButtons.loadInlineSymbolBarEnabled()) {
            document.getElementById('monkey-tools-inline-symbols')?.remove();
            return;
        }
        document.getElementById('monkey-tools-inline-symbols')?.remove();
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

        let hideTimer = null;
        const hideBar = () => {
            PunctuationButtons.symbolBarVisible = false;
            const currentBar = document.getElementById('monkey-tools-inline-symbols');
            if (currentBar) currentBar.style.display = 'none';
        };
        const showBar = () => {
            if (!PunctuationButtons.loadInlineSymbolBarEnabled()) return;
            PunctuationButtons.symbolBarVisible = true;
            PunctuationButtons.positionInlineSymbolBar();
        };
        const scheduleHideBar = () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => {
                if (document.activeElement === textarea || bar.matches(':hover')) return;
                hideBar();
            }, 120);
        };

        textarea.addEventListener('focusin', showBar);
        textarea.addEventListener('input', showBar);
        textarea.addEventListener('mouseup', showBar);
        textarea.addEventListener('keyup', showBar);
        textarea.addEventListener('blur', scheduleHideBar);
        bar.addEventListener('pointerenter', showBar);
        bar.addEventListener('pointerleave', scheduleHideBar);

        bar.addEventListener('pointerdown', (event) => {
            const button = event.target.closest('button[data-symbol-name]');
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            PunctuationButtons.insertByName(button.dataset.symbolName);
        }, true);

        document.body.appendChild(bar);
        if (textarea.matches(':focus') || document.activeElement === textarea) {
            PunctuationButtons.symbolBarVisible = true;
            PunctuationButtons.positionInlineSymbolBar();
        } else {
            hideBar();
        }
        PunctuationButtons.watchInlineSymbolBarHost();
    },
    positionInlineSymbolBar: () => {
        const bar = document.getElementById('monkey-tools-inline-symbols');
        const textarea = PunctuationButtons.getSendTextarea();
        if (!bar || !textarea) return;

        if (PunctuationButtons.symbolBarVisible) {
            bar.style.display = 'flex';
            bar.style.visibility = 'hidden';
        }
        const rect = textarea.getBoundingClientRect();
        const width = Math.max(220, Math.min(rect.width, window.innerWidth - 24));
        const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        const top = Math.max(8, rect.top - (bar.offsetHeight || 32) - 8);
        bar.style.cssText = `position:fixed;left:${left}px;top:${top}px;width:${width}px;z-index:2147482500;display:${PunctuationButtons.symbolBarVisible ? 'flex' : 'none'};visibility:visible;flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
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
    },
    watchInlineSymbolBarHost: () => {
        if (typeof MutationObserver === 'undefined') return;
        if (PunctuationButtons.symbolBarObserver) {
            PunctuationButtons.symbolBarObserver.disconnect();
        }
        PunctuationButtons.symbolBarObserver = new MutationObserver(() => {
            if (!PunctuationButtons.loadInlineSymbolBarEnabled()) {
                document.getElementById('monkey-tools-inline-symbols')?.remove();
                return;
            }
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
            :root { --monkey-tools-font:"fugu", var(--mainFontFamily), "Microsoft YaHei", sans-serif; --monkey-tools-shadow-color:var(--SmartThemeShadowColor, #80808075); --monkey-tools-shadow-width:var(--shadowWidth, 1); }
            .punct-settings *, .punct-settings *::before, .punct-settings *::after { box-sizing: border-box; }
            .popup:has(.punct-settings) { background:#fff !important; border:2px solid #000 !important; border-radius:0 !important; outline:1.5px solid #000 !important; outline-offset:-6px !important; box-shadow:3px 3px 3px #80808075 !important; }
            .popup:has(.punct-settings) .popup-content, .popup:has(.punct-settings) .popup-body { background:#fff !important; border-radius:0 !important; }
            .punct-settings { position:relative; overflow-x:hidden; overflow-y:auto; max-height:85vh; color:#000; padding:16px; width:100%; min-width:280px; max-width:620px; font-family:var(--monkey-tools-font); -webkit-overflow-scrolling: touch; background:#fff; text-shadow:0 0 calc(var(--monkey-tools-shadow-width) * 1px) var(--monkey-tools-shadow-color); }
            .punct-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap: wrap; gap: 8px; }
            .punct-title { font-size:18px; font-weight:800; letter-spacing:0; background:#fff; border-left:2px solid #000; outline:1.5px solid #000; outline-offset:-7px; padding:10px 18px; }
            .main-view-tabs { display:flex; gap:8px; margin-bottom:16px; }
            .main-view-tab { flex:1; border:1.5px solid #000; background:#fff; color:#000; border-radius:2px; padding:10px 12px; cursor:pointer; font-weight:700; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }
            .main-view-tab.active { background:#000; color:#fff; box-shadow:inset 1px 1px 3px #a7a7a7; }
            .main-view-tab:hover { background:#f0f0f0; }
            
            .punct-tabs { display:flex; gap:6px; margin-bottom:16px; background:#f0f0f0; padding:5px; border:1.5px dashed #000; border-radius:0; flex-shrink: 0; }
            .punct-tab { flex:1; border:1.5px solid transparent; background:transparent; color:#555; border-radius:0; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; }
            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            
            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:2px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:inherit; }
            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }
            .punct-action:active { transform:translateY(0); box-shadow:none; }
            .punct-action.active { background:#e7e7e7; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }
            
            .punct-panel { border:1.5px solid #000; border-radius:0; padding:16px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; }
            .punct-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; width: 100%; }
            .punct-field label { font-size:12px; font-weight:700; opacity:1; color:#000; }
            .punct-field input, .punct-field select, .punct-field textarea, .cmd-search { border:1.5px dashed #000; border-radius:2px; padding:10px 12px; background:#f0f0f0; transition:all 0.2s; outline:none; font-family:inherit; color:#000; width: 100%; text-shadow:inherit; }
            .punct-field input:focus, .punct-field textarea:focus, .punct-field select:focus, .cmd-search:focus { background:#fff; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            
            .cmd-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; flex-shrink: 0; }
            .cmd-search { flex:1; min-width: 150px; height:38px; }
            .cmd-filter-bar { display:flex; flex-wrap:wrap; gap:6px; flex:1; }
            .cmd-tag { font-size:12px; padding:4px 12px; border-radius:2px; background:#fff; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; font-weight:700; border:1.5px dashed #000; text-shadow:inherit; }
            .cmd-tag:hover { background:#f0f0f0; color:#000; box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-tag.active { background:#000; color:#fff; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }
            
            .cmd-editor-wrap { border:1.5px solid #000; background:#fff; padding:16px; border-radius:0; margin-bottom:16px; display:none; box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-tag-editor { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; align-items:center; }
            .cmd-tag-add { border:1.5px dashed #000; background:#fff; display:flex; align-items:center; padding:2px 8px; border-radius:2px; transition:border-color 0.2s; }
            .cmd-tag-add:focus-within { border-color:#222; }
            .cmd-tag-add input { border:none; background:transparent; width:70px; outline:none; font-size:12px; padding:4px 0; font-family:inherit; text-shadow:inherit; }
            
            .cmd-list-wrap { max-height:50vh; overflow-y:auto; padding-right:8px; display:flex; flex-direction:column; gap:12px; scrollbar-width: none; scrollbar-color: transparent transparent; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
            .cmd-list-wrap::-webkit-scrollbar { width:6px; }
            .cmd-list-wrap::-webkit-scrollbar-thumb { background:transparent; border-radius:0; }
            .cmd-list-wrap::-webkit-scrollbar-thumb:hover { background:transparent; }
            
            .cmd-row { border:1.5px solid #000; border-radius:0; padding:14px; background:#fff; cursor:pointer; display:flex; gap:12px; transition:all 0.25s; box-shadow:1px 2px 5px #a7a7a7; position:relative; overflow:hidden; align-items: center; flex-shrink: 0; }
            .cmd-row:hover { border-color:#000; box-shadow:3px 3px 3px #80808075; transform:translateY(-1px); }
            .cmd-row.favorite { border-left:4px solid #000; }
            .cmd-row.dragging { opacity:.55; border-style:dashed; box-shadow:none; transform:none; }
            .drag-handle { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:2px; color:#000; background:#f0f0f0; border:1.5px dashed #000; cursor:grab; flex-shrink:0; font-weight:900; line-height:1; touch-action:none; }
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
            .cmd-tag-mini { font-size:11px; background:#f0f0f0; color:#000; padding:2px 8px; border-radius:2px; font-weight:700; white-space: nowrap; border:1px dashed #000; }
            
            .cmd-actions { display:flex; flex-direction:column; gap:10px; align-items:center; justify-content:center; border-left:1.5px dashed #000; padding-left:12px; flex-shrink:0; }
            .cmd-btn-icon { cursor:pointer; font-size:16px; opacity:0.5; transition:all 0.2s; user-select:none; }
            .cmd-btn-icon:hover { opacity:1; transform:scale(1.1); }
            .cmd-btn-heart { color:#000; opacity:1; }
            
            .tag-manage-btn { background:#fff; border:1.5px solid #000; color:#000; cursor:pointer; font-size:12px; font-weight:700; padding:6px 12px; border-radius:2px; white-space:nowrap; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }
            .tag-manage-btn:hover { background:#f0f0f0; color:#000; box-shadow:3px 3px 3px #80808075; }
            .tag-manage-btn.back-mode { width:34px; height:34px; padding:0; border-radius:2px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; color:#000; }
            .tag-manage-btn.back-mode:hover { transform:scale(1.04); box-shadow:3px 3px 3px #80808075; background:#f0f0f0; }

            .cmd-modal-overlay { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(255,255,255,0.72); backdrop-filter:none; -webkit-backdrop-filter:none; z-index:9999; border-radius:0; display:none; }
            .cmd-confirm-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:0; padding:24px; box-shadow:3px 3px 3px #80808075; text-align:center; width:85%; max-width:320px; box-sizing:border-box; outline:1.5px solid #000; outline-offset:-6px; }
            .cmd-confirm-text { font-size:15px; font-weight:700; color:#000; margin-bottom:20px; line-height:1.6; word-break:break-all; white-space:pre-wrap; }
            .cmd-confirm-actions { display:flex; justify-content:center; gap:12px; }

            .cmd-quick-inserts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
            .cmd-quick-btn { font-size:12px; font-weight:700; padding:4px 8px; border-radius:2px; background:#fff; border:1.5px dashed #000; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; text-shadow:inherit; }
            .cmd-quick-btn:hover { background:#f0f0f0; color:#000; border-color:#000; transform:translateY(-1px); box-shadow:1px 2px 5px #a7a7a7; }
            .cmd-quick-btn:active { transform:scale(0.95); }
        </style>
    `,

    modalHtml: `
        <div class="cmd-modal-overlay" id="custom-modal-layer">
            <div class="cmd-confirm-box">
                <div class="cmd-confirm-text" id="custom-modal-msg"></div>
                <input type="text" id="custom-modal-input" style="display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;">
                <div class="cmd-confirm-actions">
                    <button class="punct-action" id="custom-modal-cancel" style="background:#fff; color:#000;">取消</button>
                    <button class="punct-action" id="custom-modal-ok" style="background:#000; color:#fff;">确定</button>
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
            activeView: initialView === 'symbols' ? 'symbols' : 'commands',
            activeTab: Object.keys(DEFAULT_CMD_CATEGORIES)[0],
            searchText: '',
            filterTags: [], 
            editingId: null,
            editorTags: [],
            isTagManageMode: false,
            symbolView: 'add'
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
                <div class="punct-head">
                    <div class="punct-title">\u5E38\u7528\u6307\u4EE4\u5E93</div>
                    <div style="display:flex; gap:8px;">
                        <button class="punct-action" id="cmd-import-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5408\u5E76\u5BFC\u5165JSON\u6587\u4EF6">\uD83D\uDCE5 \u5BFC\u5165</button>
                        <button class="punct-action" id="cmd-export-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5BFC\u51FA\u6240\u6709\u6570\u636E\u5907\u4EFD">\uD83D\uDCE4 \u5BFC\u51FA</button>
                        <input type="file" id="cmd-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                <div class="main-view-tabs">
                    <button class="main-view-tab ${state.activeView === 'commands' ? 'active' : ''}" data-main-view="commands" type="button">\u6307\u4EE4\u4ED3\u5E93</button>
                    <button class="main-view-tab ${state.activeView === 'symbols' ? 'active' : ''}" data-main-view="symbols" type="button">\u7B26\u53F7\u7F16\u8F91</button>
                </div>

                <div data-main-panel="commands">
                <div class="punct-tabs" id="cmd-tabs-container">
                    ${Object.keys(DEFAULT_CMD_CATEGORIES).map(cat => `<button class="punct-tab ${state.activeTab === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('')}
                </div>

                <div class="cmd-toolbar">
                    <input type="text" class="cmd-search" id="cmd-search-input" placeholder="\u641C\u7D22\u6307\u4EE4\u6807\u9898\u3001\u5185\u5BB9\u6216\u6807\u7B7E...">
                    <button class="punct-action" id="cmd-toggle-cat-btn" style="height:38px; padding:0 12px;" title="\u8BBE\u7F6E\u5F53\u524D\u5206\u7C7B\u7684\u524D\u540E\u7F00">\u2699\uFE0F \u683C\u5F0F</button>
                    <button class="punct-action" id="cmd-toggle-editor-btn" style="height:38px;">\u2795 \u65B0\u5EFA</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; min-height: 28px;">
                    <div class="cmd-filter-bar" id="cmd-filter-container"></div>
                    <button class="tag-manage-btn" id="cmd-manage-tags-btn">\u7BA1\u7406\u6807\u7B7E</button>
                </div>

                <div class="cmd-editor-wrap" id="cmd-cat-panel">
                    <div class="punct-field" style="margin-bottom:12px;">
                        <label>\u5F53\u524D\u5206\u7C7B\u3010<span id="current-cat-name" style="color:#000; font-size:14px; font-weight:800;"></span>\u3011\u7684\u524D\u540E\u7F00\u8BBE\u7F6E</label>
                    </div>
                    <div class="punct-field">
                        <label>\u524D\u7F00\u5185\u5BB9</label>
                        <input type="text" id="cmd-cat-prefix" placeholder="\u5982: [\u52A8\u4F5C\uFF1A" style="font-size:14px; padding:10px;">
                    </div>
                    <div class="punct-field">
                        <label>\u540E\u7F00\u5185\u5BB9</label>
                        <input type="text" id="cmd-cat-suffix" placeholder="\u5982: ]" style="font-size:14px; padding:10px;">
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="punct-action" id="cmd-cat-cancel-btn" style="background:#fff; color:#000;">\u53D6\u6D88</button>
                        <button class="punct-action" id="cmd-cat-save-btn" style="background:#000; color:#fff;">\u4FDD\u5B58\u683C\u5F0F</button>
                    </div>
                </div>

                <div class="cmd-editor-wrap" id="cmd-editor-panel">
                    <div class="punct-field">
                        <input type="text" id="cmd-input-title" placeholder="\u6307\u4EE4\u6807\u9898 (\u9009\u586B\uFF0C\u9ED8\u8BA4\u622A\u53D6\u5185\u5BB9\u524D10\u5B57)">
                    </div>
                    
                    <div class="punct-field">
                        <div class="cmd-quick-inserts">${quickInsertsHtml}</div>
                        <textarea id="cmd-input-text" rows="3" placeholder="\u8F93\u5165\u6307\u4EE4\u5185\u5BB9... (\u5FC5\u586B)"></textarea>
                    </div>
                    
                    <div class="punct-field">
                        <label>\u9009\u62E9\u6216\u65B0\u5EFA\u6807\u7B7E (\u53EF\u591A\u9009)</label>
                        <div class="cmd-tag-editor" id="cmd-editor-tags"></div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                        <button class="punct-action" id="cmd-cancel-btn" style="background:#fff; color:#000;">\u53D6\u6D88</button>
                        <button class="punct-action" id="cmd-save-btn" style="background:#000; color:#fff;">\u4FDD\u5B58\u6307\u4EE4</button>
                    </div>
                </div>

                <div class="cmd-list-wrap" id="cmd-list-container"></div>
                </div>
                <div data-main-panel="symbols" style="display:none;">
                    <div class="punct-head" style="margin-top:0;">
                        <div class="punct-title">\u7B26\u53F7\u7F16\u8F91</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding:10px 12px; border:1px solid #d8dee4; border-radius:8px; background:#f6f8fa;">
                        <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#202124;">
                            <input type="checkbox" id="symbol-inline-toggle">
                            \u4EC5\u5728 #send_textarea \u4E0A\u65B9\u663E\u793A\u7B26\u53F7\u6309\u94AE
                        </label>
                    </div>
                    <div class="punct-tabs" id="symbol-tabs-container">
                        <button class="punct-tab ${state.symbolView === 'add' ? 'active' : ''}" data-symbol-view="add">\u65B0\u589E</button>
                        <button class="punct-tab ${state.symbolView === 'edit' ? 'active' : ''}" data-symbol-view="edit">\u7F16\u8F91</button>
                    </div>
                    <div class="punct-panel" data-symbol-content></div>
                </div>
                ${PunctuationButtons.modalHtml}
            </div>
        `);

        let modalCallback = null;
        let isPromptMode = false;
        
        const showModal = (options) => {
            $wrap.find('#custom-modal-msg').text(options.msg);
            modalCallback = options.onOk;
            isPromptMode = !!options.prompt;
            const $input = $wrap.find('#custom-modal-input');
            
            if (isPromptMode) {
                $input.val(options.defaultVal || '').show();
                $wrap.find('#custom-modal-ok').css('background', '#222').text('\u786E\u5B9A');
            } else {
                $input.hide();
                if (options.isAlert) {
                    $wrap.find('#custom-modal-ok').css('background', '#222').text('\u6211\u77E5\u9053\u4E86');
                } else {
                    $wrap.find('#custom-modal-ok').css('background', '#000').text('\u786E\u5B9A\u64CD\u4F5C');
                }
            }
            
            if (options.isAlert) $wrap.find('#custom-modal-cancel').hide();
            else $wrap.find('#custom-modal-cancel').show();

            $wrap.find('#custom-modal-layer').fadeIn(150);
            if (isPromptMode) setTimeout(() => $input.focus(), 160);
        };

        $wrap.find('#custom-modal-cancel').on('click', () => {
            modalCallback = null;
            $wrap.find('#custom-modal-layer').fadeOut(150);
        });

        $wrap.find('#custom-modal-ok').on('click', () => {
            const val = isPromptMode ? $wrap.find('#custom-modal-input').val() : true;
            if (modalCallback) modalCallback(val);
            $wrap.find('#custom-modal-layer').fadeOut(150);
        });

        $wrap.find('#cmd-export-btn').on('click', () => {
            const data = {
                version: 1,
                commands: PunctuationButtons.loadCommands(),
                categories: PunctuationButtons.loadCategorySettings(),
                tags: PunctuationButtons.loadGlobalTags(),
                symbols: PunctuationButtons.loadCustomSymbols()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().slice(0, 10);
            a.download = `sillytavern_commands_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (window.toastr) toastr.success('\u6570\u636E\u5BFC\u51FA\u6210\u529F\uFF01');
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
                        msg: '\u5373\u5C06\u5BFC\u5165\u5907\u4EFD\u6570\u636E\uFF01\n\u4E3A\u9632\u6B62\u8BEF\u5220\uFF0C\u5BFC\u5165\u7684\u6570\u636E\u5C06\u4E0E\u73B0\u6709\u6570\u636E\u8FDB\u884C\u3010\u5408\u5E76\u3011\u3002\n\u662F\u5426\u7EE7\u7EED\uFF1F',
                        onOk: () => {
                            let importedCmds = Array.isArray(data.commands) ? data.commands : [];
                            let existingCmds = PunctuationButtons.loadCommands();
                            let addedCmdsCount = 0;
                            importedCmds.forEach(ic => {
                                const exists = existingCmds.find(ec => ec.title === ic.title && ec.text === ic.text);
                                if (!exists) {
                                    ic.id = PunctuationButtons.generateId();
                                    existingCmds.push(ic);
                                    addedCmdsCount++;
                                }
                            });
                            PunctuationButtons.saveCommands(existingCmds);

                            if (data.categories) {
                                let existingCats = PunctuationButtons.loadCategorySettings();
                                Object.keys(data.categories).forEach(k => existingCats[k] = data.categories[k]);
                                PunctuationButtons.saveCategorySettings(existingCats);
                            }

                            if (Array.isArray(data.tags)) {
                                let existingTags = PunctuationButtons.loadGlobalTags();
                                data.tags.forEach(t => { if (!existingTags.includes(t)) existingTags.push(t); });
                                PunctuationButtons.saveGlobalTags(existingTags);
                            }

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
                            if (window.toastr) toastr.success(`\u5BFC\u5165\u6210\u529F\uFF01\u5171\u65B0\u589E ${addedCmdsCount} \u6761\u6307\u4EE4\u3002`);
                        }
                    });
                } catch(err) {
                    showModal({ msg: '\u8BFB\u53D6\u5931\u8D25\uFF1A\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E\u6216\u5DF2\u635F\u574F\uFF01', isAlert: true });
                }
                $wrap.find('#cmd-import-file').val('');
            };
            reader.readAsText(file);
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
                     .attr('title', '\u8FD4\u56DE\u5217\u8868');
                
                const manageHeader = `
                    <div style="display:flex; gap:8px; margin-bottom:12px;">
                        <input type="text" id="manage-new-tag-input" class="cmd-search" placeholder="\u8F93\u5165\u65B0\u6807\u7B7E\u540D\u79F0..." style="height:38px;">
                        <button class="punct-action" id="manage-add-tag-btn" style="height:38px; background:#000; color:#fff; padding:0 16px;">\u65B0\u589E\u6807\u7B7E</button>
                    </div>
                `;

                if (globalTags.length === 0) {
                    $wrap.find('#cmd-list-container').html(manageHeader + `<div style="text-align:center; padding:30px; color:#999;">\u5F53\u524D\u6CA1\u6709\u4EFB\u4F55\u6807\u7B7E</div>`);
                } else {
                    const tagRows = globalTags.map(tag => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${PunctuationButtons.escapeHtml(tag)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px;">\u91CD\u547D\u540D</button>
                                <button class="punct-action tag-del-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}" style="padding:6px 12px; font-size:12px; color:#000;">\u5220\u9664</button>
                            </div>
                        </div>
                    `).join('');
                    $wrap.find('#cmd-list-container').html(manageHeader + tagRows);
                }
                return;
            }

            $wrap.find('.cmd-toolbar, #cmd-filter-container').show();
            
            $wrap.find('#cmd-manage-tags-btn')
                 .html('\u7BA1\u7406\u6807\u7B7E')
                 .removeClass('back-mode')
                 .removeAttr('title');
            
            if ($wrap.find('#cmd-toggle-cat-btn').hasClass('active')) {
                $wrap.find('#cmd-cat-panel').css('display', 'block');
                $wrap.find('#current-cat-name').text(state.activeTab);
            } else {
                $wrap.find('#cmd-cat-panel').css('display', 'none');
            }

            if (state.editingId || $wrap.find('#cmd-toggle-editor-btn').text().includes('\u6536\u8D77')) {
                $wrap.find('#cmd-editor-panel').css('display', 'block');
            } else {
                $wrap.find('#cmd-editor-panel').css('display', 'none');
            }

            $wrap.find('#cmd-filter-container').html(
                globalTags.map(tag => `<div class="cmd-tag ${state.filterTags.includes(tag) ? 'active' : ''}" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join('')
                + (state.filterTags.length > 0 ? `<div class="cmd-tag active" style="background:#000;" id="cmd-clear-filter">\u2716 \u6E05\u9664\u7B5B\u9009</div>` : '')
            );

            const editorAvailableTags = Array.from(new Set([...globalTags, ...state.editorTags])).sort();
            
            $wrap.find('#cmd-editor-tags').html(
                editorAvailableTags.map(tag => `<div class="cmd-tag ${state.editorTags.includes(tag) ? 'active' : ''} editor-tag-btn" data-tag="${PunctuationButtons.escapeHtml(tag)}">${PunctuationButtons.escapeHtml(tag)}</div>`).join('')
                + `<div class="cmd-tag-add"><input type="text" id="cmd-new-tag-input" placeholder="+\u65B0\u6807\u7B7E"><button id="cmd-add-tag-btn" style="border:none;background:none;cursor:pointer;font-weight:bold;color:#666;">\u2714</button></div>`
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
                $wrap.find('#cmd-list-container').html(`<div style="text-align:center; padding:40px; color:#999;">\u6CA1\u6709\u627E\u5230\u6307\u4EE4</div>`);
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
                            <div class="cmd-btn-icon ${cmd.isFavorite ? 'cmd-btn-heart' : ''} fav-trigger" title="${cmd.isFavorite ? '\u53D6\u6D88\u5E38\u7528' : '\u8BBE\u4E3A\u5E38\u7528'}">${cmd.isFavorite ? '\u2764' : '\u2661'}</div>
                            <div class="cmd-btn-icon edit-trigger" title="\u4FEE\u6539">\u270E</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="\u5220\u9664">\u2716</div>
                        </div>
                    </div>
                `});
                $wrap.find('#cmd-list-container').html(rows.join(''));
            }
        };

        const renderSymbolAdd = () => {
            $wrap.find('[data-symbol-content]').html(`
                <div class="punct-field"><label>\u7C7B\u578B</label><select data-symbol-add-type><option value="single">\u5355\u72EC\u6807\u70B9</option><option value="pair">\u6210\u5BF9\u6807\u70B9</option></select></div>
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-symbol-add-name placeholder="\u663E\u793A\u5728\u6309\u94AE\u4E0A"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label data-symbol-left-label>\u8981\u63D2\u5165\u7684\u7B26\u53F7</label><input data-symbol-add-left></div>
                    <div class="punct-field" data-symbol-right-wrap style="display:none;"><label>\u53F3\u4FA7\u7B26\u53F7</label><input data-symbol-add-right></div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" data-symbol-save-add style="background:#000; color:#fff;">\u4FDD\u5B58</button></div>
            `);
            $wrap.find('[data-symbol-add-type]').on('change', function () {
                const isPair = window.jQuery(this).val() === 'pair';
                $wrap.find('[data-symbol-right-wrap]').toggle(isPair);
                $wrap.find('[data-symbol-left-label]').text(isPair ? '\u5DE6\u4FA7\u7B26\u53F7' : '\u8981\u63D2\u5165\u7684\u7B26\u53F7');
            });
            $wrap.find('[data-symbol-save-add]').on('click', () => {
                const type = $wrap.find('[data-symbol-add-type]').val();
                const name = String($wrap.find('[data-symbol-add-name]').val() || '').trim();
                const left = String($wrap.find('[data-symbol-add-left]').val() || '');
                const right = type === 'pair' ? String($wrap.find('[data-symbol-add-right]').val() || '') : '';
                if (!name || !left || (type === 'pair' && !right)) return showModal({ msg: '\u8BF7\u586B\u5B8C\u5FC5\u586B\u9879\u3002', isAlert: true });
                const custom = PunctuationButtons.loadCustomSymbols();
                custom.push({ name, left, right });
                PunctuationButtons.saveCustomSymbols(custom);
                PunctuationButtons.forgetDeletedName(name);
                PunctuationButtons.register();
                renderSymbolEdit();
            });
        };

        const renderSymbolEditForm = (item, oldName) => {
            $wrap.find('[data-symbol-content]').html(`
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-symbol-edit-name value="${PunctuationButtons.escapeHtml(item.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>\u5DE6\u4FA7\u7B26\u53F7</label><input data-symbol-edit-left value="${PunctuationButtons.escapeHtml(item.left)}"></div>
                    <div class="punct-field"><label>\u53F3\u4FA7\u7B26\u53F7 (\u53EF\u7559\u7A7A)</label><input data-symbol-edit-right value="${PunctuationButtons.escapeHtml(item.right || '')}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-symbol-back-edit style="background:#fff; color:#000;">\u8FD4\u56DE</button>
                    <button class="punct-action" data-symbol-save-edit style="background:#000; color:#fff;">\u4FDD\u5B58</button>
                </div>
            `);
            $wrap.find('[data-symbol-back-edit]').on('click', renderSymbolEdit);
            $wrap.find('[data-symbol-save-edit]').on('click', () => {
                const name = String($wrap.find('[data-symbol-edit-name]').val() || '').trim();
                const left = String($wrap.find('[data-symbol-edit-left]').val() || '');
                const right = String($wrap.find('[data-symbol-edit-right]').val() || '');
                if (!name || !left) return showModal({ msg: '\u5FC5\u586B\u9879\u4E0D\u80FD\u4E3A\u7A7A', isAlert: true });
                if (name !== oldName) {
                    PunctuationButtons.rememberDeletedName(oldName);
                    PunctuationButtons.hideButtonByName(oldName);
                    PunctuationButtons.forgetDeletedName(name);
                }
                const custom = PunctuationButtons.loadCustomSymbols();
                const idx = custom.findIndex((item) => item.name === oldName);
                if (idx !== -1) {
                    custom[idx] = { name, left, right };
                    PunctuationButtons.saveCustomSymbols(custom);
                    PunctuationButtons.register();
                    renderSymbolEdit();
                }
            });
        };

        const renderSymbolEdit = () => {
            const all = PunctuationButtons.getVisibleSymbols();
            const defaultNames = new Set(PunctuationButtons.defaultSymbols.map((item) => item.name));
            const rows = all.length ? all.map((item) => {
                const isDefault = defaultNames.has(item.name);
                return `<div class="cmd-row symbol-edit-row" data-name="${PunctuationButtons.escapeHtml(item.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="\u62D6\u52A8\u6392\u5E8F">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${PunctuationButtons.escapeHtml(item.name)}</div></div>
                    <button class="punct-action" data-symbol-edit-one ${isDefault ? 'style="opacity:.45;" title="\u9ED8\u8BA4\u6309\u94AE\u53EA\u80FD\u5220"' : ''}>\u4FEE\u6539</button>
                </div>`;
            }).join('') : `<div style="text-align:center; padding:20px; color:#999;">\u6682\u65E0\u53EF\u7F16\u8F91\u6309\u94AE</div>`;
            $wrap.find('[data-symbol-content]').html(`<div class="cmd-list-wrap" id="symbol-list-wrap">${rows}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-symbol-delete-picked>\u5220\u9664\u9009\u4E2D</button></div>`);
            const $list = $wrap.find('#symbol-list-wrap');
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
            $wrap.find('[data-symbol-edit-one]').on('click', function () {
                const name = window.jQuery(this).closest('.cmd-row').attr('data-name');
                if (defaultNames.has(name)) return showModal({ msg: '\u9ED8\u8BA4\u81EA\u5E26\u6807\u70B9\u4EC5\u652F\u6301\u5220\u9664', isAlert: true });
                const item = PunctuationButtons.loadCustomSymbols().find((i) => i.name === name);
                if (item) renderSymbolEditForm(item, name);
            });
            $wrap.find('[data-symbol-delete-picked]').on('click', () => {
                const picked = $wrap.find('[data-pick]:checked').map(function () { return window.jQuery(this).closest('.cmd-row').attr('data-name'); }).get();
                if (!picked.length) return showModal({ msg: '\u8BF7\u5148\u52FE\u9009', isAlert: true });
                showModal({
                    msg: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${picked.length} \u4E2A\u6807\u70B9\u6309\u94AE\u5417\uFF1F`,
                    onOk: () => { PunctuationButtons.deleteCustomByNames(picked); renderSymbolEdit(); }
                });
            });
        };

        const renderSymbolUI = () => {
            const enabled = PunctuationButtons.loadInlineSymbolBarEnabled();
            $wrap.find('#symbol-inline-toggle').prop('checked', enabled);
            $wrap.find('#symbol-tabs-container .punct-tab').removeClass('active');
            $wrap.find(`#symbol-tabs-container [data-symbol-view="${state.symbolView}"]`).addClass('active');
            if (state.symbolView === 'edit') renderSymbolEdit();
            else renderSymbolAdd();
        };

        const renderMainView = () => {
            const view = state.activeView === 'symbols' ? 'symbols' : 'commands';
            state.activeView = view;
            $wrap.find('[data-main-panel]').hide();
            $wrap.find(`[data-main-panel="${view}"]`).show();
            $wrap.find('.main-view-tab').removeClass('active');
            $wrap.find(`.main-view-tab[data-main-view="${view}"]`).addClass('active');
            if (view === 'symbols') renderSymbolUI();
            else renderUI();
        };

        const resetEditor = () => {
            state.editingId = null;
            state.editorTags = [];
            $wrap.find('#cmd-input-title').val('');
            $wrap.find('#cmd-input-text').val('');
            $wrap.find('#cmd-editor-panel').css('display', 'none');
            $wrap.find('#cmd-toggle-editor-btn').text('\u2795 \u65B0\u5EFA');
            $wrap.find('#cmd-save-btn').text('\u4FDD\u5B58\u6307\u4EE4');
            renderUI();
        };

        $wrap.on('click', '.main-view-tab', function() {
            state.activeView = String($(this).attr('data-main-view')) === 'symbols' ? 'symbols' : 'commands';
            renderMainView();
        });

        $wrap.on('change', '#symbol-inline-toggle', function() {
            PunctuationButtons.saveInlineSymbolBarEnabled(!!this.checked);
            PunctuationButtons.register();
            renderSymbolUI();
        });

        $wrap.on('click', '#symbol-tabs-container [data-symbol-view]', function() {
            state.symbolView = String($(this).attr('data-symbol-view')) === 'edit' ? 'edit' : 'add';
            renderSymbolUI();
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
                $wrap.find('#cmd-save-btn').text('\u4FDD\u5B58\u6307\u4EE4');
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
            if (window.toastr) toastr.success('\u683C\u5F0F\u4FDD\u5B58\u6210\u529F');
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
                showModal({msg: '\u6807\u7B7E\u5DF2\u5B58\u5728', isAlert: true});
            }
        });

        $wrap.on('click', '.tag-edit-btn', function() {
            const oldTag = String($(this).attr('data-tag'));
            showModal({
                msg: `\u5C06\u6807\u7B7E [${oldTag}] \u91CD\u547D\u540D\u4E3A:`,
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
                msg: `\u786E\u5B9A\u8981\u5168\u5C40\u5220\u9664\u6807\u7B7E [${tag}] \u5417\uFF1F\n\u5305\u542B\u6B64\u6807\u7B7E\u7684\u6307\u4EE4\u4E0D\u4F1A\u88AB\u5220\u9664\uFF0C\u53EA\u662F\u5931\u53BB\u8BE5\u6807\u7B7E\u3002`,
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
                $(this).text('\u25B2 \u6536\u8D77'); 
                renderUI(); 
            }
        });

        $wrap.find('#cmd-cancel-btn').on('click', resetEditor);

        $wrap.find('#cmd-save-btn').on('click', () => {
            const text = $wrap.find('#cmd-input-text').val().trim();
            if (!text) return showModal({msg: '\u6307\u4EE4\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\uFF01', isAlert: true});
            
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
                $wrap.find('#cmd-toggle-editor-btn').text('\u25B2 \u6536\u8D77');
                $wrap.find('#cmd-save-btn').text('\u4FDD\u5B58\u4FEE\u6539');
                renderUI();
            }
        });

        $wrap.on('click', '.del-trigger', function(e) {
            e.stopPropagation();
            const id = $(this).closest('.cmd-row').data('id');
            const cmd = PunctuationButtons.loadCommands().find(c => c.id === id);
            if (!cmd) return;
            showModal({
                msg: `\u4F60\u786E\u5B9A\u5220\u9664 [${cmd.category}] \u4E0B\u9762\u7684 1 \u6761\u6307\u4EE4\u5417\uFF1F`,
                onOk: () => {
                    let cmds = PunctuationButtons.loadCommands().filter(c => c.id !== id);
                    PunctuationButtons.saveCommands(cmds); renderUI();
                }
            });
        });

        renderMainView();
        PunctuationButtons.openPopup($wrap, { okButton: '\u5173\u95ED', forceCustom: true });
    },

    openSettings: () => {
        PunctuationButtons.openCommandPanel('symbols');
        return;
        if (!window.jQuery) {
            window.toastr?.error('当前环境缺少 jQuery，无法打开符号设置。');
            return;
        }
        const $ = window.jQuery;
        const $wrap = $(`
            <div class="punct-settings">
                ${PunctuationButtons.baseCss()}
                <div class="punct-head"><div class="punct-title">\u7B26\u53F7\u6309\u94AE\u8BBE\u7F6E</div></div>
                <div class="punct-tabs">
                    <button class="punct-tab active" data-view="add">\u65B0\u589E</button>
                    <button class="punct-tab" data-view="edit">\u7F16\u8F91</button>
                </div>
                <div class="punct-panel" data-content></div>
                ${PunctuationButtons.modalHtml}
            </div>
        `);

        let modalCallback = null;
        const showModal = (options) => {
            $wrap.find('#custom-modal-msg').text(options.msg);
            modalCallback = options.onOk;
            $wrap.find('#custom-modal-input').hide();
            if (options.isAlert) {
                $wrap.find('#custom-modal-ok').css('background', '#222').text('\u6211\u77E5\u9053\u4E86');
                $wrap.find('#custom-modal-cancel').hide();
            } else {
                $wrap.find('#custom-modal-ok').css('background', '#000').text('\u786E\u5B9A\u5220\u9664');
                $wrap.find('#custom-modal-cancel').show();
            }
            $wrap.find('#custom-modal-layer').fadeIn(150);
        };
        $wrap.find('#custom-modal-cancel').on('click', () => { modalCallback = null; $wrap.find('#custom-modal-layer').fadeOut(150); });
        $wrap.find('#custom-modal-ok').on('click', () => { if (modalCallback) modalCallback(); $wrap.find('#custom-modal-layer').fadeOut(150); });

        const renderAdd = () => {
            $wrap.find('[data-content]').html(`
                <div class="punct-field"><label>\u7C7B\u578B</label><select data-add-type><option value="single">\u5355\u72EC\u6807\u70B9</option><option value="pair">\u6210\u5BF9\u6807\u70B9</option></select></div>
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-add-name placeholder="\u663E\u793A\u5728\u6309\u94AE\u4E0A"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label data-left-label>\u8981\u63D2\u5165\u7684\u7B26\u53F7</label><input data-add-left></div>
                    <div class="punct-field" data-right-wrap style="display:none;"><label>\u53F3\u4FA7\u7B26\u53F7</label><input data-add-right></div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" data-save-add style="background:#000; color:#fff;">\u4FDD\u5B58</button></div>
            `);
            $wrap.find('[data-add-type]').on('change', function () {
                const isPair = window.jQuery(this).val() === 'pair';
                $wrap.find('[data-right-wrap]').toggle(isPair);
                $wrap.find('[data-left-label]').text(isPair ? '\u5DE6\u4FA7\u7B26\u53F7' : '\u8981\u63D2\u5165\u7684\u7B26\u53F7');
            });
            $wrap.find('[data-save-add]').on('click', () => {
                const type = $wrap.find('[data-add-type]').val(), name = String($wrap.find('[data-add-name]').val() || '').trim();
                const left = String($wrap.find('[data-add-left]').val() || ''), right = type === 'pair' ? String($wrap.find('[data-add-right]').val() || '') : '';
                if (!name || !left || (type === 'pair' && !right)) return showModal({msg: '\u8BF7\u586B\u5B8C\u5FC5\u586B\u9879\u3002', isAlert:true});
                const custom = PunctuationButtons.loadCustomSymbols(); custom.push({ name, left, right });
                PunctuationButtons.saveCustomSymbols(custom); PunctuationButtons.forgetDeletedName(name);
                PunctuationButtons.register(); $wrap.find('[data-view="edit"]').click();
            });
        };
        const renderEdit = () => {
            const all = PunctuationButtons.getVisibleSymbols(), defaultNames = new Set(PunctuationButtons.defaultSymbols.map(item => item.name));
            const rows = all.length ? all.map((item) => {
                const isDefault = defaultNames.has(item.name);
                return `<div class="cmd-row symbol-edit-row" data-name="${PunctuationButtons.escapeHtml(item.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="\u62D6\u52A8\u6392\u5E8F">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${PunctuationButtons.escapeHtml(item.name)}</div></div>
                    <button class="punct-action" data-edit-one ${isDefault ? 'style="opacity:.45;" title="\u9ED8\u8BA4\u6309\u94AE\u53EA\u80FD\u5220"' : ''}>\u4FEE\u6539</button>
                </div>`;
            }).join('') : `<div style="text-align:center; padding:20px; color:#999;">\u6682\u65E0\u53EF\u7F16\u8F91\u6309\u94AE</div>`;
            $wrap.find('[data-content]').html(`<div class="cmd-list-wrap">${rows}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-delete-picked>\u5220\u9664\u9009\u4E2D</button></div>`);
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
                if (defaultNames.has(name)) return showModal({msg: '\u9ED8\u8BA4\u81EA\u5E26\u6807\u70B9\u4EC5\u652F\u6301\u5220\u9664', isAlert:true});
                const item = PunctuationButtons.loadCustomSymbols().find(i => i.name === name);
                if(item) renderEditForm(item, name);
            });
            
            $wrap.find('[data-delete-picked]').on('click', () => {
                const picked = $wrap.find('[data-pick]:checked').map(function () { return window.jQuery(this).closest('.cmd-row').attr('data-name'); }).get();
                if (!picked.length) return showModal({msg:'\u8BF7\u5148\u52FE\u9009', isAlert:true});
                showModal({
                    msg: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${picked.length} \u4E2A\u6807\u70B9\u6309\u94AE\u5417\uFF1F`,
                    onOk: () => { PunctuationButtons.deleteCustomByNames(picked); renderEdit(); }
                });
            });
        };
        const renderEditForm = (item, oldName) => {
            $wrap.find('[data-content]').html(`
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-edit-name value="${PunctuationButtons.escapeHtml(item.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>\u5DE6\u4FA7\u7B26\u53F7</label><input data-edit-left value="${PunctuationButtons.escapeHtml(item.left)}"></div>
                    <div class="punct-field"><label>\u53F3\u4FA7\u7B26\u53F7 (\u53EF\u7559\u7A7A)</label><input data-edit-right value="${PunctuationButtons.escapeHtml(item.right || '')}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-back-edit style="background:#fff; color:#000;">\u8FD4\u56DE</button>
                    <button class="punct-action" data-save-edit style="background:#000; color:#fff;">\u4FDD\u5B58</button>
                </div>
            `);
            $wrap.find('[data-back-edit]').on('click', renderEdit);
            $wrap.find('[data-save-edit]').on('click', () => {
                const name = String($wrap.find('[data-edit-name]').val() || '').trim(), left = String($wrap.find('[data-edit-left]').val() || ''), right = String($wrap.find('[data-edit-right]').val() || '');
                if (!name || !left) return showModal({msg:'\u5FC5\u586B\u9879\u4E0D\u80FD\u4E3A\u7A7A', isAlert:true});
                if (name !== oldName) { PunctuationButtons.rememberDeletedName(oldName); PunctuationButtons.hideButtonByName(oldName); PunctuationButtons.forgetDeletedName(name); }
                const custom = PunctuationButtons.loadCustomSymbols(), idx = custom.findIndex(i => i.name === oldName);
                if(idx !== -1) { custom[idx] = { name, left, right }; PunctuationButtons.saveCustomSymbols(custom); PunctuationButtons.register(); renderEdit(); }
            });
        };
        $wrap.find('[data-view]').on('click', function () { $wrap.find('.punct-tab').removeClass('active'); $(this).addClass('active'); $(this).data('view') === 'add' ? renderAdd() : renderEdit(); });
        renderAdd(); PunctuationButtons.openPopup($wrap, { okButton: '\u5173\u95ED', forceCustom: true });
    },

    bindButton: (name, handler) => {
        if (PunctuationButtons.boundNames[name]) return;
        window.eventOn(window.getButtonEvent(name), handler);
        PunctuationButtons.boundNames[name] = true;
    },

    register: () => {
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
