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
}, t = "punctuation_custom_buttons_v1", n = "punctuation_deleted_buttons_v1", r = "punctuation_quick_commands_v3", i = "punctuation_cmd_cats_v3", a = "punctuation_cmd_tags_v3", o = "新增符号", s = "指令仓库", c = "monkey-tools", l = e, u = {
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
		return window.extension_settings = e, (!e[c] || typeof e[c] != "object") && (e[c] = {}), e[c];
	},
	saveExtensionSettings: () => {
		let e = window.SillyTavern?.getContext?.() || {};
		typeof window.saveSettingsDebounced == "function" && window.saveSettingsDebounced(), typeof e.saveSettingsDebounced == "function" && e.saveSettingsDebounced(), typeof e.saveSettings == "function" && e.saveSettings(), window.dispatchEvent(new CustomEvent("monkey-tools:settings-changed"));
	},
	migrateLocalStorageOnce: () => {
		if (u.migratedLocalStorage) return;
		u.migratedLocalStorage = !0;
		let e = u.getSettingsRoot();
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
			u.saveExtensionSettings();
		} catch {}
	},
	loadCustomSymbols: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().customSymbols || [];
			return Array.isArray(e) ? e.filter((e) => e && e.name && typeof e.left == "string") : [];
		} catch {
			return [];
		}
	},
	saveCustomSymbols: (e) => {
		u.getSettingsRoot().customSymbols = e, u.saveExtensionSettings();
	},
	loadDeletedNames: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().deletedSymbolNames || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveDeletedNames: (e) => {
		u.getSettingsRoot().deletedSymbolNames = [...new Set(e)], u.saveExtensionSettings();
	},
	rememberDeletedName: (e) => {
		let t = u.loadDeletedNames();
		t.includes(e) || (t.push(e), u.saveDeletedNames(t));
	},
	forgetDeletedName: (e) => u.saveDeletedNames(u.loadDeletedNames().filter((t) => t !== e)),
	loadSymbolOrder: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().symbolOrder || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveSymbolOrder: (e) => {
		u.getSettingsRoot().symbolOrder = [...new Set(e.map(String))], u.saveExtensionSettings();
	},
	applySymbolOrder: (e) => {
		let t = u.loadSymbolOrder();
		if (!t.length) return e;
		let n = new Map(t.map((e, t) => [e, t]));
		return [...e].sort((e, t) => (n.has(e.name) ? n.get(e.name) : 2 ** 53 - 1) - (n.has(t.name) ? n.get(t.name) : 2 ** 53 - 1));
	},
	getAllSymbols: () => u.applySymbolOrder(u.defaultSymbols.concat(u.loadCustomSymbols())),
	getVisibleSymbols: () => {
		let e = new Set(u.loadDeletedNames());
		return u.getAllSymbols().filter((t) => !e.has(t.name));
	},
	loadDisabledScriptSymbolNames: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().disabledScriptSymbolNames || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveDisabledScriptSymbolNames: (e, t = !0) => {
		u.getSettingsRoot().disabledScriptSymbolNames = [...new Set(e.map(String).filter(Boolean))], t && u.saveExtensionSettings();
	},
	isScriptSymbolEnabled: (e) => !u.loadDisabledScriptSymbolNames().includes(String(e)),
	setScriptSymbolEnabled: (e, t, n = !0) => {
		let r = String(e || "");
		if (!r) return;
		let i = new Set(u.loadDisabledScriptSymbolNames());
		t ? i.delete(r) : i.add(r), u.saveDisabledScriptSymbolNames([...i], n);
	},
	getScriptButtonSymbols: () => {
		let e = new Set(u.loadDisabledScriptSymbolNames());
		return u.getVisibleSymbols().filter((t) => !e.has(t.name));
	},
	generateId: () => "cmd_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
	loadCommands: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().commands || [];
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
		u.getSettingsRoot().commands = e, u.saveExtensionSettings();
	},
	loadGlobalTags: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().globalTags || [];
			return Array.isArray(e) ? e : [];
		} catch {
			return [];
		}
	},
	saveGlobalTags: (e) => {
		u.getSettingsRoot().globalTags = [...new Set(e)], u.saveExtensionSettings();
	},
	getCombinedTags: () => {
		let e = u.loadCommands(), t = new Set(u.loadGlobalTags());
		return e.forEach((e) => e.tags && e.tags.forEach((e) => t.add(e))), Array.from(t).sort();
	},
	loadCategorySettings: () => {
		u.migrateLocalStorageOnce();
		try {
			let e = u.getSettingsRoot().categorySettings;
			return e && typeof e == "object" ? {
				...l,
				...e
			} : { ...l };
		} catch {
			return l;
		}
	},
	saveCategorySettings: (e) => {
		let t = u.getSettingsRoot();
		t.categorySettings = { ...e }, t.categories = Object.entries(t.categorySettings).map(([e, t]) => ({
			name: e,
			prefix: t?.prefix || "",
			suffix: t?.suffix || ""
		})), u.saveExtensionSettings();
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
		u.getDocuments().forEach((t) => {
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
		let e = new Set(u.getAllSymbols().map((e) => e.name));
		u.loadDeletedNames().filter((t) => e.has(t)).forEach((e) => u.hideButtonByName(e));
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
					let a = u.removeNamesFromObject(e, t);
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
					let a = u.removeNamesFromObject(i, t);
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
					let n = JSON.parse(i), a = u.removeNamesFromObject(n, t);
					a.changed && e.setItem(r, JSON.stringify(a.value));
				} catch {}
			}
		});
	},
	deleteCustomByNames: (e) => {
		let t = [...new Set(e.filter(Boolean))];
		if (!t.length) return;
		let n = new Set(t), r = u.loadCustomSymbols();
		if (u.saveCustomSymbols(r.filter((e) => !n.has(e.name))), u.saveDisabledScriptSymbolNames(u.loadDisabledScriptSymbolNames().filter((e) => !n.has(e)), !1), t.forEach((e) => {
			u.rememberDeletedName(e), u.hideButtonByName(e);
		}), u.cleanupHelperButtonStorage(t), typeof window < "u" && window.extension_settings) {
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
		u.register();
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
	resolveEditable: (e) => e ? u.isEditable(e) ? e : e.querySelector?.("textarea, input, [contenteditable=\"true\"]") || null : null,
	getSendTextarea: () => {
		for (let e of u.getDocuments()) {
			let t = u.resolveEditable(e.querySelector("#send_textarea"));
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
				let t = u.getSendTextarea();
				t && (u.setCursor(t, e), u.notifyInput(t));
			}, t);
		});
	},
	insertByTextarea: (e) => {
		let t = u.getSendTextarea();
		if (!t) return !1;
		t.focus();
		let n = u.getElementValue(t), r = typeof t.selectionStart == "number" ? t.selectionStart : n.length, i = typeof t.selectionEnd == "number" ? t.selectionEnd : n.length, a = n.slice(r, i), o = e.left, s = e.right || "";
		return u.setElementValue(t, n.slice(0, r) + o + a + s + n.slice(i)), u.notifyInput(t), u.retryCursor(a ? r + o.length + a.length + s.length : r + o.length), !0;
	},
	insertByName: (e) => {
		let t = u.getVisibleSymbols().find((t) => t.name === e);
		t && u.insertByTextarea(t);
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
			setTimeout(u.buildFloatingLauncher, 300);
			return;
		}
		u.ensureFloatingCss(), document.getElementById("monkey-tools-floating")?.remove();
		let e = document.createElement("div");
		e.id = "monkey-tools-floating", e.className = "monkey-tools-floating";
		let t = u.getSettingsRoot().floatingPosition;
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
				if (!r.dragging) e.classList.remove("open"), u.openToolsPanel("commands");
				else {
					let t = e.getBoundingClientRect();
					u.getSettingsRoot().floatingPosition = {
						left: t.left,
						top: t.top
					}, u.saveExtensionSettings();
				}
				r = null, window.removeEventListener("pointermove", a), window.removeEventListener("pointercancel", s);
			}
		}, s = () => {
			r = null, window.removeEventListener("pointermove", a);
		};
		n.addEventListener("pointerdown", i), e.append(n), document.body.appendChild(e);
	},
	buildInlineSymbolBar: () => {
		u.stopInlineSymbolBarTracking(), document.getElementById("monkey-tools-inline-symbols")?.remove();
		let e = u.getSendTextarea();
		if (!e) {
			u.scheduleInlineSymbolBarRetry();
			return;
		}
		u.symbolBarTextarea = e;
		let t = document.createElement("div");
		t.id = "monkey-tools-inline-symbols", u.getVisibleSymbols().forEach((e) => {
			let n = document.createElement("button");
			n.type = "button", n.textContent = e.name, n.title = `插入 ${e.name}`, n.dataset.symbolName = e.name, n.style.cssText = "border:1px solid rgba(0,0,0,0.12);border-radius:999px;background:rgba(255,255,255,0.9);color:#2f343a;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:600;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);", t.appendChild(n);
		});
		let n = document.createElement("button");
		n.type = "button", n.textContent = o, n.title = o, n.dataset.openSettings = "1", n.style.cssText = "border:1px solid rgba(0,0,0,0.18);border-radius:999px;background:rgba(255,255,255,0.96);color:#111;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:700;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);", t.appendChild(n), t.addEventListener("pointerdown", (e) => {
			if (e.target.closest("button[data-open-settings]")) {
				e.preventDefault(), e.stopPropagation(), u.openToolsPanel("symbols");
				return;
			}
			let t = e.target.closest("button[data-symbol-name]");
			t && (e.preventDefault(), e.stopPropagation(), u.insertByName(t.dataset.symbolName));
		}, !0), document.body.appendChild(t), u.positionInlineSymbolBar(), u.watchInlineSymbolBarHost();
	},
	positionInlineSymbolBar: () => {
		let e = document.getElementById("monkey-tools-inline-symbols"), t = u.getSendTextarea();
		if (!e || !t) return;
		let n = t.getBoundingClientRect(), r = Math.max(220, Math.min(n.width, window.innerWidth - 24)), i = Math.max(12, Math.min(n.left, window.innerWidth - r - 12)), a = Math.max(8, n.top - e.offsetHeight - 8);
		e.style.cssText = `position:fixed;left:${i}px;top:${a}px;width:${r}px;z-index:2147482500;display:flex;flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
	},
	scheduleInlineSymbolBarRetry: () => {
		u.symbolBarRetryTimer ||= window.setTimeout(() => {
			u.symbolBarRetryTimer = null, u.buildInlineSymbolBar();
		}, 600);
	},
	stopInlineSymbolBarTracking: () => {
		u.symbolBarRetryTimer &&= (clearTimeout(u.symbolBarRetryTimer), null);
	},
	watchInlineSymbolBarHost: () => {
		typeof MutationObserver > "u" || (u.symbolBarObserver && u.symbolBarObserver.disconnect(), u.symbolBarObserver = new MutationObserver(() => {
			let e = u.getSendTextarea();
			if (!e) {
				document.getElementById("monkey-tools-inline-symbols")?.remove(), u.scheduleInlineSymbolBarRetry();
				return;
			}
			if (e !== u.symbolBarTextarea) {
				u.buildInlineSymbolBar();
				return;
			}
			u.positionInlineSymbolBar();
		}), u.symbolBarObserver.observe(document.body, {
			childList: !0,
			subtree: !0
		}));
	},
	baseCss: () => "\n        <style>\n            @font-face { font-family:\"fugu\"; src:url(\"https://files.catbox.moe/5bdcr7.ttf\") format(\"truetype\"); font-display:swap; font-weight:normal; font-style:normal; }\n            :root { --monkey-tools-font:\"fugu\", var(--mainFontFamily), \"Microsoft YaHei\", sans-serif; --monkey-tools-shadow-color:var(--SmartThemeShadowColor, #80808075); --monkey-tools-shadow-width:var(--shadowWidth, 1); }\n            .punct-settings *, .punct-settings *::before, .punct-settings *::after { box-sizing: border-box; }\n            .popup:has(.punct-settings) { background:#fff !important; border:2px solid #000 !important; border-radius:0 !important; outline:1.5px solid #000 !important; outline-offset:-6px !important; box-shadow:3px 3px 3px #80808075 !important; }\n            .popup:has(.punct-settings) .popup-content, .popup:has(.punct-settings) .popup-body { background:#fff !important; border-radius:0 !important; }\n            .punct-settings { position:relative; overflow-x:hidden; overflow-y:auto; max-height:85vh; color:#000; padding:16px; width:100%; min-width:280px; max-width:620px; font-family:var(--monkey-tools-font); -webkit-overflow-scrolling: touch; background:#fff; text-shadow:0 0 calc(var(--monkey-tools-shadow-width) * 1px) var(--monkey-tools-shadow-color); }\n            .punct-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap: wrap; gap: 8px; }\n            .punct-title { font-size:18px; font-weight:800; letter-spacing:0; background:#fff; border-left:2px solid #000; outline:1.5px solid #000; outline-offset:-7px; padding:10px 18px; }\n            \n            .punct-tabs { display:flex; gap:6px; margin-bottom:16px; background:#f0f0f0; padding:5px; border:1.5px dashed #000; border-radius:0; flex-shrink: 0; }\n            .punct-tab { flex:1; border:1.5px solid transparent; background:transparent; color:#555; border-radius:0; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; }\n            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            .tools-main-tabs { display:flex; gap:8px; margin-bottom:14px; }\n            .tools-main-tab { flex:1; justify-content:center; min-height:36px; }\n            .tools-section { display:none; }\n            .tools-section.active { display:block; }\n            \n            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:2px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:inherit; }\n            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }\n            .punct-action:active { transform:translateY(0); box-shadow:none; }\n            .punct-action.active { background:#e7e7e7; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }\n            \n            .punct-panel { border:1.5px solid #000; border-radius:0; padding:16px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; }\n            .punct-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; width: 100%; }\n            .punct-field label { font-size:12px; font-weight:700; opacity:1; color:#000; }\n            .punct-field input, .punct-field select, .punct-field textarea, .cmd-search { border:1.5px dashed #000; border-radius:2px; padding:10px 12px; background:#f0f0f0; transition:all 0.2s; outline:none; font-family:inherit; color:#000; width: 100%; text-shadow:inherit; }\n            .punct-field input:focus, .punct-field textarea:focus, .punct-field select:focus, .cmd-search:focus { background:#fff; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            \n            .cmd-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; flex-shrink: 0; }\n            .cmd-search { flex:1; min-width: 150px; height:38px; }\n            .cmd-filter-bar { display:flex; flex-wrap:wrap; gap:6px; flex:1; }\n            .cmd-tag { font-size:12px; padding:4px 12px; border-radius:2px; background:#fff; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; font-weight:700; border:1.5px dashed #000; text-shadow:inherit; }\n            .cmd-tag:hover { background:#f0f0f0; color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag.active { background:#000; color:#fff; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }\n            \n            .cmd-editor-wrap { border:1.5px solid #000; background:#fff; padding:16px; border-radius:0; margin-bottom:16px; display:none; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag-editor { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; align-items:center; }\n            .cmd-tag-add { border:1.5px dashed #000; background:#fff; display:flex; align-items:center; padding:2px 8px; border-radius:2px; transition:border-color 0.2s; }\n            .cmd-tag-add:focus-within { border-color:#222; }\n            .cmd-tag-add input { border:none; background:transparent; width:70px; outline:none; font-size:12px; padding:4px 0; font-family:inherit; text-shadow:inherit; }\n            \n            .cmd-list-wrap { max-height:50vh; overflow-y:auto; padding-right:8px; display:flex; flex-direction:column; gap:12px; scrollbar-width: none; scrollbar-color: transparent transparent; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }\n            .cmd-list-wrap::-webkit-scrollbar { width:6px; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb { background:transparent; border-radius:0; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb:hover { background:transparent; }\n            \n            .cmd-row { border:1.5px solid #000; border-radius:0; padding:14px; background:#fff; cursor:pointer; display:flex; gap:12px; transition:all 0.25s; box-shadow:1px 2px 5px #a7a7a7; position:relative; overflow:hidden; align-items: center; flex-shrink: 0; }\n            .cmd-row:hover { border-color:#000; box-shadow:3px 3px 3px #80808075; transform:translateY(-1px); }\n            .cmd-row.favorite { border-left:4px solid #000; }\n            .cmd-row.dragging { opacity:.55; border-style:dashed; box-shadow:none; transform:none; }\n            .drag-handle { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:2px; color:#000; background:#f0f0f0; border:1.5px dashed #000; cursor:grab; flex-shrink:0; font-weight:900; line-height:1; touch-action:none; }\n            .drag-handle:active { cursor:grabbing; }\n            .symbol-edit-row { touch-action:auto; }\n            .symbol-edit-row.reorder-active { touch-action:none; }\n            .script-toggle { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; white-space:nowrap; }\n            .script-toggle input { width:18px; height:18px; margin:0; accent-color:#000; }\n            @media (hover:none), (pointer:coarse) {\n                .drag-handle { width:42px; height:42px; font-size:18px; }\n                .symbol-edit-row { min-height:58px; padding:8px 10px !important; gap:10px; }\n                .symbol-edit-row input[type=\"checkbox\"] { width:22px; height:22px; }\n            }\n             \n            .cmd-content { flex:1; display:flex; flex-direction:column; gap:6px; min-width: 0; }\n            .cmd-title { font-weight:800; font-size:15px; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n            .cmd-text { font-size:12px; color:#333; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-all; }\n            .cmd-tags-display { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }\n            .cmd-tag-mini { font-size:11px; background:#f0f0f0; color:#000; padding:2px 8px; border-radius:2px; font-weight:700; white-space: nowrap; border:1px dashed #000; }\n            \n            .cmd-actions { display:flex; flex-direction:column; gap:10px; align-items:center; justify-content:center; border-left:1.5px dashed #000; padding-left:12px; flex-shrink:0; }\n            .cmd-btn-icon { cursor:pointer; font-size:16px; opacity:0.5; transition:all 0.2s; user-select:none; }\n            .cmd-btn-icon:hover { opacity:1; transform:scale(1.1); }\n            .cmd-btn-heart { color:#000; opacity:1; }\n            \n            .tag-manage-btn { background:#fff; border:1.5px solid #000; color:#000; cursor:pointer; font-size:12px; font-weight:700; padding:6px 12px; border-radius:2px; white-space:nowrap; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }\n            .tag-manage-btn:hover { background:#f0f0f0; color:#000; box-shadow:3px 3px 3px #80808075; }\n            .tag-manage-btn.back-mode { width:34px; height:34px; padding:0; border-radius:2px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; color:#000; }\n            .tag-manage-btn.back-mode:hover { transform:scale(1.04); box-shadow:3px 3px 3px #80808075; background:#f0f0f0; }\n\n            .cmd-modal-overlay { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(255,255,255,0.72); backdrop-filter:none; -webkit-backdrop-filter:none; z-index:9999; border-radius:0; display:none; }\n            .cmd-confirm-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:0; padding:24px; box-shadow:3px 3px 3px #80808075; text-align:center; width:85%; max-width:320px; box-sizing:border-box; outline:1.5px solid #000; outline-offset:-6px; }\n            .cmd-confirm-text { font-size:15px; font-weight:700; color:#000; margin-bottom:20px; line-height:1.6; word-break:break-all; white-space:pre-wrap; }\n            .cmd-confirm-actions { display:flex; justify-content:center; gap:12px; }\n\n            .cmd-quick-inserts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }\n            .cmd-quick-btn { font-size:12px; font-weight:700; padding:4px 8px; border-radius:2px; background:#fff; border:1.5px dashed #000; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; text-shadow:inherit; }\n            .cmd-quick-btn:hover { background:#f0f0f0; color:#000; border-color:#000; transform:translateY(-1px); box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-quick-btn:active { transform:scale(0.95); }\n        </style>\n    ",
	modalHtml: "\n        <div class=\"cmd-modal-overlay\" id=\"custom-modal-layer\">\n            <div class=\"cmd-confirm-box\">\n                <div class=\"cmd-confirm-text\" id=\"custom-modal-msg\"></div>\n                <input type=\"text\" id=\"custom-modal-input\" style=\"display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;\">\n                <div class=\"cmd-confirm-actions\">\n                    <button class=\"punct-action\" id=\"custom-modal-cancel\" style=\"background:#fff; color:#000;\">取消</button>\n                    <button class=\"punct-action\" id=\"custom-modal-ok\" style=\"background:#000; color:#fff;\">确定</button>\n                </div>\n            </div>\n        </div>\n    ",
	openToolsPanel: (e = "commands") => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开工具面板。");
			return;
		}
		u.openCommandPanel({
			embed: !0,
			initialTab: e
		});
	},
	openCommandPanel: (e = {}) => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开指令面板。");
			return;
		}
		let t = window.jQuery, n = !!e.embed, r = e.initialTab === "symbols" ? "symbols" : "commands", i = {
			activeTab: Object.keys(l)[0],
			searchText: "",
			filterTags: [],
			editingId: null,
			editorTags: [],
			isTagManageMode: !1
		}, a = [
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
			...u.getVisibleSymbols()
		].map((e) => `<span class="cmd-quick-btn" data-left="${u.escapeHtml(e.left)}" data-right="${u.escapeHtml(e.right || "")}">${u.escapeHtml(e.name)}</span>`).join(""), o = t(`
            <div class="punct-settings">
                ${u.baseCss()}
                <div class="punct-head">
                    <div class="punct-title">${n ? "猴子的小工具" : "常用指令库"}</div>
                    <div style="display:flex; gap:8px;">
                        <button class="punct-action" id="cmd-import-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5408\u5E76\u5BFC\u5165JSON\u6587\u4EF6">\uD83D\uDCE5 \u5BFC\u5165</button>
                        <button class="punct-action" id="cmd-export-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5BFC\u51FA\u6240\u6709\u6570\u636E\u5907\u4EFD">\uD83D\uDCE4 \u5BFC\u51FA</button>
                        <input type="file" id="cmd-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                ${n ? `
                <div class="tools-main-tabs">
                    <button class="punct-action tools-main-tab ${r === "commands" ? "active" : ""}" type="button" data-tools-tab="commands">\u6307\u4EE4\u4ED3\u5E93</button>
                    <button class="punct-action tools-main-tab ${r === "symbols" ? "active" : ""}" type="button" data-tools-tab="symbols">\u65B0\u589E\u6309\u94AE</button>
                </div>
                ` : ""}

                <div class="tools-section tools-commands-section ${!n || r === "commands" ? "active" : ""}">

                <div class="punct-tabs" id="cmd-tabs-container">
                    ${Object.keys(l).map((e) => `<button class="punct-tab ${i.activeTab === e ? "active" : ""}" data-cat="${e}">${e}</button>`).join("")}
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
                        <div class="cmd-quick-inserts">${a}</div>
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

                ${n ? `<div class="tools-section tools-symbols-section ${r === "symbols" ? "active" : ""}" id="tools-symbols-section"></div>` : ""}
                ${u.modalHtml}
            </div>
        `), s = null, c = !1, d = (e) => {
			o.find("#custom-modal-msg").text(e.msg), s = e.onOk, c = !!e.prompt;
			let t = o.find("#custom-modal-input");
			c ? (t.val(e.defaultVal || "").show(), o.find("#custom-modal-ok").css("background", "#222").text("确定")) : (t.hide(), e.isAlert ? o.find("#custom-modal-ok").css("background", "#222").text("我知道了") : o.find("#custom-modal-ok").css("background", "#000").text("确定操作")), e.isAlert ? o.find("#custom-modal-cancel").hide() : o.find("#custom-modal-cancel").show(), o.find("#custom-modal-layer").fadeIn(150), c && setTimeout(() => t.focus(), 160);
		};
		o.find("#custom-modal-cancel").on("click", () => {
			s = null, o.find("#custom-modal-layer").fadeOut(150);
		}), o.find("#custom-modal-ok").on("click", () => {
			let e = c ? o.find("#custom-modal-input").val() : !0;
			s && s(e), o.find("#custom-modal-layer").fadeOut(150);
		}), o.find("#cmd-export-btn").on("click", () => {
			let e = {
				version: 1,
				commands: u.loadCommands(),
				categories: u.loadCategorySettings(),
				tags: u.loadGlobalTags(),
				symbols: u.loadCustomSymbols()
			}, t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), n = URL.createObjectURL(t), r = document.createElement("a");
			r.href = n, r.download = `sillytavern_commands_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(n), window.toastr && toastr.success("数据导出成功！");
		}), o.find("#cmd-import-btn").on("click", () => {
			o.find("#cmd-import-file").click();
		}), o.find("#cmd-import-file").on("change", function(e) {
			let t = e.target.files[0];
			if (!t) return;
			let n = new FileReader();
			n.onload = function(e) {
				try {
					let t = JSON.parse(e.target.result);
					if (!t.commands && !t.categories && !t.symbols && !t.tags) throw Error("Invalid Format");
					d({
						msg: "即将导入备份数据！\n为防止误删，导入的数据将与现有数据进行【合并】。\n是否继续？",
						onOk: () => {
							let e = Array.isArray(t.commands) ? t.commands : [], n = u.loadCommands(), r = 0;
							if (e.forEach((e) => {
								n.find((t) => t.title === e.title && t.text === e.text) || (e.id = u.generateId(), n.push(e), r++);
							}), u.saveCommands(n), t.categories) {
								let e = u.loadCategorySettings();
								Object.keys(t.categories).forEach((n) => e[n] = t.categories[n]), u.saveCategorySettings(e);
							}
							if (Array.isArray(t.tags)) {
								let e = u.loadGlobalTags();
								t.tags.forEach((t) => {
									e.includes(t) || e.push(t);
								}), u.saveGlobalTags(e);
							}
							if (Array.isArray(t.symbols)) {
								let e = u.loadCustomSymbols();
								t.symbols.forEach((t) => {
									!e.find((e) => e.name === t.name) && t.name && typeof t.left == "string" && e.push(t);
								}), u.saveCustomSymbols(e), u.register();
							}
							p(), window.toastr && toastr.success(`\u5BFC\u5165\u6210\u529F\uFF01\u5171\u65B0\u589E ${r} \u6761\u6307\u4EE4\u3002`);
						}
					});
				} catch {
					d({
						msg: "读取失败：文件格式不正确或已损坏！",
						isAlert: !0
					});
				}
				o.find("#cmd-import-file").val("");
			}, n.readAsText(t);
		});
		let f = null;
		o.on("focus", "#cmd-input-title, #cmd-input-text, #cmd-cat-prefix, #cmd-cat-suffix", function() {
			f = this;
		}), o.on("click", ".cmd-quick-btn", function(e) {
			e.preventDefault();
			let n = t(this).attr("data-left") || "", r = t(this).attr("data-right") || "";
			f ||= o.find("#cmd-input-text")[0], f.focus();
			let i = f.selectionStart || 0, a = f.selectionEnd || 0, s = f.value || "", c = s.slice(i, a), l = s.slice(0, i) + n + c + r + s.slice(a);
			f.value = l, t(f).trigger("input");
			let u = i + n.length + c.length;
			f.setSelectionRange(u, u);
		});
		let p = () => {
			let e = u.loadCommands(), t = u.getCombinedTags();
			if (i.isTagManageMode) {
				o.find(".cmd-toolbar, #cmd-filter-container, #cmd-editor-panel, #cmd-cat-panel").hide(), o.find("#cmd-manage-tags-btn").html("<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" stroke=\"currentColor\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 12H5M12 19l-7-7 7-7\"/></svg>").addClass("back-mode").attr("title", "返回列表");
				let e = "\n                    <div style=\"display:flex; gap:8px; margin-bottom:12px;\">\n                        <input type=\"text\" id=\"manage-new-tag-input\" class=\"cmd-search\" placeholder=\"输入新标签名称...\" style=\"height:38px;\">\n                        <button class=\"punct-action\" id=\"manage-add-tag-btn\" style=\"height:38px; background:#000; color:#fff; padding:0 16px;\">新增标签</button>\n                    </div>\n                ";
				if (t.length === 0) o.find("#cmd-list-container").html(e + "<div style=\"text-align:center; padding:30px; color:#999;\">当前没有任何标签</div>");
				else {
					let n = t.map((e) => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${u.escapeHtml(e)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${u.escapeHtml(e)}" style="padding:6px 12px; font-size:12px;">\u91CD\u547D\u540D</button>
                                <button class="punct-action tag-del-btn" data-tag="${u.escapeHtml(e)}" style="padding:6px 12px; font-size:12px; color:#000;">\u5220\u9664</button>
                            </div>
                        </div>
                    `).join("");
					o.find("#cmd-list-container").html(e + n);
				}
				return;
			}
			o.find(".cmd-toolbar, #cmd-filter-container").show(), o.find("#cmd-manage-tags-btn").html("管理标签").removeClass("back-mode").removeAttr("title"), o.find("#cmd-toggle-cat-btn").hasClass("active") ? (o.find("#cmd-cat-panel").css("display", "block"), o.find("#current-cat-name").text(i.activeTab)) : o.find("#cmd-cat-panel").css("display", "none"), i.editingId || o.find("#cmd-toggle-editor-btn").text().includes("收起") ? o.find("#cmd-editor-panel").css("display", "block") : o.find("#cmd-editor-panel").css("display", "none"), o.find("#cmd-filter-container").html(t.map((e) => `<div class="cmd-tag ${i.filterTags.includes(e) ? "active" : ""}" data-tag="${u.escapeHtml(e)}">${u.escapeHtml(e)}</div>`).join("") + (i.filterTags.length > 0 ? "<div class=\"cmd-tag active\" style=\"background:#000;\" id=\"cmd-clear-filter\">✖ 清除筛选</div>" : ""));
			let n = Array.from(new Set([...t, ...i.editorTags])).sort();
			o.find("#cmd-editor-tags").html(n.map((e) => `<div class="cmd-tag ${i.editorTags.includes(e) ? "active" : ""} editor-tag-btn" data-tag="${u.escapeHtml(e)}">${u.escapeHtml(e)}</div>`).join("") + "<div class=\"cmd-tag-add\"><input type=\"text\" id=\"cmd-new-tag-input\" placeholder=\"+新标签\"><button id=\"cmd-add-tag-btn\" style=\"border:none;background:none;cursor:pointer;font-weight:bold;color:#666;\">✔</button></div>");
			let r = e.filter((e) => e.category === i.activeTab);
			if (i.filterTags.length > 0 && (r = r.filter((e) => e.tags && i.filterTags.every((t) => e.tags.includes(t)))), i.searchText) {
				let e = i.searchText.toLowerCase();
				r = r.filter((t) => t.title && t.title.toLowerCase().includes(e) || t.text.toLowerCase().includes(e) || t.tags && t.tags.some((t) => t.toLowerCase().includes(e)));
			}
			if (r.sort((e, t) => e.isFavorite === t.isFavorite ? t.timestamp - e.timestamp : e.isFavorite ? -1 : 1), r.length === 0) o.find("#cmd-list-container").html("<div style=\"text-align:center; padding:40px; color:#999;\">没有找到指令</div>");
			else {
				let e = r.map((e) => {
					let t = e.title || e.text.substring(0, 10);
					return `
                    <div class="cmd-row ${e.isFavorite ? "favorite" : ""}" data-id="${e.id}">
                        <div class="cmd-content copy-trigger">
                            <div class="cmd-title">${u.escapeHtml(t)}</div>
                            <div class="cmd-text">${u.escapeHtml(e.text)}</div>
                            ${e.tags && e.tags.length ? `<div class="cmd-tags-display">${e.tags.map((e) => `<span class="cmd-tag-mini">${u.escapeHtml(e)}</span>`).join("")}</div>` : ""}
                        </div>
                        <div class="cmd-actions">
                            <div class="cmd-btn-icon ${e.isFavorite ? "cmd-btn-heart" : ""} fav-trigger" title="${e.isFavorite ? "取消常用" : "设为常用"}">${e.isFavorite ? "❤" : "♡"}</div>
                            <div class="cmd-btn-icon edit-trigger" title="\u4FEE\u6539">\u270E</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="\u5220\u9664">\u2716</div>
                        </div>
                    </div>
                `;
				});
				o.find("#cmd-list-container").html(e.join(""));
			}
		}, m = () => {
			i.editingId = null, i.editorTags = [], o.find("#cmd-input-title").val(""), o.find("#cmd-input-text").val(""), o.find("#cmd-editor-panel").css("display", "none"), o.find("#cmd-toggle-editor-btn").text("➕ 新建"), o.find("#cmd-save-btn").text("保存指令"), p();
		};
		o.on("click", ".punct-tab", function() {
			if (o.find(".punct-tab").removeClass("active"), t(this).addClass("active"), i.activeTab = t(this).data("cat"), i.filterTags = [], i.searchText = "", o.find("#cmd-search-input").val(""), i.isTagManageMode = !1, o.find("#cmd-toggle-cat-btn").hasClass("active")) {
				let e = u.loadCategorySettings()[i.activeTab] || {
					prefix: "",
					suffix: ""
				};
				o.find("#cmd-cat-prefix").val(e.prefix), o.find("#cmd-cat-suffix").val(e.suffix);
			}
			i.editingId && (i.editingId = null, o.find("#cmd-save-btn").text("保存指令")), p();
		}), o.on("click", "#cmd-toggle-cat-btn", function() {
			if (t(this).hasClass("active")) t(this).removeClass("active"), p();
			else {
				m(), t(this).addClass("active");
				let e = u.loadCategorySettings()[i.activeTab] || {
					prefix: "",
					suffix: ""
				};
				o.find("#cmd-cat-prefix").val(e.prefix), o.find("#cmd-cat-suffix").val(e.suffix), p();
			}
		}), o.find("#cmd-cat-cancel-btn").on("click", () => {
			o.find("#cmd-toggle-cat-btn").removeClass("active"), p();
		}), o.find("#cmd-cat-save-btn").on("click", () => {
			let e = o.find("#cmd-cat-prefix").val(), t = o.find("#cmd-cat-suffix").val(), n = u.loadCategorySettings();
			n[i.activeTab] || (n[i.activeTab] = {}), n[i.activeTab].prefix = e, n[i.activeTab].suffix = t, u.saveCategorySettings(n), p(), window.toastr && toastr.success("格式保存成功");
		}), o.on("click", "#cmd-manage-tags-btn", () => {
			i.isTagManageMode = !i.isTagManageMode, i.isTagManageMode && (m(), o.find("#cmd-toggle-cat-btn").removeClass("active")), p();
		}), o.on("click", "#manage-add-tag-btn", function() {
			let e = o.find("#manage-new-tag-input").val().trim();
			if (!e) return;
			let t = u.loadGlobalTags();
			t.includes(e) ? d({
				msg: "标签已存在",
				isAlert: !0
			}) : (t.push(e), u.saveGlobalTags(t), p(), setTimeout(() => o.find("#manage-new-tag-input").focus(), 10));
		}), o.on("click", ".tag-edit-btn", function() {
			let e = String(t(this).attr("data-tag"));
			d({
				msg: `\u5C06\u6807\u7B7E [${e}] \u91CD\u547D\u540D\u4E3A:`,
				prompt: !0,
				defaultVal: e,
				onOk: (t) => {
					if (t && t.trim() && t.trim() !== e) {
						let n = t.trim(), r = u.loadCommands();
						r.forEach((t) => {
							t.tags && t.tags.includes(e) && (t.tags = t.tags.map((t) => t === e ? n : t));
						}), u.saveCommands(r);
						let a = u.loadGlobalTags();
						a.includes(e) && (a[a.indexOf(e)] = n, u.saveGlobalTags(a)), i.filterTags.includes(e) && (i.filterTags = i.filterTags.map((t) => t === e ? n : t)), p();
					}
				}
			});
		}), o.on("click", ".tag-del-btn", function() {
			let e = String(t(this).attr("data-tag"));
			d({
				msg: `\u786E\u5B9A\u8981\u5168\u5C40\u5220\u9664\u6807\u7B7E [${e}] \u5417\uFF1F\n\u5305\u542B\u6B64\u6807\u7B7E\u7684\u6307\u4EE4\u4E0D\u4F1A\u88AB\u5220\u9664\uFF0C\u53EA\u662F\u5931\u53BB\u8BE5\u6807\u7B7E\u3002`,
				onOk: () => {
					let t = u.loadCommands();
					t.forEach((t) => {
						t.tags && t.tags.includes(e) && (t.tags = t.tags.filter((t) => t !== e));
					}), u.saveCommands(t);
					let n = u.loadGlobalTags();
					n = n.filter((t) => t !== e), u.saveGlobalTags(n), i.filterTags.includes(e) && (i.filterTags = i.filterTags.filter((t) => t !== e)), p();
				}
			});
		}), o.on("click", ".editor-tag-btn", function() {
			let e = String(t(this).attr("data-tag"));
			i.editorTags.includes(e) ? i.editorTags = i.editorTags.filter((t) => t !== e) : i.editorTags.push(e), p();
		}), o.on("click", "#cmd-add-tag-btn", function(e) {
			e.preventDefault();
			let t = o.find("#cmd-new-tag-input").val().trim();
			if (t && !i.editorTags.includes(t)) {
				i.editorTags.push(t);
				let e = u.loadGlobalTags();
				e.includes(t) || (e.push(t), u.saveGlobalTags(e));
			}
			p(), setTimeout(() => o.find("#cmd-new-tag-input").focus(), 10);
		}), o.find("#cmd-search-input").on("input", function() {
			i.searchText = t(this).val().trim(), p();
		}), o.on("click", ".cmd-filter-bar .cmd-tag", function() {
			if (t(this).attr("id") === "cmd-clear-filter") i.filterTags = [];
			else {
				let e = String(t(this).attr("data-tag"));
				i.filterTags.includes(e) ? i.filterTags = i.filterTags.filter((t) => t !== e) : i.filterTags.push(e);
			}
			p();
		}), o.on("click", "#cmd-toggle-editor-btn", function() {
			let e = o.find("#cmd-editor-panel");
			e.css("display") === "none" ? (m(), o.find("#cmd-toggle-cat-btn").removeClass("active"), e.css("display", "block"), t(this).text("▲ 收起"), p()) : m();
		}), o.find("#cmd-cancel-btn").on("click", m), o.find("#cmd-save-btn").on("click", () => {
			let e = o.find("#cmd-input-text").val().trim();
			if (!e) return d({
				msg: "指令内容不能为空！",
				isAlert: !0
			});
			let t = o.find("#cmd-input-title").val().trim() || e.substring(0, 10), n = u.loadCommands();
			if (i.editingId) {
				let r = n.findIndex((e) => e.id === i.editingId);
				r !== -1 && (n[r].title = t, n[r].text = e, n[r].tags = [...i.editorTags]);
			} else n.push({
				id: u.generateId(),
				category: i.activeTab,
				title: t,
				text: e,
				isFavorite: !1,
				tags: [...i.editorTags],
				timestamp: Date.now()
			});
			u.saveCommands(n), m();
		}), o.on("click", ".copy-trigger", function() {
			let e = t(this).closest(".cmd-row").data("id"), n = u.loadCommands().find((t) => t.id === e);
			if (n) {
				let e = u.loadCategorySettings()[n.category] || {
					prefix: "",
					suffix: ""
				};
				u.copyToClipboard((e.prefix || "") + n.text + (e.suffix || ""));
			}
		}), o.on("click", ".fav-trigger", function(e) {
			e.stopPropagation();
			let n = t(this).closest(".cmd-row").data("id"), r = u.loadCommands(), i = r.findIndex((e) => e.id === n);
			i !== -1 && (r[i].isFavorite = !r[i].isFavorite, u.saveCommands(r), p());
		}), o.on("click", ".edit-trigger", function(e) {
			e.stopPropagation();
			let n = t(this).closest(".cmd-row").data("id"), r = u.loadCommands().find((e) => e.id === n);
			r && (i.editingId = r.id, i.editorTags = [...r.tags || []], o.find("#cmd-input-title").val(r.title || ""), o.find("#cmd-input-text").val(r.text), o.find("#cmd-toggle-cat-btn").removeClass("active"), o.find("#cmd-editor-panel").css("display", "block"), o.find("#cmd-toggle-editor-btn").text("▲ 收起"), o.find("#cmd-save-btn").text("保存修改"), p());
		}), o.on("click", ".del-trigger", function(e) {
			e.stopPropagation();
			let n = t(this).closest(".cmd-row").data("id"), r = u.loadCommands().find((e) => e.id === n);
			r && d({
				msg: `\u4F60\u786E\u5B9A\u5220\u9664 [${r.category}] \u4E0B\u9762\u7684 1 \u6761\u6307\u4EE4\u5417\uFF1F`,
				onOk: () => {
					let e = u.loadCommands().filter((e) => e.id !== n);
					u.saveCommands(e), p();
				}
			});
		});
		let h = (e) => {
			if (!n) return;
			let t = e === "symbols" ? "symbols" : "commands";
			o.find("[data-tools-tab]").removeClass("active"), o.find(`[data-tools-tab="${t}"]`).addClass("active"), o.find(".tools-section").removeClass("active"), o.find(t === "symbols" ? ".tools-symbols-section" : ".tools-commands-section").addClass("active");
		};
		n && (u.mountSymbolSettings(o, d, "#tools-symbols-section"), o.on("click", "[data-tools-tab]", function() {
			h(window.jQuery(this).attr("data-tools-tab"));
		}), h(r)), p(), u.openPopup(o, {
			okButton: "关闭",
			forceCustom: !0
		});
	},
	mountSymbolSettings: (e, t, n) => {
		window.jQuery;
		let r = e.find(n);
		if (!r.length) return;
		r.html("\n            <div class=\"punct-tabs\">\n                <button class=\"punct-tab active\" data-symbol-view=\"add\">新增</button>\n                <button class=\"punct-tab\" data-symbol-view=\"edit\">编辑</button>\n            </div>\n            <div class=\"punct-panel\" data-symbol-content></div>\n        ");
		let i = () => {
			r.find("[data-symbol-content]").html("\n                <div class=\"punct-field\"><label>类型</label><select data-add-type><option value=\"single\">单独标点</option><option value=\"pair\">成对标点</option></select></div>\n                <div class=\"punct-field\"><label>按钮名称</label><input data-add-name placeholder=\"显示在按钮上\"></div>\n                <div style=\"display:grid; grid-template-columns:1fr 1fr; gap:12px;\">\n                    <div class=\"punct-field\"><label data-left-label>要插入的符号</label><input data-add-left></div>\n                    <div class=\"punct-field\" data-right-wrap style=\"display:none;\"><label>右侧符号</label><input data-add-right></div>\n                </div>\n                <label class=\"script-toggle\" style=\"margin-top:4px;\"><input type=\"checkbox\" data-add-script-enabled checked>显示为脚本按钮</label>\n                <div style=\"display:flex; justify-content:flex-end; margin-top:16px;\"><button class=\"punct-action\" data-save-add style=\"background:#000; color:#fff;\">保存</button></div>\n            "), r.find("[data-add-type]").on("change", function() {
				let e = window.jQuery(this).val() === "pair";
				r.find("[data-right-wrap]").toggle(e), r.find("[data-left-label]").text(e ? "左侧符号" : "要插入的符号");
			}), r.find("[data-save-add]").on("click", () => {
				let e = r.find("[data-add-type]").val(), n = String(r.find("[data-add-name]").val() || "").trim(), i = String(r.find("[data-add-left]").val() || ""), o = e === "pair" ? String(r.find("[data-add-right]").val() || "") : "", s = r.find("[data-add-script-enabled]").prop("checked");
				if (!n || !i || e === "pair" && !o) return t({
					msg: "请填完必填项。",
					isAlert: !0
				});
				let c = u.loadCustomSymbols();
				c.push({
					name: n,
					left: i,
					right: o
				}), u.saveCustomSymbols(c), u.forgetDeletedName(n), u.setScriptSymbolEnabled(n, s, !1), u.saveExtensionSettings(), u.register(), a(), r.find("[data-symbol-view]").removeClass("active"), r.find("[data-symbol-view=\"edit\"]").addClass("active");
			});
		}, a = () => {
			let e = u.getVisibleSymbols(), n = new Set(u.defaultSymbols.map((e) => e.name)), i = new Set(u.loadDisabledScriptSymbolNames()), s = e.length ? e.map((e) => {
				let t = n.has(e.name), r = i.has(e.name) ? "" : "checked";
				return `<div class="cmd-row symbol-edit-row" data-name="${u.escapeHtml(e.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="\u62D6\u52A8\u6392\u5E8F">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${u.escapeHtml(e.name)}</div></div>
                    <label class="script-toggle"><input type="checkbox" data-script-toggle ${r}>\u6309\u94AE</label>
                    <button class="punct-action" data-edit-one ${t ? "style=\"opacity:.45;\" title=\"默认按钮只能删\"" : ""}>\u4FEE\u6539</button>
                </div>`;
			}).join("") : "<div style=\"text-align:center; padding:20px; color:#999;\">暂无可编辑按钮</div>";
			r.find("[data-symbol-content]").html(`<div class="cmd-list-wrap">${s}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-delete-picked>\u5220\u9664\u9009\u4E2D</button></div>`);
			let c = r.find(".cmd-list-wrap"), l = null, d = null, f = () => {
				let e = c.find(".cmd-row").map(function() {
					return window.jQuery(this).attr("data-name");
				}).get();
				u.saveSymbolOrder(e), u.register();
			};
			c.on("dragstart", ".cmd-row", function(e) {
				l = this, window.jQuery(this).addClass("dragging"), e.originalEvent.dataTransfer.effectAllowed = "move", e.originalEvent.dataTransfer.setData("text/plain", window.jQuery(this).attr("data-name"));
			}), c.on("dragover", ".cmd-row", function(e) {
				e.preventDefault();
				let t = window.jQuery(this);
				if (!l || this === l) return;
				let n = this.getBoundingClientRect();
				e.originalEvent.clientY > n.top + n.height / 2 ? t.after(l) : t.before(l);
			}), c.on("dragend", ".cmd-row", function() {
				window.jQuery(this).removeClass("dragging"), l && f(), l = null;
			}), c.on("pointerdown", ".drag-handle", function(e) {
				let t = window.jQuery(this).closest(".cmd-row")[0];
				if (t) {
					l = t, d = e.originalEvent.pointerId;
					try {
						this.setPointerCapture?.(d);
					} catch {}
					window.jQuery(t).addClass("dragging reorder-active"), window.jQuery(document).one("pointerup pointercancel", () => {
						l && (window.jQuery(l).removeClass("dragging reorder-active"), f(), l = null, d = null);
					}), e.preventDefault();
				}
			}), c.on("pointermove", function(e) {
				if (!l || d !== null && e.originalEvent.pointerId !== d) return;
				let t = e.originalEvent, n = document.elementFromPoint(t.clientX, t.clientY)?.closest?.(".cmd-row");
				if (!n || n === l || !window.jQuery.contains(c[0], n)) return;
				let r = n.getBoundingClientRect();
				t.clientY > r.top + r.height / 2 ? window.jQuery(n).after(l) : window.jQuery(n).before(l), e.preventDefault();
			}), r.find("[data-script-toggle]").on("change", function() {
				let e = window.jQuery(this).closest(".cmd-row").attr("data-name");
				u.setScriptSymbolEnabled(e, window.jQuery(this).prop("checked")), u.register();
			}), r.find("[data-edit-one]").on("click", function() {
				let e = window.jQuery(this).closest(".cmd-row").attr("data-name");
				if (n.has(e)) return t({
					msg: "默认自带标点仅支持删除",
					isAlert: !0
				});
				let r = u.loadCustomSymbols().find((t) => t.name === e);
				r && o(r, e);
			}), r.find("[data-delete-picked]").on("click", () => {
				let e = r.find("[data-pick]:checked").map(function() {
					return window.jQuery(this).closest(".cmd-row").attr("data-name");
				}).get();
				if (!e.length) return t({
					msg: "请先勾选",
					isAlert: !0
				});
				t({
					msg: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${e.length} \u4E2A\u6807\u70B9\u6309\u94AE\u5417\uFF1F`,
					onOk: () => {
						u.deleteCustomByNames(e), a(), u.register();
					}
				});
			});
		}, o = (e, n) => {
			let i = u.isScriptSymbolEnabled(n) ? "checked" : "";
			r.find("[data-symbol-content]").html(`
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-edit-name value="${u.escapeHtml(e.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>\u5DE6\u4FA7\u7B26\u53F7</label><input data-edit-left value="${u.escapeHtml(e.left)}"></div>
                    <div class="punct-field"><label>\u53F3\u4FA7\u7B26\u53F7 (\u53EF\u7559\u7A7A)</label><input data-edit-right value="${u.escapeHtml(e.right || "")}"></div>
                </div>
                <label class="script-toggle" style="margin-top:4px;"><input type="checkbox" data-edit-script-enabled ${i}>\u663E\u793A\u4E3A\u811A\u672C\u6309\u94AE</label>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-back-edit style="background:#fff; color:#000;">\u8FD4\u56DE</button>
                    <button class="punct-action" data-save-edit style="background:#000; color:#fff;">\u4FDD\u5B58</button>
                </div>
            `), r.find("[data-back-edit]").on("click", a), r.find("[data-save-edit]").on("click", () => {
				let e = String(r.find("[data-edit-name]").val() || "").trim(), i = String(r.find("[data-edit-left]").val() || ""), o = String(r.find("[data-edit-right]").val() || ""), s = r.find("[data-edit-script-enabled]").prop("checked");
				if (!e || !i) return t({
					msg: "必填项不能为空",
					isAlert: !0
				});
				let c = u.isScriptSymbolEnabled(n);
				e !== n && (u.rememberDeletedName(n), u.hideButtonByName(n), u.forgetDeletedName(e), u.setScriptSymbolEnabled(n, !0, !1), u.setScriptSymbolEnabled(e, c, !1)), u.setScriptSymbolEnabled(e, s, !1);
				let l = u.loadCustomSymbols(), d = l.findIndex((e) => e.name === n);
				d !== -1 && (l[d] = {
					name: e,
					left: i,
					right: o
				}, u.saveCustomSymbols(l), u.saveExtensionSettings(), u.register(), a());
			});
		};
		r.find("[data-symbol-view]").on("click", function() {
			r.find("[data-symbol-view]").removeClass("active"), window.jQuery(this).addClass("active"), window.jQuery(this).attr("data-symbol-view") === "add" ? i() : a();
		}), i();
	},
	openSettings: () => u.openToolsPanel("symbols"),
	bindButton: (e, t) => {
		u.boundNames[e] || (window.eventOn(window.getButtonEvent(e), t), u.boundNames[e] = !0);
	},
	registerScriptSymbolButtons: () => {
		let e = u.getScriptButtonSymbols(), t = new Set(e.map((e) => e.name));
		u.getVisibleSymbols().filter((e) => !t.has(e.name)).forEach((e) => u.hideButtonByName(e.name));
		let n = e.map((e) => ({
			name: e.name,
			visible: !0
		}));
		n.push({
			name: o,
			visible: !0
		}, {
			name: s,
			visible: !0
		}), typeof window.appendInexistentScriptButtons == "function" ? window.appendInexistentScriptButtons(n) : typeof window.replaceScriptButtons == "function" && window.replaceScriptButtons(n), !(typeof window.eventOn != "function" || typeof window.getButtonEvent != "function") && (e.forEach((e) => u.bindButton(e.name, () => u.insertByName(e.name))), u.bindButton(o, () => u.openToolsPanel("symbols")), u.bindButton(s, () => u.openToolsPanel("commands")));
	},
	register: () => {
		u.buildFloatingLauncher(), u.stopInlineSymbolBarTracking(), document.getElementById("monkey-tools-inline-symbols")?.remove(), u.registerScriptSymbolButtons();
	}
};
setTimeout(u.register, 1e3), setTimeout(u.register, 3e3), window.addEventListener("resize", () => {
	let e = document.getElementById("monkey-tools-floating");
	if (e) {
		let t = e.getBoundingClientRect(), n = e.querySelector(".monkey-tools-floating-main"), r = n?.getBoundingClientRect().width || 64, i = n?.getBoundingClientRect().height || 64;
		e.style.left = `${Math.max(8, Math.min(window.innerWidth - r - 8, t.left))}px`, e.style.top = `${Math.max(8, Math.min(window.innerHeight - i - 8, t.top))}px`;
	}
	u.positionInlineSymbolBar();
}), window.addEventListener("scroll", () => u.positionInlineSymbolBar(), !0), window.addEventListener("monkey-tools:settings-changed", u.register);
//#endregion
