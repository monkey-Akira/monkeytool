//#region src/legacy-command-repository.js
var e = {
	肘击指令: {
		prefix: "",
		suffix: ""
	},
	剧情指令: {
		prefix: "",
		suffix: ""
	},
	小剧场指令: {
		prefix: "",
		suffix: ""
	},
	其他指令: {
		prefix: "",
		suffix: ""
	}
}, t = "punctuation_custom_buttons_v1", n = "punctuation_deleted_buttons_v1", r = "punctuation_quick_commands_v3", i = "punctuation_cmd_cats_v3", a = "punctuation_cmd_tags_v3", o = "新增符号", s = "monkey-tools", c = e, l = {
	debugLogged: !1,
	boundNames: {},
	migratedLocalStorage: !1,
	symbolBarObserver: null,
	symbolBarRetryTimer: null,
	symbolBarTextarea: null,
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
		let e = (window.SillyTavern?.getContext?.() || {}).extensionSettings || window.extension_settings || {};
		return window.extension_settings = e, (!e[s] || typeof e[s] != "object") && (e[s] = {}), e[s];
	},
	saveExtensionSettings: () => {
		let e = window.SillyTavern?.getContext?.() || {};
		typeof window.saveSettingsDebounced == "function" && window.saveSettingsDebounced(), typeof e.saveSettingsDebounced == "function" && e.saveSettingsDebounced(), typeof e.saveSettings == "function" && e.saveSettings(), window.dispatchEvent(new CustomEvent("monkey-tools:settings-changed"));
	},
	migrateLocalStorageOnce: () => {
		if (l.migratedLocalStorage) return;
		l.migratedLocalStorage = !0;
		let e = l.getSettingsRoot();
		try {
			if ((!e.categorySettings || typeof e.categorySettings != "object") && Array.isArray(e.categories) && (e.categorySettings = e.categories.reduce((e, t) => (t && t.name && (e[t.name] = {
				prefix: t.prefix || "",
				suffix: t.suffix || ""
			}), e), {})), !Array.isArray(e.deletedSymbolNames) && Array.isArray(e.hiddenSymbolNames) && (e.deletedSymbolNames = e.hiddenSymbolNames.map(String)), Array.isArray(e.commands) && (e.commands = e.commands.map((e) => ({
				...e,
				isFavorite: typeof e.isFavorite == "boolean" ? e.isFavorite : !!e.favorite,
				timestamp: Number(e.timestamp || e.updatedAt || e.createdAt || Date.now())
			}))), !Array.isArray(e.customSymbols)) {
				let n = localStorage.getItem(t), r = n ? JSON.parse(n) : [];
				Array.isArray(r) && (e.customSymbols = r.filter((e) => e && e.name && typeof e.left == "string"));
			}
			if (!Array.isArray(e.deletedSymbolNames)) {
				let t = localStorage.getItem(n), r = t ? JSON.parse(t) : [];
				Array.isArray(r) && (e.deletedSymbolNames = r.map(String));
			}
			if (!Array.isArray(e.commands)) {
				let t = localStorage.getItem(r), n = t ? JSON.parse(t) : [];
				Array.isArray(n) && (e.commands = n);
			}
			if (!Array.isArray(e.globalTags)) {
				let t = localStorage.getItem(a), n = t ? JSON.parse(t) : [];
				Array.isArray(n) && (e.globalTags = n);
			}
			if (!e.categorySettings || typeof e.categorySettings != "object") {
				let t = localStorage.getItem(i), n = t ? JSON.parse(t) : null;
				n && typeof n == "object" && (e.categorySettings = n);
			}
			l.saveExtensionSettings();
		} catch {}
	},
	loadCustomSymbols: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().customSymbols || [];
			return Array.isArray(e) ? e.filter((e) => e && e.name && typeof e.left == "string") : [];
		} catch {
			return [];
		}
	},
	saveCustomSymbols: (e) => {
		l.getSettingsRoot().customSymbols = e, l.saveExtensionSettings();
	},
	loadDeletedNames: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().deletedSymbolNames || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveDeletedNames: (e) => {
		l.getSettingsRoot().deletedSymbolNames = [...new Set(e)], l.saveExtensionSettings();
	},
	rememberDeletedName: (e) => {
		let t = l.loadDeletedNames();
		t.includes(e) || (t.push(e), l.saveDeletedNames(t));
	},
	forgetDeletedName: (e) => l.saveDeletedNames(l.loadDeletedNames().filter((t) => t !== e)),
	loadSymbolOrder: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().symbolOrder || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveSymbolOrder: (e) => {
		l.getSettingsRoot().symbolOrder = [...new Set(e.map(String))], l.saveExtensionSettings();
	},
	applySymbolOrder: (e) => {
		let t = l.loadSymbolOrder();
		if (!t.length) return e;
		let n = new Map(t.map((e, t) => [e, t]));
		return [...e].sort((e, t) => (n.has(e.name) ? n.get(e.name) : 2 ** 53 - 1) - (n.has(t.name) ? n.get(t.name) : 2 ** 53 - 1));
	},
	getAllSymbols: () => l.applySymbolOrder(l.defaultSymbols.concat(l.loadCustomSymbols())),
	getVisibleSymbols: () => {
		let e = new Set(l.loadDeletedNames());
		return l.getAllSymbols().filter((t) => !e.has(t.name));
	},
	generateId: () => "cmd_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
	loadCommands: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().commands || [];
			return Array.isArray(e) ? e.map((e) => ({
				...e,
				isFavorite: typeof e.isFavorite == "boolean" ? e.isFavorite : !!e.favorite,
				timestamp: Number(e.timestamp || e.updatedAt || e.createdAt || Date.now())
			})) : [];
		} catch {
			return [];
		}
	},
	saveCommands: (e) => {
		l.getSettingsRoot().commands = e, l.saveExtensionSettings();
	},
	loadGlobalTags: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().globalTags || [];
			return Array.isArray(e) ? e : [];
		} catch {
			return [];
		}
	},
	saveGlobalTags: (e) => {
		l.getSettingsRoot().globalTags = [...new Set(e)], l.saveExtensionSettings();
	},
	getCombinedTags: () => {
		let e = l.loadCommands(), t = new Set(l.loadGlobalTags());
		return e.forEach((e) => e.tags && e.tags.forEach((e) => t.add(e))), Array.from(t).sort();
	},
	loadCategorySettings: () => {
		l.migrateLocalStorageOnce();
		try {
			let e = l.getSettingsRoot().categorySettings;
			return e && typeof e == "object" ? {
				...c,
				...e
			} : { ...c };
		} catch {
			return c;
		}
	},
	saveCategorySettings: (e) => {
		let t = l.getSettingsRoot();
		t.categorySettings = { ...e }, t.categories = Object.entries(t.categorySettings).map(([e, t]) => ({
			name: e,
			prefix: t?.prefix || "",
			suffix: t?.suffix || ""
		})), l.saveExtensionSettings();
	},
	copyToClipboard: (e, t = !0) => {
		let n = String(e ?? ""), r = () => {
			t && window.toastr && window.toastr.success("指令已复制");
		}, i = () => window.prompt("复制失败，请手动复制：", n);
		function a(e) {
			let t = !1, n = document.createElement("textarea");
			if (n.value = e, n.setAttribute("readonly", ""), n.style.position = "fixed", n.style.top = "-9999px", n.style.left = "-9999px", n.style.opacity = "0", document.body.appendChild(n), /ipad|iphone|ipod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
				let t = document.createRange(), r = window.getSelection();
				t.selectNodeContents(n), r.removeAllRanges(), r.addRange(t), n.focus(), n.setSelectionRange(0, e.length);
			} else n.focus({ preventScroll: !0 }), n.select();
			try {
				t = document.execCommand("copy");
			} catch {
				t = !1;
			} finally {
				document.body.removeChild(n);
			}
			return t;
		}
		if (navigator.clipboard && typeof navigator.clipboard.writeText == "function") {
			navigator.clipboard.writeText(n).then(() => {
				r();
			}).catch(() => {
				a(n) ? r() : i();
			});
			return;
		}
		a(n) ? r() : i();
	},
	hideButtonByName: (e) => {
		l.getDocuments().forEach((t) => {
			t.querySelectorAll(".menu_button.interactable, .menu_button, button").forEach((t) => {
				[
					t.textContent,
					t.innerText,
					t.getAttribute("title"),
					t.getAttribute("aria-label"),
					t.value
				].map((e) => typeof e == "string" ? e.trim() : "").filter(Boolean).includes(e) && t.remove();
			});
		});
	},
	hideDeletedButtons: () => {
		let e = new Set(l.getAllSymbols().map((e) => e.name));
		l.loadDeletedNames().filter((t) => e.has(t)).forEach((e) => l.hideButtonByName(e));
	},
	removeNamesFromObject: (e, t) => {
		if (Array.isArray(e)) {
			let n = !1, r = [];
			return e.forEach((e) => {
				if (e && typeof e == "object") {
					let i = String(e.name ?? e.label ?? e.text ?? e.title ?? "");
					if (t.includes(i)) {
						n = !0;
						return;
					}
					let a = l.removeNamesFromObject(e, t);
					if (a.changed) {
						n = !0, r.push(a.value);
						return;
					}
				} else if (typeof e == "string" && t.includes(e)) {
					n = !0;
					return;
				}
				r.push(e);
			}), {
				value: r,
				changed: n
			};
		}
		if (e && typeof e == "object") {
			let n = !1, r = { ...e };
			return Object.keys(r).forEach((e) => {
				if (t.includes(e)) {
					delete r[e], n = !0;
					return;
				}
				let i = r[e];
				if (i && typeof i == "object") {
					let a = l.removeNamesFromObject(i, t);
					a.changed && (r[e] = a.value, n = !0);
				}
			}), {
				value: r,
				changed: n
			};
		}
		return {
			value: e,
			changed: !1
		};
	},
	cleanupHelperButtonStorage: (e) => {
		let t = e.filter(Boolean);
		t.length && [localStorage, sessionStorage].forEach((e) => {
			for (let n = 0; n < e.length; n++) {
				let r = e.key(n), i = e.getItem(r);
				if (!(!i || !t.some((e) => i.includes(e))) && /script|button|quick|helper|tavern|setting|config/i.test(r + i.slice(0, 200))) try {
					let n = JSON.parse(i), a = l.removeNamesFromObject(n, t);
					a.changed && e.setItem(r, JSON.stringify(a.value));
				} catch {}
			}
		});
	},
	deleteCustomByNames: (e) => {
		let t = [...new Set(e.filter(Boolean))];
		if (!t.length) return;
		let n = new Set(t), r = l.loadCustomSymbols();
		if (l.saveCustomSymbols(r.filter((e) => !n.has(e.name))), t.forEach((e) => {
			l.rememberDeletedName(e), l.hideButtonByName(e);
		}), l.cleanupHelperButtonStorage(t), typeof window < "u" && window.extension_settings) {
			let e = !1;
			[
				"quickReplies",
				"scriptButtons",
				"customButtons",
				"slashCommands"
			].forEach((t) => {
				if (Array.isArray(window.extension_settings[t])) {
					let r = window.extension_settings[t].length;
					window.extension_settings[t] = window.extension_settings[t].filter((e) => {
						let t = String(e.name ?? e.label ?? e.text ?? e.title ?? "");
						return !n.has(t);
					}), window.extension_settings[t].length < r && (e = !0);
				}
			}), e && typeof window.saveSettingsDebounced == "function" && window.saveSettingsDebounced();
		}
		l.register();
	},
	getDocuments: () => {
		let e = [], t = (t) => {
			t && !e.includes(t) && e.push(t);
		};
		t(document);
		try {
			t(window.parent?.document);
		} catch {}
		try {
			t(window.top?.document);
		} catch {}
		return e;
	},
	isEditable: (e) => {
		if (!e) return !1;
		let t = e.tagName ? e.tagName.toLowerCase() : "";
		return t === "textarea" || t === "input" || e.isContentEditable;
	},
	resolveEditable: (e) => e ? l.isEditable(e) ? e : e.querySelector?.("textarea, input, [contenteditable=\"true\"]") || null : null,
	getSendTextarea: () => {
		for (let e of l.getDocuments()) {
			let t = l.resolveEditable(e.querySelector("#send_textarea"));
			if (t) return t;
		}
		return null;
	},
	notifyInput: (e) => {
		window.jQuery && window.jQuery(e).trigger("input").trigger("change"), e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
	},
	getElementValue: (e) => e.isContentEditable ? e.textContent || "" : e.value || "",
	setElementValue: (e, t) => {
		if (e.isContentEditable) {
			e.textContent = t;
			return;
		}
		let n = e.tagName.toLowerCase() === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, r = Object.getOwnPropertyDescriptor(n, "value");
		r && r.set ? r.set.call(e, t) : e.value = t;
	},
	setCursor: (e, t) => (e.focus(), typeof e.setSelectionRange == "function" ? (e.setSelectionRange(t, t), !0) : !1),
	retryCursor: (e) => {
		[
			0,
			30,
			80,
			160
		].forEach((t) => {
			setTimeout(() => {
				let t = l.getSendTextarea();
				t && (l.setCursor(t, e), l.notifyInput(t));
			}, t);
		});
	},
	insertByTextarea: (e) => {
		let t = l.getSendTextarea();
		if (!t) return !1;
		t.focus();
		let n = l.getElementValue(t), r = typeof t.selectionStart == "number" ? t.selectionStart : n.length, i = typeof t.selectionEnd == "number" ? t.selectionEnd : n.length, a = n.slice(r, i), o = e.left, s = e.right || "";
		return l.setElementValue(t, n.slice(0, r) + o + a + s + n.slice(i)), l.notifyInput(t), l.retryCursor(a ? r + o.length + a.length + s.length : r + o.length), !0;
	},
	insertByName: (e) => {
		let t = l.getVisibleSymbols().find((t) => t.name === e);
		t && l.insertByTextarea(t);
	},
	escapeHtml: (e) => String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
	openPopup: (e, t = {}) => {
		let n = window.SillyTavern?.getContext?.() || {}, r = window.SillyTavern?.callGenericPopup || window.callGenericPopup || n.callGenericPopup, i = window.SillyTavern?.callGenericPopup ? window.SillyTavern : window.callGenericPopup ? window : n;
		if (!r || !window.jQuery) {
			window.toastr?.error("无法打开弹窗：当前环境缺少原生弹窗 API 或 jQuery。");
			return;
		}
		let a = { ...t };
		delete a.forceCustom, r.call(i, e, 1, "", a);
	},
	ensureFloatingCss: () => {
		if (document.getElementById("monkey-tools-floating-style")) return;
		let e = document.createElement("style");
		e.id = "monkey-tools-floating-style", e.textContent = "\n            .monkey-tools-floating { position:fixed; left:calc(100vw - 76px); top:45vh; z-index:2147483000; width:64px; height:64px; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif; touch-action:none; user-select:none; overflow:visible; }\n            .monkey-tools-floating-main { width:64px; height:64px; border:none; background:transparent; color:inherit; padding:0; cursor:grab; font-size:44px; line-height:64px; font-weight:700; box-shadow:none; text-shadow:0 3px 12px rgba(0,0,0,.28); }\n            .monkey-tools-floating-main:active { cursor:grabbing; }\n            .monkey-tools-floating-main:hover { background:transparent; }\n            .monkey-tools-floating-menu { display:none; position:absolute; right:72px; top:50%; transform:translateY(-50%); width:max-content; min-width:128px; max-width:min(280px, calc(100vw - 96px)); max-height:48vh; overflow:auto; grid-template-columns:repeat(2,max-content); gap:6px; padding:10px; border:1px solid #d0d7de; border-radius:10px; background:#fff; box-shadow:0 10px 34px rgba(0,0,0,.2); touch-action:auto; }\n            .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:72px; right:auto; }\n            .monkey-tools-floating.open .monkey-tools-floating-menu { display:grid; }\n            .monkey-tools-floating-menu button { white-space:nowrap; border:1px solid #d0d7de; border-radius:8px; background:#fff; color:#24292f; padding:7px 10px; cursor:pointer; font-size:13px; font-weight:700; }\n            .monkey-tools-floating-menu button:hover { background:#f6f8fa; }\n            #monkey-tools-inline-symbols { display:flex; flex-wrap:wrap; gap:4px; padding:0; border:none; background:transparent; box-shadow:none; }\n            #monkey-tools-inline-symbols button { border:1px solid rgba(0,0,0,0.12); border-radius:999px; background:rgba(255,255,255,0.9); color:#2f343a; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:600; line-height:1.2; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }\n            #monkey-tools-inline-symbols button:hover { background:rgba(255,255,255,1); border-color:rgba(0,0,0,0.18); }\n            @media (max-width: 768px) {\n                .monkey-tools-floating { left:calc(100vw - 72px); top:42vh; right:auto; bottom:auto; width:60px; height:60px; }\n                .monkey-tools-floating-main { width:60px; height:60px; padding:0; font-size:42px; line-height:60px; }\n                .monkey-tools-floating-menu { right:68px; min-width:120px; max-width:calc(100vw - 88px); max-height:42vh; grid-template-columns:1fr; }\n                .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:68px; right:auto; }\n            }\n        ", document.head.appendChild(e);
	},
	buildFloatingLauncher: () => {
		if (!document.body) {
			setTimeout(l.buildFloatingLauncher, 300);
			return;
		}
		l.ensureFloatingCss(), document.getElementById("monkey-tools-floating")?.remove();
		let e = document.createElement("div");
		e.id = "monkey-tools-floating", e.className = "monkey-tools-floating";
		let t = l.getSettingsRoot().floatingPosition;
		t && Number.isFinite(t.left) && Number.isFinite(t.top) && (e.style.left = `${Math.max(8, Math.min(window.innerWidth - 72, t.left))}px`, e.style.top = `${Math.max(8, Math.min(window.innerHeight - 72, t.top))}px`);
		let n = document.createElement("button");
		n.type = "button", n.className = "monkey-tools-floating-main", n.textContent = "🐵";
		let r = null, i = (t) => {
			if (t.button !== 0) return;
			let i = e.getBoundingClientRect();
			r = {
				startX: t.clientX,
				startY: t.clientY,
				left: i.left,
				top: i.top,
				dragging: !1
			}, e.style.right = "auto", e.style.bottom = "auto";
			try {
				n.setPointerCapture?.(t.pointerId);
			} catch {}
			window.addEventListener("pointermove", a), window.addEventListener("pointerup", o, { once: !0 }), window.addEventListener("pointercancel", s, { once: !0 }), t.preventDefault();
		}, a = (t) => {
			if (!r) return;
			let i = t.clientX - r.startX, a = t.clientY - r.startY;
			if (!r.dragging && Math.hypot(i, a) < 12) return;
			r.dragging = !0, e.classList.remove("open");
			let o = n.offsetWidth || 64, s = n.offsetHeight || 64, c = Math.max(8, Math.min(window.innerWidth - o - 8, r.left + i)), l = Math.max(8, Math.min(window.innerHeight - s - 8, r.top + a));
			e.style.left = `${c}px`, e.style.top = `${l}px`;
		}, o = () => {
			if (r) {
				if (!r.dragging) e.classList.remove("open"), l.openCommandPanel();
				else {
					let t = e.getBoundingClientRect();
					l.getSettingsRoot().floatingPosition = {
						left: t.left,
						top: t.top
					}, l.saveExtensionSettings();
				}
				r = null, window.removeEventListener("pointermove", a), window.removeEventListener("pointercancel", s);
			}
		}, s = () => {
			r = null, window.removeEventListener("pointermove", a);
		};
		n.addEventListener("pointerdown", i), e.append(n), document.body.appendChild(e);
	},
	buildInlineSymbolBar: () => {
		l.stopInlineSymbolBarTracking(), document.getElementById("monkey-tools-inline-symbols")?.remove();
		let e = l.getSendTextarea();
		if (!e) {
			l.scheduleInlineSymbolBarRetry();
			return;
		}
		l.symbolBarTextarea = e;
		let t = document.createElement("div");
		t.id = "monkey-tools-inline-symbols", l.getVisibleSymbols().forEach((e) => {
			let n = document.createElement("button");
			n.type = "button", n.textContent = e.name, n.title = `插入 ${e.name}`, n.dataset.symbolName = e.name, n.style.cssText = "border:1px solid rgba(0,0,0,0.12);border-radius:999px;background:rgba(255,255,255,0.9);color:#2f343a;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:600;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);", t.appendChild(n);
		});
		let n = document.createElement("button");
		n.type = "button", n.textContent = o, n.title = o, n.dataset.openSettings = "1", n.style.cssText = "border:1px solid rgba(0,0,0,0.18);border-radius:999px;background:rgba(255,255,255,0.96);color:#111;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);", t.appendChild(n), t.addEventListener("pointerdown", (e) => {
			if (e.target.closest("button[data-open-settings]")) {
				e.preventDefault(), e.stopPropagation(), l.openSettings();
				return;
			}
			let t = e.target.closest("button[data-symbol-name]");
			t && (e.preventDefault(), e.stopPropagation(), l.insertByName(t.dataset.symbolName));
		}, !0), document.body.appendChild(t), l.positionInlineSymbolBar(), l.watchInlineSymbolBarHost();
	},
	positionInlineSymbolBar: () => {
		let e = document.getElementById("monkey-tools-inline-symbols"), t = l.getSendTextarea();
		if (!e || !t) return;
		let n = t.getBoundingClientRect(), r = Math.max(220, Math.min(n.width, window.innerWidth - 24)), i = Math.max(12, Math.min(n.left, window.innerWidth - r - 12)), a = Math.max(8, n.top - e.offsetHeight - 8);
		e.style.cssText = `position:fixed;left:${i}px;top:${a}px;width:${r}px;z-index:2147482500;display:flex;flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
	},
	scheduleInlineSymbolBarRetry: () => {
		l.symbolBarRetryTimer ||= window.setTimeout(() => {
			l.symbolBarRetryTimer = null, l.buildInlineSymbolBar();
		}, 600);
	},
	stopInlineSymbolBarTracking: () => {
		l.symbolBarRetryTimer &&= (clearTimeout(l.symbolBarRetryTimer), null);
	},
	watchInlineSymbolBarHost: () => {
		typeof MutationObserver > "u" || (l.symbolBarObserver && l.symbolBarObserver.disconnect(), l.symbolBarObserver = new MutationObserver(() => {
			let e = l.getSendTextarea();
			if (!e) {
				document.getElementById("monkey-tools-inline-symbols")?.remove(), l.scheduleInlineSymbolBarRetry();
				return;
			}
			if (e !== l.symbolBarTextarea) {
				l.buildInlineSymbolBar();
				return;
			}
			l.positionInlineSymbolBar();
		}), l.symbolBarObserver.observe(document.body, {
			childList: !0,
			subtree: !0
		}));
	},
	baseCss: () => "\n        <style>\n            @font-face { font-family:\"fugu\"; src:url(\"https://files.catbox.moe/5bdcr7.ttf\") format(\"truetype\"); font-display:swap; font-weight:normal; font-style:normal; }\n            :root { --monkey-tools-font:\"fugu\", var(--mainFontFamily), \"Microsoft YaHei\", sans-serif; --monkey-tools-shadow-color:var(--SmartThemeShadowColor, #80808075); --monkey-tools-shadow-width:var(--shadowWidth, 1); }\n            .punct-settings *, .punct-settings *::before, .punct-settings *::after { box-sizing: border-box; }\n            .popup:has(.punct-settings) { background:#fff !important; border:2px solid #000 !important; border-radius:0 !important; outline:1.5px solid #000 !important; outline-offset:-6px !important; box-shadow:3px 3px 3px #80808075 !important; }\n            .popup:has(.punct-settings) .popup-content, .popup:has(.punct-settings) .popup-body { background:#fff !important; border-radius:0 !important; }\n            .punct-settings { position:relative; overflow-x:hidden; overflow-y:auto; max-height:85vh; color:#000; padding:16px; width:100%; min-width:280px; max-width:620px; font-family:var(--monkey-tools-font); -webkit-overflow-scrolling: touch; background:#fff; text-shadow:0 0 calc(var(--monkey-tools-shadow-width) * 1px) var(--monkey-tools-shadow-color); }\n            .punct-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap: wrap; gap: 8px; }\n            .punct-title { font-size:18px; font-weight:800; letter-spacing:0; background:#fff; border-left:2px solid #000; outline:1.5px solid #000; outline-offset:-7px; padding:10px 18px; }\n            \n            .punct-tabs { display:flex; gap:6px; margin-bottom:16px; background:#f0f0f0; padding:5px; border:1.5px dashed #000; border-radius:0; flex-shrink: 0; }\n            .punct-tab { flex:1; border:1.5px solid transparent; background:transparent; color:#555; border-radius:0; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; }\n            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            \n            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:2px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:inherit; }\n            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }\n            .punct-action:active { transform:translateY(0); box-shadow:none; }\n            .punct-action.active { background:#e7e7e7; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }\n            \n            .punct-panel { border:1.5px solid #000; border-radius:0; padding:16px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; }\n            .punct-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; width: 100%; }\n            .punct-field label { font-size:12px; font-weight:700; opacity:1; color:#000; }\n            .punct-field input, .punct-field select, .punct-field textarea, .cmd-search { border:1.5px dashed #000; border-radius:2px; padding:10px 12px; background:#f0f0f0; transition:all 0.2s; outline:none; font-family:inherit; color:#000; width: 100%; text-shadow:inherit; }\n            .punct-field input:focus, .punct-field textarea:focus, .punct-field select:focus, .cmd-search:focus { background:#fff; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            \n            .cmd-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; flex-shrink: 0; }\n            .cmd-search { flex:1; min-width: 150px; height:38px; }\n            .cmd-filter-bar { display:flex; flex-wrap:wrap; gap:6px; flex:1; }\n            .cmd-tag { font-size:12px; padding:4px 12px; border-radius:2px; background:#fff; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; font-weight:700; border:1.5px dashed #000; text-shadow:inherit; }\n            .cmd-tag:hover { background:#f0f0f0; color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag.active { background:#000; color:#fff; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }\n            \n            .cmd-editor-wrap { border:1.5px solid #000; background:#fff; padding:16px; border-radius:0; margin-bottom:16px; display:none; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag-editor { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; align-items:center; }\n            .cmd-tag-add { border:1.5px dashed #000; background:#fff; display:flex; align-items:center; padding:2px 8px; border-radius:2px; transition:border-color 0.2s; }\n            .cmd-tag-add:focus-within { border-color:#222; }\n            .cmd-tag-add input { border:none; background:transparent; width:70px; outline:none; font-size:12px; padding:4px 0; font-family:inherit; text-shadow:inherit; }\n            \n            .cmd-list-wrap { max-height:50vh; overflow-y:auto; padding-right:8px; display:flex; flex-direction:column; gap:12px; scrollbar-width: none; scrollbar-color: transparent transparent; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }\n            .cmd-list-wrap::-webkit-scrollbar { width:6px; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb { background:transparent; border-radius:0; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb:hover { background:transparent; }\n            \n            .cmd-row { border:1.5px solid #000; border-radius:0; padding:14px; background:#fff; cursor:pointer; display:flex; gap:12px; transition:all 0.25s; box-shadow:1px 2px 5px #a7a7a7; position:relative; overflow:hidden; align-items: center; flex-shrink: 0; }\n            .cmd-row:hover { border-color:#000; box-shadow:3px 3px 3px #80808075; transform:translateY(-1px); }\n            .cmd-row.favorite { border-left:4px solid #000; }\n            .cmd-row.dragging { opacity:.55; border-style:dashed; box-shadow:none; transform:none; }\n            .drag-handle { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:2px; color:#000; background:#f0f0f0; border:1.5px dashed #000; cursor:grab; flex-shrink:0; font-weight:900; line-height:1; touch-action:none; }\n            .drag-handle:active { cursor:grabbing; }\n            .symbol-edit-row { touch-action:auto; }\n            .symbol-edit-row.reorder-active { touch-action:none; }\n            @media (hover:none), (pointer:coarse) {\n                .drag-handle { width:42px; height:42px; font-size:18px; }\n                .symbol-edit-row { min-height:58px; padding:8px 10px !important; gap:10px; }\n                .symbol-edit-row input[type=\"checkbox\"] { width:22px; height:22px; }\n            }\n             \n            .cmd-content { flex:1; display:flex; flex-direction:column; gap:6px; min-width: 0; }\n            .cmd-title { font-weight:800; font-size:15px; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n            .cmd-text { font-size:12px; color:#333; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-all; }\n            .cmd-tags-display { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }\n            .cmd-tag-mini { font-size:11px; background:#f0f0f0; color:#000; padding:2px 8px; border-radius:2px; font-weight:700; white-space: nowrap; border:1px dashed #000; }\n            \n            .cmd-actions { display:flex; flex-direction:column; gap:10px; align-items:center; justify-content:center; border-left:1.5px dashed #000; padding-left:12px; flex-shrink:0; }\n            .cmd-btn-icon { cursor:pointer; font-size:16px; opacity:0.5; transition:all 0.2s; user-select:none; }\n            .cmd-btn-icon:hover { opacity:1; transform:scale(1.1); }\n            .cmd-btn-heart { color:#000; opacity:1; }\n            \n            .tag-manage-btn { background:#fff; border:1.5px solid #000; color:#000; cursor:pointer; font-size:12px; font-weight:700; padding:6px 12px; border-radius:2px; white-space:nowrap; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }\n            .tag-manage-btn:hover { background:#f0f0f0; color:#000; box-shadow:3px 3px 3px #80808075; }\n            .tag-manage-btn.back-mode { width:34px; height:34px; padding:0; border-radius:2px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; color:#000; }\n            .tag-manage-btn.back-mode:hover { transform:scale(1.04); box-shadow:3px 3px 3px #80808075; background:#f0f0f0; }\n\n            .cmd-modal-overlay { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(255,255,255,0.72); backdrop-filter:none; -webkit-backdrop-filter:none; z-index:9999; border-radius:0; display:none; }\n            .cmd-confirm-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:0; padding:24px; box-shadow:3px 3px 3px #80808075; text-align:center; width:85%; max-width:320px; box-sizing:border-box; outline:1.5px solid #000; outline-offset:-6px; }\n            .cmd-confirm-text { font-size:15px; font-weight:700; color:#000; margin-bottom:20px; line-height:1.6; word-break:break-all; white-space:pre-wrap; }\n            .cmd-confirm-actions { display:flex; justify-content:center; gap:12px; }\n\n            .cmd-quick-inserts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }\n            .cmd-quick-btn { font-size:12px; font-weight:700; padding:4px 8px; border-radius:2px; background:#fff; border:1.5px dashed #000; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; text-shadow:inherit; }\n            .cmd-quick-btn:hover { background:#f0f0f0; color:#000; border-color:#000; transform:translateY(-1px); box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-quick-btn:active { transform:scale(0.95); }\n        </style>\n    ",
	modalHtml: "\n        <div class=\"cmd-modal-overlay\" id=\"custom-modal-layer\">\n            <div class=\"cmd-confirm-box\">\n                <div class=\"cmd-confirm-text\" id=\"custom-modal-msg\"></div>\n                <input type=\"text\" id=\"custom-modal-input\" style=\"display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;\">\n                <div class=\"cmd-confirm-actions\">\n                    <button class=\"punct-action\" id=\"custom-modal-cancel\" style=\"background:#fff; color:#000;\">取消</button>\n                    <button class=\"punct-action\" id=\"custom-modal-ok\" style=\"background:#000; color:#fff;\">确定</button>\n                </div>\n            </div>\n        </div>\n    ",
	openCommandPanel: () => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开指令面板。");
			return;
		}
		let e = window.jQuery, t = {
			activeTab: Object.keys(c)[0],
			searchText: "",
			filterTags: [],
			editingId: null,
			editorTags: [],
			isTagManageMode: !1
		}, n = [
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
			...l.getVisibleSymbols()
		].map((e) => `<span class="cmd-quick-btn" data-left="${l.escapeHtml(e.left)}" data-right="${l.escapeHtml(e.right || "")}">${l.escapeHtml(e.name)}</span>`).join(""), r = e(`
            <div class="punct-settings">
                ${l.baseCss()}
                <div class="punct-head">
                    <div class="punct-title">\u5E38\u7528\u6307\u4EE4\u5E93</div>
                    <div style="display:flex; gap:8px;">
                        <button class="punct-action" id="cmd-import-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5408\u5E76\u5BFC\u5165JSON\u6587\u4EF6">\uD83D\uDCE5 \u5BFC\u5165</button>
                        <button class="punct-action" id="cmd-export-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5BFC\u51FA\u6240\u6709\u6570\u636E\u5907\u4EFD">\uD83D\uDCE4 \u5BFC\u51FA</button>
                        <input type="file" id="cmd-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                
                <div class="punct-tabs" id="cmd-tabs-container">
                    ${Object.keys(c).map((e) => `<button class="punct-tab ${t.activeTab === e ? "active" : ""}" data-cat="${e}">${e}</button>`).join("")}
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
                        <div class="cmd-quick-inserts">${n}</div>
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
                ${l.modalHtml}
            </div>
        `), i = null, a = !1, o = (e) => {
			r.find("#custom-modal-msg").text(e.msg), i = e.onOk, a = !!e.prompt;
			let t = r.find("#custom-modal-input");
			a ? (t.val(e.defaultVal || "").show(), r.find("#custom-modal-ok").css("background", "#222").text("确定")) : (t.hide(), e.isAlert ? r.find("#custom-modal-ok").css("background", "#222").text("我知道了") : r.find("#custom-modal-ok").css("background", "#000").text("确定操作")), e.isAlert ? r.find("#custom-modal-cancel").hide() : r.find("#custom-modal-cancel").show(), r.find("#custom-modal-layer").fadeIn(150), a && setTimeout(() => t.focus(), 160);
		};
		r.find("#custom-modal-cancel").on("click", () => {
			i = null, r.find("#custom-modal-layer").fadeOut(150);
		}), r.find("#custom-modal-ok").on("click", () => {
			let e = a ? r.find("#custom-modal-input").val() : !0;
			i && i(e), r.find("#custom-modal-layer").fadeOut(150);
		}), r.find("#cmd-export-btn").on("click", () => {
			let e = {
				version: 1,
				commands: l.loadCommands(),
				categories: l.loadCategorySettings(),
				tags: l.loadGlobalTags(),
				symbols: l.loadCustomSymbols()
			}, t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), n = URL.createObjectURL(t), r = document.createElement("a");
			r.href = n, r.download = `sillytavern_commands_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(n), window.toastr && toastr.success("数据导出成功！");
		}), r.find("#cmd-import-btn").on("click", () => {
			r.find("#cmd-import-file").click();
		}), r.find("#cmd-import-file").on("change", function(e) {
			let t = e.target.files[0];
			if (!t) return;
			let n = new FileReader();
			n.onload = function(e) {
				try {
					let t = JSON.parse(e.target.result);
					if (!t.commands && !t.categories && !t.symbols && !t.tags) throw Error("Invalid Format");
					o({
						msg: "即将导入备份数据！\n为防止误删，导入的数据将与现有数据进行【合并】。\n是否继续？",
						onOk: () => {
							let e = Array.isArray(t.commands) ? t.commands : [], n = l.loadCommands(), r = 0;
							if (e.forEach((e) => {
								n.find((t) => t.title === e.title && t.text === e.text) || (e.id = l.generateId(), n.push(e), r++);
							}), l.saveCommands(n), t.categories) {
								let e = l.loadCategorySettings();
								Object.keys(t.categories).forEach((n) => e[n] = t.categories[n]), l.saveCategorySettings(e);
							}
							if (Array.isArray(t.tags)) {
								let e = l.loadGlobalTags();
								t.tags.forEach((t) => {
									e.includes(t) || e.push(t);
								}), l.saveGlobalTags(e);
							}
							if (Array.isArray(t.symbols)) {
								let e = l.loadCustomSymbols();
								t.symbols.forEach((t) => {
									!e.find((e) => e.name === t.name) && t.name && typeof t.left == "string" && e.push(t);
								}), l.saveCustomSymbols(e), l.register();
							}
							u(), window.toastr && toastr.success(`\u5BFC\u5165\u6210\u529F\uFF01\u5171\u65B0\u589E ${r} \u6761\u6307\u4EE4\u3002`);
						}
					});
				} catch {
					o({
						msg: "读取失败：文件格式不正确或已损坏！",
						isAlert: !0
					});
				}
				r.find("#cmd-import-file").val("");
			}, n.readAsText(t);
		});
		let s = null;
		r.on("focus", "#cmd-input-title, #cmd-input-text, #cmd-cat-prefix, #cmd-cat-suffix", function() {
			s = this;
		}), r.on("click", ".cmd-quick-btn", function(t) {
			t.preventDefault();
			let n = e(this).attr("data-left") || "", i = e(this).attr("data-right") || "";
			s ||= r.find("#cmd-input-text")[0], s.focus();
			let a = s.selectionStart || 0, o = s.selectionEnd || 0, c = s.value || "", l = c.slice(a, o), u = c.slice(0, a) + n + l + i + c.slice(o);
			s.value = u, e(s).trigger("input");
			let d = a + n.length + l.length;
			s.setSelectionRange(d, d);
		});
		let u = () => {
			let e = l.loadCommands(), n = l.getCombinedTags();
			if (t.isTagManageMode) {
				r.find(".cmd-toolbar, #cmd-filter-container, #cmd-editor-panel, #cmd-cat-panel").hide(), r.find("#cmd-manage-tags-btn").html("<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" stroke=\"currentColor\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 12H5M12 19l-7-7 7-7\"/></svg>").addClass("back-mode").attr("title", "返回列表");
				let e = "\n                    <div style=\"display:flex; gap:8px; margin-bottom:12px;\">\n                        <input type=\"text\" id=\"manage-new-tag-input\" class=\"cmd-search\" placeholder=\"输入新标签名称...\" style=\"height:38px;\">\n                        <button class=\"punct-action\" id=\"manage-add-tag-btn\" style=\"height:38px; background:#000; color:#fff; padding:0 16px;\">新增标签</button>\n                    </div>\n                ";
				if (n.length === 0) r.find("#cmd-list-container").html(e + "<div style=\"text-align:center; padding:30px; color:#999;\">当前没有任何标签</div>");
				else {
					let t = n.map((e) => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${l.escapeHtml(e)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${l.escapeHtml(e)}" style="padding:6px 12px; font-size:12px;">\u91CD\u547D\u540D</button>
                                <button class="punct-action tag-del-btn" data-tag="${l.escapeHtml(e)}" style="padding:6px 12px; font-size:12px; color:#000;">\u5220\u9664</button>
                            </div>
                        </div>
                    `).join("");
					r.find("#cmd-list-container").html(e + t);
				}
				return;
			}
			r.find(".cmd-toolbar, #cmd-filter-container").show(), r.find("#cmd-manage-tags-btn").html("管理标签").removeClass("back-mode").removeAttr("title"), r.find("#cmd-toggle-cat-btn").hasClass("active") ? (r.find("#cmd-cat-panel").css("display", "block"), r.find("#current-cat-name").text(t.activeTab)) : r.find("#cmd-cat-panel").css("display", "none"), t.editingId || r.find("#cmd-toggle-editor-btn").text().includes("收起") ? r.find("#cmd-editor-panel").css("display", "block") : r.find("#cmd-editor-panel").css("display", "none"), r.find("#cmd-filter-container").html(n.map((e) => `<div class="cmd-tag ${t.filterTags.includes(e) ? "active" : ""}" data-tag="${l.escapeHtml(e)}">${l.escapeHtml(e)}</div>`).join("") + (t.filterTags.length > 0 ? "<div class=\"cmd-tag active\" style=\"background:#000;\" id=\"cmd-clear-filter\">✖ 清除筛选</div>" : ""));
			let i = Array.from(new Set([...n, ...t.editorTags])).sort();
			r.find("#cmd-editor-tags").html(i.map((e) => `<div class="cmd-tag ${t.editorTags.includes(e) ? "active" : ""} editor-tag-btn" data-tag="${l.escapeHtml(e)}">${l.escapeHtml(e)}</div>`).join("") + "<div class=\"cmd-tag-add\"><input type=\"text\" id=\"cmd-new-tag-input\" placeholder=\"+新标签\"><button id=\"cmd-add-tag-btn\" style=\"border:none;background:none;cursor:pointer;font-weight:bold;color:#666;\">✔</button></div>");
			let a = e.filter((e) => e.category === t.activeTab);
			if (t.filterTags.length > 0 && (a = a.filter((e) => e.tags && t.filterTags.every((t) => e.tags.includes(t)))), t.searchText) {
				let e = t.searchText.toLowerCase();
				a = a.filter((t) => t.title && t.title.toLowerCase().includes(e) || t.text.toLowerCase().includes(e) || t.tags && t.tags.some((t) => t.toLowerCase().includes(e)));
			}
			if (a.sort((e, t) => e.isFavorite === t.isFavorite ? t.timestamp - e.timestamp : e.isFavorite ? -1 : 1), a.length === 0) r.find("#cmd-list-container").html("<div style=\"text-align:center; padding:40px; color:#999;\">没有找到指令</div>");
			else {
				let e = a.map((e) => {
					let t = e.title || e.text.substring(0, 10);
					return `
                    <div class="cmd-row ${e.isFavorite ? "favorite" : ""}" data-id="${e.id}">
                        <div class="cmd-content copy-trigger">
                            <div class="cmd-title">${l.escapeHtml(t)}</div>
                            <div class="cmd-text">${l.escapeHtml(e.text)}</div>
                            ${e.tags && e.tags.length ? `<div class="cmd-tags-display">${e.tags.map((e) => `<span class="cmd-tag-mini">${l.escapeHtml(e)}</span>`).join("")}</div>` : ""}
                        </div>
                        <div class="cmd-actions">
                            <div class="cmd-btn-icon ${e.isFavorite ? "cmd-btn-heart" : ""} fav-trigger" title="${e.isFavorite ? "取消常用" : "设为常用"}">${e.isFavorite ? "❤" : "♡"}</div>
                            <div class="cmd-btn-icon edit-trigger" title="\u4FEE\u6539">\u270E</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="\u5220\u9664">\u2716</div>
                        </div>
                    </div>
                `;
				});
				r.find("#cmd-list-container").html(e.join(""));
			}
		}, d = () => {
			t.editingId = null, t.editorTags = [], r.find("#cmd-input-title").val(""), r.find("#cmd-input-text").val(""), r.find("#cmd-editor-panel").css("display", "none"), r.find("#cmd-toggle-editor-btn").text("➕ 新建"), r.find("#cmd-save-btn").text("保存指令"), u();
		};
		r.on("click", ".punct-tab", function() {
			if (r.find(".punct-tab").removeClass("active"), e(this).addClass("active"), t.activeTab = e(this).data("cat"), t.filterTags = [], t.searchText = "", r.find("#cmd-search-input").val(""), t.isTagManageMode = !1, r.find("#cmd-toggle-cat-btn").hasClass("active")) {
				let e = l.loadCategorySettings()[t.activeTab] || {
					prefix: "",
					suffix: ""
				};
				r.find("#cmd-cat-prefix").val(e.prefix), r.find("#cmd-cat-suffix").val(e.suffix);
			}
			t.editingId && (t.editingId = null, r.find("#cmd-save-btn").text("保存指令")), u();
		}), r.on("click", "#cmd-toggle-cat-btn", function() {
			if (e(this).hasClass("active")) e(this).removeClass("active"), u();
			else {
				d(), e(this).addClass("active");
				let n = l.loadCategorySettings()[t.activeTab] || {
					prefix: "",
					suffix: ""
				};
				r.find("#cmd-cat-prefix").val(n.prefix), r.find("#cmd-cat-suffix").val(n.suffix), u();
			}
		}), r.find("#cmd-cat-cancel-btn").on("click", () => {
			r.find("#cmd-toggle-cat-btn").removeClass("active"), u();
		}), r.find("#cmd-cat-save-btn").on("click", () => {
			let e = r.find("#cmd-cat-prefix").val(), n = r.find("#cmd-cat-suffix").val(), i = l.loadCategorySettings();
			i[t.activeTab] || (i[t.activeTab] = {}), i[t.activeTab].prefix = e, i[t.activeTab].suffix = n, l.saveCategorySettings(i), u(), window.toastr && toastr.success("格式保存成功");
		}), r.on("click", "#cmd-manage-tags-btn", () => {
			t.isTagManageMode = !t.isTagManageMode, t.isTagManageMode && (d(), r.find("#cmd-toggle-cat-btn").removeClass("active")), u();
		}), r.on("click", "#manage-add-tag-btn", function() {
			let e = r.find("#manage-new-tag-input").val().trim();
			if (!e) return;
			let t = l.loadGlobalTags();
			t.includes(e) ? o({
				msg: "标签已存在",
				isAlert: !0
			}) : (t.push(e), l.saveGlobalTags(t), u(), setTimeout(() => r.find("#manage-new-tag-input").focus(), 10));
		}), r.on("click", ".tag-edit-btn", function() {
			let n = String(e(this).attr("data-tag"));
			o({
				msg: `\u5C06\u6807\u7B7E [${n}] \u91CD\u547D\u540D\u4E3A:`,
				prompt: !0,
				defaultVal: n,
				onOk: (e) => {
					if (e && e.trim() && e.trim() !== n) {
						let r = e.trim(), i = l.loadCommands();
						i.forEach((e) => {
							e.tags && e.tags.includes(n) && (e.tags = e.tags.map((e) => e === n ? r : e));
						}), l.saveCommands(i);
						let a = l.loadGlobalTags();
						a.includes(n) && (a[a.indexOf(n)] = r, l.saveGlobalTags(a)), t.filterTags.includes(n) && (t.filterTags = t.filterTags.map((e) => e === n ? r : e)), u();
					}
				}
			});
		}), r.on("click", ".tag-del-btn", function() {
			let n = String(e(this).attr("data-tag"));
			o({
				msg: `\u786E\u5B9A\u8981\u5168\u5C40\u5220\u9664\u6807\u7B7E [${n}] \u5417\uFF1F\n\u5305\u542B\u6B64\u6807\u7B7E\u7684\u6307\u4EE4\u4E0D\u4F1A\u88AB\u5220\u9664\uFF0C\u53EA\u662F\u5931\u53BB\u8BE5\u6807\u7B7E\u3002`,
				onOk: () => {
					let e = l.loadCommands();
					e.forEach((e) => {
						e.tags && e.tags.includes(n) && (e.tags = e.tags.filter((e) => e !== n));
					}), l.saveCommands(e);
					let r = l.loadGlobalTags();
					r = r.filter((e) => e !== n), l.saveGlobalTags(r), t.filterTags.includes(n) && (t.filterTags = t.filterTags.filter((e) => e !== n)), u();
				}
			});
		}), r.on("click", ".editor-tag-btn", function() {
			let n = String(e(this).attr("data-tag"));
			t.editorTags.includes(n) ? t.editorTags = t.editorTags.filter((e) => e !== n) : t.editorTags.push(n), u();
		}), r.on("click", "#cmd-add-tag-btn", function(e) {
			e.preventDefault();
			let n = r.find("#cmd-new-tag-input").val().trim();
			if (n && !t.editorTags.includes(n)) {
				t.editorTags.push(n);
				let e = l.loadGlobalTags();
				e.includes(n) || (e.push(n), l.saveGlobalTags(e));
			}
			u(), setTimeout(() => r.find("#cmd-new-tag-input").focus(), 10);
		}), r.find("#cmd-search-input").on("input", function() {
			t.searchText = e(this).val().trim(), u();
		}), r.on("click", ".cmd-filter-bar .cmd-tag", function() {
			if (e(this).attr("id") === "cmd-clear-filter") t.filterTags = [];
			else {
				let n = String(e(this).attr("data-tag"));
				t.filterTags.includes(n) ? t.filterTags = t.filterTags.filter((e) => e !== n) : t.filterTags.push(n);
			}
			u();
		}), r.on("click", "#cmd-toggle-editor-btn", function() {
			let t = r.find("#cmd-editor-panel");
			t.css("display") === "none" ? (d(), r.find("#cmd-toggle-cat-btn").removeClass("active"), t.css("display", "block"), e(this).text("▲ 收起"), u()) : d();
		}), r.find("#cmd-cancel-btn").on("click", d), r.find("#cmd-save-btn").on("click", () => {
			let e = r.find("#cmd-input-text").val().trim();
			if (!e) return o({
				msg: "指令内容不能为空！",
				isAlert: !0
			});
			let n = r.find("#cmd-input-title").val().trim() || e.substring(0, 10), i = l.loadCommands();
			if (t.editingId) {
				let r = i.findIndex((e) => e.id === t.editingId);
				r !== -1 && (i[r].title = n, i[r].text = e, i[r].tags = [...t.editorTags]);
			} else i.push({
				id: l.generateId(),
				category: t.activeTab,
				title: n,
				text: e,
				isFavorite: !1,
				tags: [...t.editorTags],
				timestamp: Date.now()
			});
			l.saveCommands(i), d();
		}), r.on("click", ".copy-trigger", function() {
			let t = e(this).closest(".cmd-row").data("id"), n = l.loadCommands().find((e) => e.id === t);
			if (n) {
				let e = l.loadCategorySettings()[n.category] || {
					prefix: "",
					suffix: ""
				};
				l.copyToClipboard((e.prefix || "") + n.text + (e.suffix || ""));
			}
		}), r.on("click", ".fav-trigger", function(t) {
			t.stopPropagation();
			let n = e(this).closest(".cmd-row").data("id"), r = l.loadCommands(), i = r.findIndex((e) => e.id === n);
			i !== -1 && (r[i].isFavorite = !r[i].isFavorite, l.saveCommands(r), u());
		}), r.on("click", ".edit-trigger", function(n) {
			n.stopPropagation();
			let i = e(this).closest(".cmd-row").data("id"), a = l.loadCommands().find((e) => e.id === i);
			a && (t.editingId = a.id, t.editorTags = [...a.tags || []], r.find("#cmd-input-title").val(a.title || ""), r.find("#cmd-input-text").val(a.text), r.find("#cmd-toggle-cat-btn").removeClass("active"), r.find("#cmd-editor-panel").css("display", "block"), r.find("#cmd-toggle-editor-btn").text("▲ 收起"), r.find("#cmd-save-btn").text("保存修改"), u());
		}), r.on("click", ".del-trigger", function(t) {
			t.stopPropagation();
			let n = e(this).closest(".cmd-row").data("id"), r = l.loadCommands().find((e) => e.id === n);
			r && o({
				msg: `\u4F60\u786E\u5B9A\u5220\u9664 [${r.category}] \u4E0B\u9762\u7684 1 \u6761\u6307\u4EE4\u5417\uFF1F`,
				onOk: () => {
					let e = l.loadCommands().filter((e) => e.id !== n);
					l.saveCommands(e), u();
				}
			});
		}), u(), l.openPopup(r, {
			okButton: "关闭",
			forceCustom: !0
		});
	},
	openSettings: () => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开符号设置。");
			return;
		}
		let e = window.jQuery, t = e(`
            <div class="punct-settings">
                ${l.baseCss()}
                <div class="punct-head"><div class="punct-title">\u7B26\u53F7\u6309\u94AE\u8BBE\u7F6E</div></div>
                <div class="punct-tabs">
                    <button class="punct-tab active" data-view="add">\u65B0\u589E</button>
                    <button class="punct-tab" data-view="edit">\u7F16\u8F91</button>
                </div>
                <div class="punct-panel" data-content></div>
                ${l.modalHtml}
            </div>
        `), n = null, r = (e) => {
			t.find("#custom-modal-msg").text(e.msg), n = e.onOk, t.find("#custom-modal-input").hide(), e.isAlert ? (t.find("#custom-modal-ok").css("background", "#222").text("我知道了"), t.find("#custom-modal-cancel").hide()) : (t.find("#custom-modal-ok").css("background", "#000").text("确定删除"), t.find("#custom-modal-cancel").show()), t.find("#custom-modal-layer").fadeIn(150);
		};
		t.find("#custom-modal-cancel").on("click", () => {
			n = null, t.find("#custom-modal-layer").fadeOut(150);
		}), t.find("#custom-modal-ok").on("click", () => {
			n && n(), t.find("#custom-modal-layer").fadeOut(150);
		});
		let i = () => {
			t.find("[data-content]").html("\n                <div class=\"punct-field\"><label>类型</label><select data-add-type><option value=\"single\">单独标点</option><option value=\"pair\">成对标点</option></select></div>\n                <div class=\"punct-field\"><label>按钮名称</label><input data-add-name placeholder=\"显示在按钮上\"></div>\n                <div style=\"display:grid; grid-template-columns:1fr 1fr; gap:12px;\">\n                    <div class=\"punct-field\"><label data-left-label>要插入的符号</label><input data-add-left></div>\n                    <div class=\"punct-field\" data-right-wrap style=\"display:none;\"><label>右侧符号</label><input data-add-right></div>\n                </div>\n                <div style=\"display:flex; justify-content:flex-end; margin-top:16px;\"><button class=\"punct-action\" data-save-add style=\"background:#000; color:#fff;\">保存</button></div>\n            "), t.find("[data-add-type]").on("change", function() {
				let e = window.jQuery(this).val() === "pair";
				t.find("[data-right-wrap]").toggle(e), t.find("[data-left-label]").text(e ? "左侧符号" : "要插入的符号");
			}), t.find("[data-save-add]").on("click", () => {
				let e = t.find("[data-add-type]").val(), n = String(t.find("[data-add-name]").val() || "").trim(), i = String(t.find("[data-add-left]").val() || ""), a = e === "pair" ? String(t.find("[data-add-right]").val() || "") : "";
				if (!n || !i || e === "pair" && !a) return r({
					msg: "请填完必填项。",
					isAlert: !0
				});
				let o = l.loadCustomSymbols();
				o.push({
					name: n,
					left: i,
					right: a
				}), l.saveCustomSymbols(o), l.forgetDeletedName(n), l.register(), t.find("[data-view=\"edit\"]").click();
			});
		}, a = () => {
			let e = l.getVisibleSymbols(), n = new Set(l.defaultSymbols.map((e) => e.name)), i = e.length ? e.map((e) => {
				let t = n.has(e.name);
				return `<div class="cmd-row symbol-edit-row" data-name="${l.escapeHtml(e.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="\u62D6\u52A8\u6392\u5E8F">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${l.escapeHtml(e.name)}</div></div>
                    <button class="punct-action" data-edit-one ${t ? "style=\"opacity:.45;\" title=\"默认按钮只能删\"" : ""}>\u4FEE\u6539</button>
                </div>`;
			}).join("") : "<div style=\"text-align:center; padding:20px; color:#999;\">暂无可编辑按钮</div>";
			t.find("[data-content]").html(`<div class="cmd-list-wrap">${i}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-delete-picked>\u5220\u9664\u9009\u4E2D</button></div>`);
			let s = t.find(".cmd-list-wrap"), c = null, u = null, d = () => {
				let e = s.find(".cmd-row").map(function() {
					return window.jQuery(this).attr("data-name");
				}).get();
				l.saveSymbolOrder(e), l.register();
			};
			s.on("dragstart", ".cmd-row", function(e) {
				c = this, window.jQuery(this).addClass("dragging"), e.originalEvent.dataTransfer.effectAllowed = "move", e.originalEvent.dataTransfer.setData("text/plain", window.jQuery(this).attr("data-name"));
			}), s.on("dragover", ".cmd-row", function(e) {
				e.preventDefault();
				let t = window.jQuery(this);
				if (!c || this === c) return;
				let n = this.getBoundingClientRect();
				e.originalEvent.clientY > n.top + n.height / 2 ? t.after(c) : t.before(c);
			}), s.on("dragend", ".cmd-row", function() {
				window.jQuery(this).removeClass("dragging"), c && d(), c = null;
			}), s.on("pointerdown", ".drag-handle", function(e) {
				let t = window.jQuery(this).closest(".cmd-row")[0];
				if (t) {
					c = t, u = e.originalEvent.pointerId;
					try {
						this.setPointerCapture?.(u);
					} catch {}
					window.jQuery(t).addClass("dragging reorder-active"), window.jQuery(document).one("pointerup pointercancel", () => {
						c && (window.jQuery(c).removeClass("dragging reorder-active"), d(), c = null, u = null);
					}), e.preventDefault();
				}
			}), s.on("pointermove", function(e) {
				if (!c || u !== null && e.originalEvent.pointerId !== u) return;
				let t = e.originalEvent, n = document.elementFromPoint(t.clientX, t.clientY)?.closest?.(".cmd-row");
				if (!n || n === c || !window.jQuery.contains(s[0], n)) return;
				let r = n.getBoundingClientRect();
				t.clientY > r.top + r.height / 2 ? window.jQuery(n).after(c) : window.jQuery(n).before(c), e.preventDefault();
			}), t.find("[data-edit-one]").on("click", function() {
				let e = window.jQuery(this).closest(".cmd-row").attr("data-name");
				if (n.has(e)) return r({
					msg: "默认自带标点仅支持删除",
					isAlert: !0
				});
				let t = l.loadCustomSymbols().find((t) => t.name === e);
				t && o(t, e);
			}), t.find("[data-delete-picked]").on("click", () => {
				let e = t.find("[data-pick]:checked").map(function() {
					return window.jQuery(this).closest(".cmd-row").attr("data-name");
				}).get();
				if (!e.length) return r({
					msg: "请先勾选",
					isAlert: !0
				});
				r({
					msg: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${e.length} \u4E2A\u6807\u70B9\u6309\u94AE\u5417\uFF1F`,
					onOk: () => {
						l.deleteCustomByNames(e), a();
					}
				});
			});
		}, o = (e, n) => {
			t.find("[data-content]").html(`
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-edit-name value="${l.escapeHtml(e.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>\u5DE6\u4FA7\u7B26\u53F7</label><input data-edit-left value="${l.escapeHtml(e.left)}"></div>
                    <div class="punct-field"><label>\u53F3\u4FA7\u7B26\u53F7 (\u53EF\u7559\u7A7A)</label><input data-edit-right value="${l.escapeHtml(e.right || "")}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-back-edit style="background:#fff; color:#000;">\u8FD4\u56DE</button>
                    <button class="punct-action" data-save-edit style="background:#000; color:#fff;">\u4FDD\u5B58</button>
                </div>
            `), t.find("[data-back-edit]").on("click", a), t.find("[data-save-edit]").on("click", () => {
				let e = String(t.find("[data-edit-name]").val() || "").trim(), i = String(t.find("[data-edit-left]").val() || ""), o = String(t.find("[data-edit-right]").val() || "");
				if (!e || !i) return r({
					msg: "必填项不能为空",
					isAlert: !0
				});
				e !== n && (l.rememberDeletedName(n), l.hideButtonByName(n), l.forgetDeletedName(e));
				let s = l.loadCustomSymbols(), c = s.findIndex((e) => e.name === n);
				c !== -1 && (s[c] = {
					name: e,
					left: i,
					right: o
				}, l.saveCustomSymbols(s), l.register(), a());
			});
		};
		t.find("[data-view]").on("click", function() {
			t.find(".punct-tab").removeClass("active"), e(this).addClass("active"), e(this).data("view") === "add" ? i() : a();
		}), i(), l.openPopup(t, {
			okButton: "关闭",
			forceCustom: !0
		});
	},
	bindButton: (e, t) => {
		l.boundNames[e] || (window.eventOn(window.getButtonEvent(e), t), l.boundNames[e] = !0);
	},
	register: () => {
		l.buildFloatingLauncher(), l.buildInlineSymbolBar();
	}
};
setTimeout(l.register, 1e3), setTimeout(l.register, 3e3), window.addEventListener("resize", () => {
	let e = document.getElementById("monkey-tools-floating");
	if (e) {
		let t = e.getBoundingClientRect(), n = e.querySelector(".monkey-tools-floating-main"), r = n?.getBoundingClientRect().width || 64, i = n?.getBoundingClientRect().height || 64;
		e.style.left = `${Math.max(8, Math.min(window.innerWidth - r - 8, t.left))}px`, e.style.top = `${Math.max(8, Math.min(window.innerHeight - i - 8, t.top))}px`;
	}
	l.positionInlineSymbolBar();
}), window.addEventListener("scroll", () => l.positionInlineSymbolBar(), !0), window.addEventListener("monkey-tools:settings-changed", l.register);
//#endregion
