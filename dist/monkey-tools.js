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
}, t = "punctuation_custom_buttons_v1", n = "punctuation_deleted_buttons_v1", r = "punctuation_quick_commands_v3", i = "punctuation_cmd_cats_v3", a = "punctuation_cmd_tags_v3", o = "monkey-tools", s = e, c = {
	debugLogged: !1,
	boundNames: {},
	migratedLocalStorage: !1,
	symbolBarObserver: null,
	symbolBarRetryTimer: null,
	symbolBarTextarea: null,
	symbolBarHideTimer: null,
	symbolBarVisible: !1,
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
		return window.extension_settings = e, (!e[o] || typeof e[o] != "object") && (e[o] = {}), e[o];
	},
	saveExtensionSettings: () => {
		let e = window.SillyTavern?.getContext?.() || {};
		typeof window.saveSettingsDebounced == "function" && window.saveSettingsDebounced(), typeof e.saveSettingsDebounced == "function" && e.saveSettingsDebounced(), typeof e.saveSettings == "function" && e.saveSettings(), window.dispatchEvent(new CustomEvent("monkey-tools:settings-changed"));
	},
	migrateLocalStorageOnce: () => {
		if (c.migratedLocalStorage) return;
		c.migratedLocalStorage = !0;
		let e = c.getSettingsRoot();
		try {
			if ((!e.categorySettings || typeof e.categorySettings != "object") && Array.isArray(e.categories) && (e.categorySettings = e.categories.reduce((e, t) => (t && t.name && (e[t.name] = {
				prefix: t.prefix || "",
				suffix: t.suffix || ""
			}), e), {})), !Array.isArray(e.deletedSymbolNames) && Array.isArray(e.hiddenSymbolNames) && (e.deletedSymbolNames = e.hiddenSymbolNames.map(String)), typeof e.inlineSymbolBarEnabled != "boolean" && (e.inlineSymbolBarEnabled = !0), Array.isArray(e.commands) && (e.commands = e.commands.map((e) => ({
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
			c.saveExtensionSettings();
		} catch {}
	},
	loadCustomSymbols: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().customSymbols || [];
			return Array.isArray(e) ? e.filter((e) => e && e.name && typeof e.left == "string") : [];
		} catch {
			return [];
		}
	},
	saveCustomSymbols: (e) => {
		c.getSettingsRoot().customSymbols = e, c.saveExtensionSettings();
	},
	loadInlineSymbolBarEnabled: () => {
		c.migrateLocalStorageOnce();
		let e = c.getSettingsRoot().inlineSymbolBarEnabled;
		return typeof e == "boolean" ? e : !0;
	},
	saveInlineSymbolBarEnabled: (e) => {
		c.getSettingsRoot().inlineSymbolBarEnabled = !!e, c.saveExtensionSettings();
	},
	loadDeletedNames: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().deletedSymbolNames || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveDeletedNames: (e) => {
		c.getSettingsRoot().deletedSymbolNames = [...new Set(e)], c.saveExtensionSettings();
	},
	rememberDeletedName: (e) => {
		let t = c.loadDeletedNames();
		t.includes(e) || (t.push(e), c.saveDeletedNames(t));
	},
	forgetDeletedName: (e) => c.saveDeletedNames(c.loadDeletedNames().filter((t) => t !== e)),
	loadSymbolOrder: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().symbolOrder || [];
			return Array.isArray(e) ? e.map(String) : [];
		} catch {
			return [];
		}
	},
	saveSymbolOrder: (e) => {
		c.getSettingsRoot().symbolOrder = [...new Set(e.map(String))], c.saveExtensionSettings();
	},
	applySymbolOrder: (e) => {
		let t = c.loadSymbolOrder();
		if (!t.length) return e;
		let n = new Map(t.map((e, t) => [e, t]));
		return [...e].sort((e, t) => (n.has(e.name) ? n.get(e.name) : 2 ** 53 - 1) - (n.has(t.name) ? n.get(t.name) : 2 ** 53 - 1));
	},
	getAllSymbols: () => c.applySymbolOrder(c.defaultSymbols.concat(c.loadCustomSymbols())),
	getVisibleSymbols: () => {
		let e = new Set(c.loadDeletedNames());
		return c.getAllSymbols().filter((t) => !e.has(t.name));
	},
	generateId: () => "cmd_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
	loadCommands: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().commands || [];
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
		c.getSettingsRoot().commands = e, c.saveExtensionSettings();
	},
	loadGlobalTags: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().globalTags || [];
			return Array.isArray(e) ? e : [];
		} catch {
			return [];
		}
	},
	saveGlobalTags: (e) => {
		c.getSettingsRoot().globalTags = [...new Set(e)], c.saveExtensionSettings();
	},
	getCombinedTags: () => {
		let e = c.loadCommands(), t = new Set(c.loadGlobalTags());
		return e.forEach((e) => e.tags && e.tags.forEach((e) => t.add(e))), Array.from(t).sort();
	},
	loadCategorySettings: () => {
		c.migrateLocalStorageOnce();
		try {
			let e = c.getSettingsRoot().categorySettings;
			return e && typeof e == "object" ? {
				...s,
				...e
			} : { ...s };
		} catch {
			return s;
		}
	},
	saveCategorySettings: (e) => {
		let t = c.getSettingsRoot();
		t.categorySettings = { ...e }, t.categories = Object.entries(t.categorySettings).map(([e, t]) => ({
			name: e,
			prefix: t?.prefix || "",
			suffix: t?.suffix || ""
		})), c.saveExtensionSettings();
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
		c.getDocuments().forEach((t) => {
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
		let e = new Set(c.getAllSymbols().map((e) => e.name));
		c.loadDeletedNames().filter((t) => e.has(t)).forEach((e) => c.hideButtonByName(e));
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
					let a = c.removeNamesFromObject(e, t);
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
					let a = c.removeNamesFromObject(i, t);
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
					let n = JSON.parse(i), a = c.removeNamesFromObject(n, t);
					a.changed && e.setItem(r, JSON.stringify(a.value));
				} catch {}
			}
		});
	},
	deleteCustomByNames: (e) => {
		let t = [...new Set(e.filter(Boolean))];
		if (!t.length) return;
		let n = new Set(t), r = c.loadCustomSymbols();
		if (c.saveCustomSymbols(r.filter((e) => !n.has(e.name))), t.forEach((e) => {
			c.rememberDeletedName(e), c.hideButtonByName(e);
		}), c.cleanupHelperButtonStorage(t), typeof window < "u" && window.extension_settings) {
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
		c.register();
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
	resolveEditable: (e) => e ? c.isEditable(e) ? e : e.querySelector?.("textarea, input, [contenteditable=\"true\"]") || null : null,
	getSendTextarea: () => {
		for (let e of c.getDocuments()) {
			let t = c.resolveEditable(e.querySelector("#send_textarea"));
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
				let t = c.getSendTextarea();
				t && (c.setCursor(t, e), c.notifyInput(t));
			}, t);
		});
	},
	insertByTextarea: (e) => {
		let t = c.getSendTextarea();
		if (!t) return !1;
		t.focus();
		let n = c.getElementValue(t), r = typeof t.selectionStart == "number" ? t.selectionStart : n.length, i = typeof t.selectionEnd == "number" ? t.selectionEnd : n.length, a = n.slice(r, i), o = e.left, s = e.right || "";
		return c.setElementValue(t, n.slice(0, r) + o + a + s + n.slice(i)), c.notifyInput(t), c.retryCursor(a ? r + o.length + a.length + s.length : r + o.length), !0;
	},
	insertByName: (e) => {
		let t = c.getVisibleSymbols().find((t) => t.name === e);
		t && c.insertByTextarea(t);
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
		e.id = "monkey-tools-floating-style", e.textContent = "\n            .monkey-tools-floating { position:fixed; left:calc(100vw - 76px); top:45vh; z-index:2147483000; width:64px; height:64px; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif; touch-action:none; user-select:none; overflow:visible; }\n            .monkey-tools-floating-main { width:64px; height:64px; border:none; background:transparent; color:inherit; padding:0; cursor:grab; font-size:44px; line-height:64px; font-weight:700; box-shadow:none; text-shadow:0 3px 12px rgba(0,0,0,.28); }\n            .monkey-tools-floating-main:active { cursor:grabbing; }\n            .monkey-tools-floating-main:hover { background:transparent; }\n            .monkey-tools-floating-menu { display:none; position:absolute; right:72px; top:50%; transform:translateY(-50%); width:max-content; min-width:128px; max-width:min(280px, calc(100vw - 96px)); max-height:48vh; overflow:auto; grid-template-columns:repeat(2,max-content); gap:6px; padding:10px; border:1px solid #d0d7de; border-radius:10px; background:#fff; box-shadow:0 10px 34px rgba(0,0,0,.2); touch-action:auto; }\n            .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:72px; right:auto; }\n            .monkey-tools-floating.open .monkey-tools-floating-menu { display:grid; }\n            .monkey-tools-floating-menu button { white-space:nowrap; border:1px solid #d0d7de; border-radius:8px; background:#fff; color:#24292f; padding:7px 10px; cursor:pointer; font-size:13px; font-weight:700; }\n            .monkey-tools-floating-menu button:hover { background:#f6f8fa; }\n            #monkey-tools-inline-symbols { display:none; flex-wrap:wrap; gap:4px; padding:0; border:none; background:transparent; box-shadow:none; }\n            #monkey-tools-inline-symbols button { border:1px solid rgba(0,0,0,0.12); border-radius:999px; background:rgba(255,255,255,0.9); color:#2f343a; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:600; line-height:1.2; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }\n            #monkey-tools-inline-symbols button:hover { background:rgba(255,255,255,1); border-color:rgba(0,0,0,0.18); }\n            @media (max-width: 768px) {\n                .monkey-tools-floating { left:calc(100vw - 72px); top:42vh; right:auto; bottom:auto; width:60px; height:60px; }\n                .monkey-tools-floating-main { width:60px; height:60px; padding:0; font-size:42px; line-height:60px; }\n                .monkey-tools-floating-menu { right:68px; min-width:120px; max-width:calc(100vw - 88px); max-height:42vh; grid-template-columns:1fr; }\n                .monkey-tools-floating.menu-right .monkey-tools-floating-menu { left:68px; right:auto; }\n            }\n        ", document.head.appendChild(e);
	},
	buildFloatingLauncher: () => {
		if (!document.body) {
			setTimeout(c.buildFloatingLauncher, 300);
			return;
		}
		c.ensureFloatingCss(), document.getElementById("monkey-tools-floating")?.remove();
		let e = document.createElement("div");
		e.id = "monkey-tools-floating", e.className = "monkey-tools-floating";
		let t = c.getSettingsRoot().floatingPosition;
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
				if (!r.dragging) e.classList.remove("open"), c.openCommandPanel();
				else {
					let t = e.getBoundingClientRect();
					c.getSettingsRoot().floatingPosition = {
						left: t.left,
						top: t.top
					}, c.saveExtensionSettings();
				}
				r = null, window.removeEventListener("pointermove", a), window.removeEventListener("pointercancel", s);
			}
		}, s = () => {
			r = null, window.removeEventListener("pointermove", a);
		};
		n.addEventListener("pointerdown", i), e.append(n), document.body.appendChild(e);
	},
	buildInlineSymbolBar: () => {
		if (c.stopInlineSymbolBarTracking(), c.symbolBarVisible = !1, !c.loadInlineSymbolBarEnabled()) {
			document.getElementById("monkey-tools-inline-symbols")?.remove();
			return;
		}
		document.getElementById("monkey-tools-inline-symbols")?.remove();
		let e = c.getSendTextarea();
		if (!e) {
			c.scheduleInlineSymbolBarRetry();
			return;
		}
		c.symbolBarTextarea = e;
		let t = document.createElement("div");
		t.id = "monkey-tools-inline-symbols", c.getVisibleSymbols().forEach((e) => {
			let n = document.createElement("button");
			n.type = "button", n.textContent = e.name, n.title = `插入 ${e.name}`, n.dataset.symbolName = e.name, n.style.cssText = "border:1px solid rgba(0,0,0,0.12);border-radius:999px;background:rgba(255,255,255,0.9);color:#2f343a;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:600;line-height:1.2;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);", t.appendChild(n);
		});
		let n = null, r = () => {
			c.symbolBarVisible = !1;
			let e = document.getElementById("monkey-tools-inline-symbols");
			e && (e.style.display = "none");
		}, i = () => {
			c.loadInlineSymbolBarEnabled() && (c.symbolBarVisible = !0, c.positionInlineSymbolBar());
		}, a = () => {
			n && clearTimeout(n), n = window.setTimeout(() => {
				document.activeElement === e || t.matches(":hover") || r();
			}, 120);
		};
		e.addEventListener("focusin", i), e.addEventListener("input", i), e.addEventListener("mouseup", i), e.addEventListener("keyup", i), e.addEventListener("blur", a), t.addEventListener("pointerenter", i), t.addEventListener("pointerleave", a), t.addEventListener("pointerdown", (e) => {
			let t = e.target.closest("button[data-symbol-name]");
			t && (e.preventDefault(), e.stopPropagation(), c.insertByName(t.dataset.symbolName));
		}, !0), document.body.appendChild(t), e.matches(":focus") || document.activeElement === e ? (c.symbolBarVisible = !0, c.positionInlineSymbolBar()) : r(), c.watchInlineSymbolBarHost();
	},
	positionInlineSymbolBar: () => {
		let e = document.getElementById("monkey-tools-inline-symbols"), t = c.getSendTextarea();
		if (!e || !t) return;
		c.symbolBarVisible && (e.style.display = "flex", e.style.visibility = "hidden");
		let n = t.getBoundingClientRect(), r = Math.max(220, Math.min(n.width, window.innerWidth - 24)), i = Math.max(12, Math.min(n.left, window.innerWidth - r - 12)), a = Math.max(8, n.top - (e.offsetHeight || 32) - 8);
		e.style.cssText = `position:fixed;left:${i}px;top:${a}px;width:${r}px;z-index:2147482500;display:${c.symbolBarVisible ? "flex" : "none"};visibility:visible;flex-wrap:wrap;gap:6px;align-items:center;pointer-events:auto;`;
	},
	scheduleInlineSymbolBarRetry: () => {
		c.symbolBarRetryTimer ||= window.setTimeout(() => {
			c.symbolBarRetryTimer = null, c.buildInlineSymbolBar();
		}, 600);
	},
	stopInlineSymbolBarTracking: () => {
		c.symbolBarRetryTimer &&= (clearTimeout(c.symbolBarRetryTimer), null);
	},
	watchInlineSymbolBarHost: () => {
		typeof MutationObserver > "u" || (c.symbolBarObserver && c.symbolBarObserver.disconnect(), c.symbolBarObserver = new MutationObserver(() => {
			if (!c.loadInlineSymbolBarEnabled()) {
				document.getElementById("monkey-tools-inline-symbols")?.remove();
				return;
			}
			let e = c.getSendTextarea();
			if (!e) {
				document.getElementById("monkey-tools-inline-symbols")?.remove(), c.scheduleInlineSymbolBarRetry();
				return;
			}
			if (e !== c.symbolBarTextarea) {
				c.buildInlineSymbolBar();
				return;
			}
			c.positionInlineSymbolBar();
		}), c.symbolBarObserver.observe(document.body, {
			childList: !0,
			subtree: !0
		}));
	},
	baseCss: () => "\n        <style>\n            @font-face { font-family:\"fugu\"; src:url(\"https://files.catbox.moe/5bdcr7.ttf\") format(\"truetype\"); font-display:swap; font-weight:normal; font-style:normal; }\n            :root { --monkey-tools-font:\"fugu\", var(--mainFontFamily), \"Microsoft YaHei\", sans-serif; --monkey-tools-shadow-color:var(--SmartThemeShadowColor, #80808075); --monkey-tools-shadow-width:var(--shadowWidth, 1); }\n            .punct-settings *, .punct-settings *::before, .punct-settings *::after { box-sizing: border-box; }\n            .popup:has(.punct-settings) { background:#fff !important; border:2px solid #000 !important; border-radius:0 !important; outline:1.5px solid #000 !important; outline-offset:-6px !important; box-shadow:3px 3px 3px #80808075 !important; }\n            .popup:has(.punct-settings) .popup-content, .popup:has(.punct-settings) .popup-body { background:#fff !important; border-radius:0 !important; }\n            .punct-settings { position:relative; overflow-x:hidden; overflow-y:auto; max-height:85vh; color:#000; padding:16px; width:100%; min-width:280px; max-width:620px; font-family:var(--monkey-tools-font); -webkit-overflow-scrolling: touch; background:#fff; text-shadow:0 0 calc(var(--monkey-tools-shadow-width) * 1px) var(--monkey-tools-shadow-color); }\n            .punct-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap: wrap; gap: 8px; }\n            .punct-title { font-size:18px; font-weight:800; letter-spacing:0; background:#fff; border-left:2px solid #000; outline:1.5px solid #000; outline-offset:-7px; padding:10px 18px; }\n            .main-view-tabs { display:flex; gap:8px; margin-bottom:16px; }\n            .main-view-tab { flex:1; border:1.5px solid #000; background:#fff; color:#000; border-radius:2px; padding:10px 12px; cursor:pointer; font-weight:700; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }\n            .main-view-tab.active { background:#000; color:#fff; box-shadow:inset 1px 1px 3px #a7a7a7; }\n            .main-view-tab:hover { background:#f0f0f0; }\n            \n            .punct-tabs { display:flex; gap:6px; margin-bottom:16px; background:#f0f0f0; padding:5px; border:1.5px dashed #000; border-radius:0; flex-shrink: 0; }\n            .punct-tab { flex:1; border:1.5px solid transparent; background:transparent; color:#555; border-radius:0; padding:10px 8px; cursor:pointer; font-weight:bold; transition:all 0.2s; text-align:center; font-size:14px; font-family:inherit; text-shadow:inherit; }\n            .punct-tab.active { background:#fff; color:#000; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            \n            .punct-action { border:1.5px solid #000 !important; background:#fff; color:#000; border-radius:2px !important; padding:8px 14px; cursor:pointer; font-weight:700; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:4px; box-shadow:1px 2px 5px #a7a7a7; font-family:inherit; text-shadow:inherit; }\n            .punct-action:hover { background:#f0f0f0; transform:translateY(-1px); box-shadow:3px 3px 3px #80808075; }\n            .punct-action:active { transform:translateY(0); box-shadow:none; }\n            .punct-action.active { background:#e7e7e7; border-color:#000 !important; box-shadow:inset 1px 1px 3px #a7a7a7; transform:none; }\n            \n            .punct-panel { border:1.5px solid #000; border-radius:0; padding:16px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; }\n            .punct-field { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; width: 100%; }\n            .punct-field label { font-size:12px; font-weight:700; opacity:1; color:#000; }\n            .punct-field input, .punct-field select, .punct-field textarea, .cmd-search { border:1.5px dashed #000; border-radius:2px; padding:10px 12px; background:#f0f0f0; transition:all 0.2s; outline:none; font-family:inherit; color:#000; width: 100%; text-shadow:inherit; }\n            .punct-field input:focus, .punct-field textarea:focus, .punct-field select:focus, .cmd-search:focus { background:#fff; border-color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            \n            .cmd-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap: wrap; flex-shrink: 0; }\n            .cmd-search { flex:1; min-width: 150px; height:38px; }\n            .cmd-filter-bar { display:flex; flex-wrap:wrap; gap:6px; flex:1; }\n            .cmd-tag { font-size:12px; padding:4px 12px; border-radius:2px; background:#fff; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; font-weight:700; border:1.5px dashed #000; text-shadow:inherit; }\n            .cmd-tag:hover { background:#f0f0f0; color:#000; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag.active { background:#000; color:#fff; box-shadow:1px 2px 5px #a7a7a7; border-style:solid; }\n            \n            .cmd-editor-wrap { border:1.5px solid #000; background:#fff; padding:16px; border-radius:0; margin-bottom:16px; display:none; box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-tag-editor { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; align-items:center; }\n            .cmd-tag-add { border:1.5px dashed #000; background:#fff; display:flex; align-items:center; padding:2px 8px; border-radius:2px; transition:border-color 0.2s; }\n            .cmd-tag-add:focus-within { border-color:#222; }\n            .cmd-tag-add input { border:none; background:transparent; width:70px; outline:none; font-size:12px; padding:4px 0; font-family:inherit; text-shadow:inherit; }\n            \n            .cmd-list-wrap { max-height:50vh; overflow-y:auto; padding-right:8px; display:flex; flex-direction:column; gap:12px; scrollbar-width: none; scrollbar-color: transparent transparent; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }\n            .cmd-list-wrap::-webkit-scrollbar { width:6px; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb { background:transparent; border-radius:0; }\n            .cmd-list-wrap::-webkit-scrollbar-thumb:hover { background:transparent; }\n            \n            .cmd-row { border:1.5px solid #000; border-radius:0; padding:14px; background:#fff; cursor:pointer; display:flex; gap:12px; transition:all 0.25s; box-shadow:1px 2px 5px #a7a7a7; position:relative; overflow:hidden; align-items: center; flex-shrink: 0; }\n            .cmd-row:hover { border-color:#000; box-shadow:3px 3px 3px #80808075; transform:translateY(-1px); }\n            .cmd-row.favorite { border-left:4px solid #000; }\n            .cmd-row.dragging { opacity:.55; border-style:dashed; box-shadow:none; transform:none; }\n            .drag-handle { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:2px; color:#000; background:#f0f0f0; border:1.5px dashed #000; cursor:grab; flex-shrink:0; font-weight:900; line-height:1; touch-action:none; }\n            .drag-handle:active { cursor:grabbing; }\n            .symbol-edit-row { touch-action:auto; }\n            .symbol-edit-row.reorder-active { touch-action:none; }\n            @media (hover:none), (pointer:coarse) {\n                .drag-handle { width:42px; height:42px; font-size:18px; }\n                .symbol-edit-row { min-height:58px; padding:8px 10px !important; gap:10px; }\n                .symbol-edit-row input[type=\"checkbox\"] { width:22px; height:22px; }\n            }\n             \n            .cmd-content { flex:1; display:flex; flex-direction:column; gap:6px; min-width: 0; }\n            .cmd-title { font-weight:800; font-size:15px; color:#000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n            .cmd-text { font-size:12px; color:#333; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-all; }\n            .cmd-tags-display { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }\n            .cmd-tag-mini { font-size:11px; background:#f0f0f0; color:#000; padding:2px 8px; border-radius:2px; font-weight:700; white-space: nowrap; border:1px dashed #000; }\n            \n            .cmd-actions { display:flex; flex-direction:column; gap:10px; align-items:center; justify-content:center; border-left:1.5px dashed #000; padding-left:12px; flex-shrink:0; }\n            .cmd-btn-icon { cursor:pointer; font-size:16px; opacity:0.5; transition:all 0.2s; user-select:none; }\n            .cmd-btn-icon:hover { opacity:1; transform:scale(1.1); }\n            .cmd-btn-heart { color:#000; opacity:1; }\n            \n            .tag-manage-btn { background:#fff; border:1.5px solid #000; color:#000; cursor:pointer; font-size:12px; font-weight:700; padding:6px 12px; border-radius:2px; white-space:nowrap; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; font-family:inherit; text-shadow:inherit; box-shadow:1px 2px 5px #a7a7a7; }\n            .tag-manage-btn:hover { background:#f0f0f0; color:#000; box-shadow:3px 3px 3px #80808075; }\n            .tag-manage-btn.back-mode { width:34px; height:34px; padding:0; border-radius:2px; background:#fff; box-shadow:1px 2px 5px #a7a7a7; color:#000; }\n            .tag-manage-btn.back-mode:hover { transform:scale(1.04); box-shadow:3px 3px 3px #80808075; background:#f0f0f0; }\n\n            .cmd-modal-overlay { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; background:rgba(255,255,255,0.72); backdrop-filter:none; -webkit-backdrop-filter:none; z-index:9999; border-radius:0; display:none; }\n            .cmd-confirm-box { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; border:2px solid #000; border-radius:0; padding:24px; box-shadow:3px 3px 3px #80808075; text-align:center; width:85%; max-width:320px; box-sizing:border-box; outline:1.5px solid #000; outline-offset:-6px; }\n            .cmd-confirm-text { font-size:15px; font-weight:700; color:#000; margin-bottom:20px; line-height:1.6; word-break:break-all; white-space:pre-wrap; }\n            .cmd-confirm-actions { display:flex; justify-content:center; gap:12px; }\n\n            .cmd-quick-inserts { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }\n            .cmd-quick-btn { font-size:12px; font-weight:700; padding:4px 8px; border-radius:2px; background:#fff; border:1.5px dashed #000; color:#000; cursor:pointer; user-select:none; transition:all 0.2s; text-shadow:inherit; }\n            .cmd-quick-btn:hover { background:#f0f0f0; color:#000; border-color:#000; transform:translateY(-1px); box-shadow:1px 2px 5px #a7a7a7; }\n            .cmd-quick-btn:active { transform:scale(0.95); }\n        </style>\n    ",
	modalHtml: "\n        <div class=\"cmd-modal-overlay\" id=\"custom-modal-layer\">\n            <div class=\"cmd-confirm-box\">\n                <div class=\"cmd-confirm-text\" id=\"custom-modal-msg\"></div>\n                <input type=\"text\" id=\"custom-modal-input\" style=\"display:none; width:100%; box-sizing:border-box; margin-bottom:16px; padding:10px; border-radius:8px; border:1px solid rgba(0,0,0,0.15); font-family:inherit; outline:none;\">\n                <div class=\"cmd-confirm-actions\">\n                    <button class=\"punct-action\" id=\"custom-modal-cancel\" style=\"background:#fff; color:#000;\">取消</button>\n                    <button class=\"punct-action\" id=\"custom-modal-ok\" style=\"background:#000; color:#fff;\">确定</button>\n                </div>\n            </div>\n        </div>\n    ",
	openCommandPanel: (e = "commands") => {
		if (!window.jQuery) {
			window.toastr?.error("当前环境缺少 jQuery，无法打开指令面板。");
			return;
		}
		let t = window.jQuery, n = {
			activeView: e === "symbols" ? "symbols" : "commands",
			activeTab: Object.keys(s)[0],
			searchText: "",
			filterTags: [],
			editingId: null,
			editorTags: [],
			isTagManageMode: !1,
			symbolView: "add"
		}, r = [
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
			...c.getVisibleSymbols()
		].map((e) => `<span class="cmd-quick-btn" data-left="${c.escapeHtml(e.left)}" data-right="${c.escapeHtml(e.right || "")}">${c.escapeHtml(e.name)}</span>`).join(""), i = t(`
            <div class="punct-settings">
                ${c.baseCss()}
                <div class="punct-head">
                    <div class="punct-title">\u5E38\u7528\u6307\u4EE4\u5E93</div>
                    <div style="display:flex; gap:8px;">
                        <button class="punct-action" id="cmd-import-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5408\u5E76\u5BFC\u5165JSON\u6587\u4EF6">\uD83D\uDCE5 \u5BFC\u5165</button>
                        <button class="punct-action" id="cmd-export-btn" style="padding:4px 10px; font-size:12px; min-height:28px;" title="\u5BFC\u51FA\u6240\u6709\u6570\u636E\u5907\u4EFD">\uD83D\uDCE4 \u5BFC\u51FA</button>
                        <input type="file" id="cmd-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
                <div class="main-view-tabs">
                    <button class="main-view-tab ${n.activeView === "commands" ? "active" : ""}" data-main-view="commands" type="button">\u6307\u4EE4\u4ED3\u5E93</button>
                    <button class="main-view-tab ${n.activeView === "symbols" ? "active" : ""}" data-main-view="symbols" type="button">\u7B26\u53F7\u7F16\u8F91</button>
                </div>

                <div data-main-panel="commands">
                <div class="punct-tabs" id="cmd-tabs-container">
                    ${Object.keys(s).map((e) => `<button class="punct-tab ${n.activeTab === e ? "active" : ""}" data-cat="${e}">${e}</button>`).join("")}
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
                        <div class="cmd-quick-inserts">${r}</div>
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
                        <button class="punct-tab ${n.symbolView === "add" ? "active" : ""}" data-symbol-view="add">\u65B0\u589E</button>
                        <button class="punct-tab ${n.symbolView === "edit" ? "active" : ""}" data-symbol-view="edit">\u7F16\u8F91</button>
                    </div>
                    <div class="punct-panel" data-symbol-content></div>
                </div>
                ${c.modalHtml}
            </div>
        `), a = null, o = !1, l = (e) => {
			i.find("#custom-modal-msg").text(e.msg), a = e.onOk, o = !!e.prompt;
			let t = i.find("#custom-modal-input");
			o ? (t.val(e.defaultVal || "").show(), i.find("#custom-modal-ok").css("background", "#222").text("确定")) : (t.hide(), e.isAlert ? i.find("#custom-modal-ok").css("background", "#222").text("我知道了") : i.find("#custom-modal-ok").css("background", "#000").text("确定操作")), e.isAlert ? i.find("#custom-modal-cancel").hide() : i.find("#custom-modal-cancel").show(), i.find("#custom-modal-layer").fadeIn(150), o && setTimeout(() => t.focus(), 160);
		};
		i.find("#custom-modal-cancel").on("click", () => {
			a = null, i.find("#custom-modal-layer").fadeOut(150);
		}), i.find("#custom-modal-ok").on("click", () => {
			let e = o ? i.find("#custom-modal-input").val() : !0;
			a && a(e), i.find("#custom-modal-layer").fadeOut(150);
		}), i.find("#cmd-export-btn").on("click", () => {
			let e = {
				version: 1,
				commands: c.loadCommands(),
				categories: c.loadCategorySettings(),
				tags: c.loadGlobalTags(),
				symbols: c.loadCustomSymbols()
			}, t = new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }), n = URL.createObjectURL(t), r = document.createElement("a");
			r.href = n, r.download = `sillytavern_commands_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, document.body.appendChild(r), r.click(), document.body.removeChild(r), URL.revokeObjectURL(n), window.toastr && toastr.success("数据导出成功！");
		}), i.find("#cmd-import-btn").on("click", () => {
			i.find("#cmd-import-file").click();
		}), i.find("#cmd-import-file").on("change", function(e) {
			let t = e.target.files[0];
			if (!t) return;
			let n = new FileReader();
			n.onload = function(e) {
				try {
					let t = JSON.parse(e.target.result);
					if (!t.commands && !t.categories && !t.symbols && !t.tags) throw Error("Invalid Format");
					l({
						msg: "即将导入备份数据！\n为防止误删，导入的数据将与现有数据进行【合并】。\n是否继续？",
						onOk: () => {
							let e = Array.isArray(t.commands) ? t.commands : [], n = c.loadCommands(), r = 0;
							if (e.forEach((e) => {
								n.find((t) => t.title === e.title && t.text === e.text) || (e.id = c.generateId(), n.push(e), r++);
							}), c.saveCommands(n), t.categories) {
								let e = c.loadCategorySettings();
								Object.keys(t.categories).forEach((n) => e[n] = t.categories[n]), c.saveCategorySettings(e);
							}
							if (Array.isArray(t.tags)) {
								let e = c.loadGlobalTags();
								t.tags.forEach((t) => {
									e.includes(t) || e.push(t);
								}), c.saveGlobalTags(e);
							}
							if (Array.isArray(t.symbols)) {
								let e = c.loadCustomSymbols();
								t.symbols.forEach((t) => {
									!e.find((e) => e.name === t.name) && t.name && typeof t.left == "string" && e.push(t);
								}), c.saveCustomSymbols(e), c.register();
							}
							d(), window.toastr && toastr.success(`\u5BFC\u5165\u6210\u529F\uFF01\u5171\u65B0\u589E ${r} \u6761\u6307\u4EE4\u3002`);
						}
					});
				} catch {
					l({
						msg: "读取失败：文件格式不正确或已损坏！",
						isAlert: !0
					});
				}
				i.find("#cmd-import-file").val("");
			}, n.readAsText(t);
		});
		let u = null;
		i.on("focus", "#cmd-input-title, #cmd-input-text, #cmd-cat-prefix, #cmd-cat-suffix", function() {
			u = this;
		}), i.on("click", ".cmd-quick-btn", function(e) {
			e.preventDefault();
			let n = t(this).attr("data-left") || "", r = t(this).attr("data-right") || "";
			u ||= i.find("#cmd-input-text")[0], u.focus();
			let a = u.selectionStart || 0, o = u.selectionEnd || 0, s = u.value || "", c = s.slice(a, o), l = s.slice(0, a) + n + c + r + s.slice(o);
			u.value = l, t(u).trigger("input");
			let d = a + n.length + c.length;
			u.setSelectionRange(d, d);
		});
		let d = () => {
			let e = c.loadCommands(), t = c.getCombinedTags();
			if (n.isTagManageMode) {
				i.find(".cmd-toolbar, #cmd-filter-container, #cmd-editor-panel, #cmd-cat-panel").hide(), i.find("#cmd-manage-tags-btn").html("<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" stroke=\"currentColor\" stroke-width=\"2.5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 12H5M12 19l-7-7 7-7\"/></svg>").addClass("back-mode").attr("title", "返回列表");
				let e = "\n                    <div style=\"display:flex; gap:8px; margin-bottom:12px;\">\n                        <input type=\"text\" id=\"manage-new-tag-input\" class=\"cmd-search\" placeholder=\"输入新标签名称...\" style=\"height:38px;\">\n                        <button class=\"punct-action\" id=\"manage-add-tag-btn\" style=\"height:38px; background:#000; color:#fff; padding:0 16px;\">新增标签</button>\n                    </div>\n                ";
				if (t.length === 0) i.find("#cmd-list-container").html(e + "<div style=\"text-align:center; padding:30px; color:#999;\">当前没有任何标签</div>");
				else {
					let n = t.map((e) => `
                        <div class="cmd-row" style="align-items:center;">
                            <div class="cmd-content" style="flex-direction:row; align-items:center;">
                                <div class="cmd-tag active" style="cursor:default; box-shadow:none;">${c.escapeHtml(e)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="punct-action tag-edit-btn" data-tag="${c.escapeHtml(e)}" style="padding:6px 12px; font-size:12px;">\u91CD\u547D\u540D</button>
                                <button class="punct-action tag-del-btn" data-tag="${c.escapeHtml(e)}" style="padding:6px 12px; font-size:12px; color:#000;">\u5220\u9664</button>
                            </div>
                        </div>
                    `).join("");
					i.find("#cmd-list-container").html(e + n);
				}
				return;
			}
			i.find(".cmd-toolbar, #cmd-filter-container").show(), i.find("#cmd-manage-tags-btn").html("管理标签").removeClass("back-mode").removeAttr("title"), i.find("#cmd-toggle-cat-btn").hasClass("active") ? (i.find("#cmd-cat-panel").css("display", "block"), i.find("#current-cat-name").text(n.activeTab)) : i.find("#cmd-cat-panel").css("display", "none"), n.editingId || i.find("#cmd-toggle-editor-btn").text().includes("收起") ? i.find("#cmd-editor-panel").css("display", "block") : i.find("#cmd-editor-panel").css("display", "none"), i.find("#cmd-filter-container").html(t.map((e) => `<div class="cmd-tag ${n.filterTags.includes(e) ? "active" : ""}" data-tag="${c.escapeHtml(e)}">${c.escapeHtml(e)}</div>`).join("") + (n.filterTags.length > 0 ? "<div class=\"cmd-tag active\" style=\"background:#000;\" id=\"cmd-clear-filter\">✖ 清除筛选</div>" : ""));
			let r = Array.from(new Set([...t, ...n.editorTags])).sort();
			i.find("#cmd-editor-tags").html(r.map((e) => `<div class="cmd-tag ${n.editorTags.includes(e) ? "active" : ""} editor-tag-btn" data-tag="${c.escapeHtml(e)}">${c.escapeHtml(e)}</div>`).join("") + "<div class=\"cmd-tag-add\"><input type=\"text\" id=\"cmd-new-tag-input\" placeholder=\"+新标签\"><button id=\"cmd-add-tag-btn\" style=\"border:none;background:none;cursor:pointer;font-weight:bold;color:#666;\">✔</button></div>");
			let a = e.filter((e) => e.category === n.activeTab);
			if (n.filterTags.length > 0 && (a = a.filter((e) => e.tags && n.filterTags.every((t) => e.tags.includes(t)))), n.searchText) {
				let e = n.searchText.toLowerCase();
				a = a.filter((t) => t.title && t.title.toLowerCase().includes(e) || t.text.toLowerCase().includes(e) || t.tags && t.tags.some((t) => t.toLowerCase().includes(e)));
			}
			if (a.sort((e, t) => e.isFavorite === t.isFavorite ? t.timestamp - e.timestamp : e.isFavorite ? -1 : 1), a.length === 0) i.find("#cmd-list-container").html("<div style=\"text-align:center; padding:40px; color:#999;\">没有找到指令</div>");
			else {
				let e = a.map((e) => {
					let t = e.title || e.text.substring(0, 10);
					return `
                    <div class="cmd-row ${e.isFavorite ? "favorite" : ""}" data-id="${e.id}">
                        <div class="cmd-content copy-trigger">
                            <div class="cmd-title">${c.escapeHtml(t)}</div>
                            <div class="cmd-text">${c.escapeHtml(e.text)}</div>
                            ${e.tags && e.tags.length ? `<div class="cmd-tags-display">${e.tags.map((e) => `<span class="cmd-tag-mini">${c.escapeHtml(e)}</span>`).join("")}</div>` : ""}
                        </div>
                        <div class="cmd-actions">
                            <div class="cmd-btn-icon ${e.isFavorite ? "cmd-btn-heart" : ""} fav-trigger" title="${e.isFavorite ? "取消常用" : "设为常用"}">${e.isFavorite ? "❤" : "♡"}</div>
                            <div class="cmd-btn-icon edit-trigger" title="\u4FEE\u6539">\u270E</div>
                            <div class="cmd-btn-icon del-trigger" style="color:#000;" title="\u5220\u9664">\u2716</div>
                        </div>
                    </div>
                `;
				});
				i.find("#cmd-list-container").html(e.join(""));
			}
		}, f = () => {
			i.find("[data-symbol-content]").html("\n                <div class=\"punct-field\"><label>类型</label><select data-symbol-add-type><option value=\"single\">单独标点</option><option value=\"pair\">成对标点</option></select></div>\n                <div class=\"punct-field\"><label>按钮名称</label><input data-symbol-add-name placeholder=\"显示在按钮上\"></div>\n                <div style=\"display:grid; grid-template-columns:1fr 1fr; gap:12px;\">\n                    <div class=\"punct-field\"><label data-symbol-left-label>要插入的符号</label><input data-symbol-add-left></div>\n                    <div class=\"punct-field\" data-symbol-right-wrap style=\"display:none;\"><label>右侧符号</label><input data-symbol-add-right></div>\n                </div>\n                <div style=\"display:flex; justify-content:flex-end; margin-top:16px;\"><button class=\"punct-action\" data-symbol-save-add style=\"background:#000; color:#fff;\">保存</button></div>\n            "), i.find("[data-symbol-add-type]").on("change", function() {
				let e = window.jQuery(this).val() === "pair";
				i.find("[data-symbol-right-wrap]").toggle(e), i.find("[data-symbol-left-label]").text(e ? "左侧符号" : "要插入的符号");
			}), i.find("[data-symbol-save-add]").on("click", () => {
				let e = i.find("[data-symbol-add-type]").val(), t = String(i.find("[data-symbol-add-name]").val() || "").trim(), n = String(i.find("[data-symbol-add-left]").val() || ""), r = e === "pair" ? String(i.find("[data-symbol-add-right]").val() || "") : "";
				if (!t || !n || e === "pair" && !r) return l({
					msg: "请填完必填项。",
					isAlert: !0
				});
				let a = c.loadCustomSymbols();
				a.push({
					name: t,
					left: n,
					right: r
				}), c.saveCustomSymbols(a), c.forgetDeletedName(t), c.register(), m();
			});
		}, p = (e, t) => {
			i.find("[data-symbol-content]").html(`
                <div class="punct-field"><label>\u6309\u94AE\u540D\u79F0</label><input data-symbol-edit-name value="${c.escapeHtml(e.name)}"></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="punct-field"><label>\u5DE6\u4FA7\u7B26\u53F7</label><input data-symbol-edit-left value="${c.escapeHtml(e.left)}"></div>
                    <div class="punct-field"><label>\u53F3\u4FA7\u7B26\u53F7 (\u53EF\u7559\u7A7A)</label><input data-symbol-edit-right value="${c.escapeHtml(e.right || "")}"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                    <button class="punct-action" data-symbol-back-edit style="background:#fff; color:#000;">\u8FD4\u56DE</button>
                    <button class="punct-action" data-symbol-save-edit style="background:#000; color:#fff;">\u4FDD\u5B58</button>
                </div>
            `), i.find("[data-symbol-back-edit]").on("click", m), i.find("[data-symbol-save-edit]").on("click", () => {
				let e = String(i.find("[data-symbol-edit-name]").val() || "").trim(), n = String(i.find("[data-symbol-edit-left]").val() || ""), r = String(i.find("[data-symbol-edit-right]").val() || "");
				if (!e || !n) return l({
					msg: "必填项不能为空",
					isAlert: !0
				});
				e !== t && (c.rememberDeletedName(t), c.hideButtonByName(t), c.forgetDeletedName(e));
				let a = c.loadCustomSymbols(), o = a.findIndex((e) => e.name === t);
				o !== -1 && (a[o] = {
					name: e,
					left: n,
					right: r
				}, c.saveCustomSymbols(a), c.register(), m());
			});
		}, m = () => {
			let e = c.getVisibleSymbols(), t = new Set(c.defaultSymbols.map((e) => e.name)), n = e.length ? e.map((e) => {
				let n = t.has(e.name);
				return `<div class="cmd-row symbol-edit-row" data-name="${c.escapeHtml(e.name)}" draggable="true" style="align-items:center; padding:10px 14px;">
                    <span class="drag-handle" title="\u62D6\u52A8\u6392\u5E8F">=</span>
                    <input type="checkbox" data-pick>
                    <div class="cmd-content"><div class="cmd-text" style="font-weight:600; font-size:14px; color:#111;">${c.escapeHtml(e.name)}</div></div>
                    <button class="punct-action" data-symbol-edit-one ${n ? "style=\"opacity:.45;\" title=\"默认按钮只能删\"" : ""}>\u4FEE\u6539</button>
                </div>`;
			}).join("") : "<div style=\"text-align:center; padding:20px; color:#999;\">暂无可编辑按钮</div>";
			i.find("[data-symbol-content]").html(`<div class="cmd-list-wrap" id="symbol-list-wrap">${n}</div><div style="display:flex; justify-content:flex-end; margin-top:16px;"><button class="punct-action" style="color:#000;" data-symbol-delete-picked>\u5220\u9664\u9009\u4E2D</button></div>`);
			let r = i.find("#symbol-list-wrap"), a = null, o = null, s = () => {
				let e = r.find(".cmd-row").map(function() {
					return window.jQuery(this).attr("data-name");
				}).get();
				c.saveSymbolOrder(e), c.register();
			};
			r.on("dragstart", ".cmd-row", function(e) {
				a = this, window.jQuery(this).addClass("dragging"), e.originalEvent.dataTransfer.effectAllowed = "move", e.originalEvent.dataTransfer.setData("text/plain", window.jQuery(this).attr("data-name"));
			}), r.on("dragover", ".cmd-row", function(e) {
				e.preventDefault();
				let t = window.jQuery(this);
				if (!a || this === a) return;
				let n = this.getBoundingClientRect();
				e.originalEvent.clientY > n.top + n.height / 2 ? t.after(a) : t.before(a);
			}), r.on("dragend", ".cmd-row", function() {
				window.jQuery(this).removeClass("dragging"), a && s(), a = null;
			}), r.on("pointerdown", ".drag-handle", function(e) {
				let t = window.jQuery(this).closest(".cmd-row")[0];
				if (t) {
					a = t, o = e.originalEvent.pointerId;
					try {
						this.setPointerCapture?.(o);
					} catch {}
					window.jQuery(t).addClass("dragging reorder-active"), window.jQuery(document).one("pointerup pointercancel", () => {
						a && (window.jQuery(a).removeClass("dragging reorder-active"), s(), a = null, o = null);
					}), e.preventDefault();
				}
			}), r.on("pointermove", function(e) {
				if (!a || o !== null && e.originalEvent.pointerId !== o) return;
				let t = e.originalEvent, n = document.elementFromPoint(t.clientX, t.clientY)?.closest?.(".cmd-row");
				if (!n || n === a || !window.jQuery.contains(r[0], n)) return;
				let i = n.getBoundingClientRect();
				t.clientY > i.top + i.height / 2 ? window.jQuery(n).after(a) : window.jQuery(n).before(a), e.preventDefault();
			}), i.find("[data-symbol-edit-one]").on("click", function() {
				let e = window.jQuery(this).closest(".cmd-row").attr("data-name");
				if (t.has(e)) return l({
					msg: "默认自带标点仅支持删除",
					isAlert: !0
				});
				let n = c.loadCustomSymbols().find((t) => t.name === e);
				n && p(n, e);
			}), i.find("[data-symbol-delete-picked]").on("click", () => {
				let e = i.find("[data-pick]:checked").map(function() {
					return window.jQuery(this).closest(".cmd-row").attr("data-name");
				}).get();
				if (!e.length) return l({
					msg: "请先勾选",
					isAlert: !0
				});
				l({
					msg: `\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 ${e.length} \u4E2A\u6807\u70B9\u6309\u94AE\u5417\uFF1F`,
					onOk: () => {
						c.deleteCustomByNames(e), m();
					}
				});
			});
		}, h = () => {
			let e = c.loadInlineSymbolBarEnabled();
			i.find("#symbol-inline-toggle").prop("checked", e), i.find("#symbol-tabs-container .punct-tab").removeClass("active"), i.find(`#symbol-tabs-container [data-symbol-view="${n.symbolView}"]`).addClass("active"), n.symbolView === "edit" ? m() : f();
		}, g = () => {
			let e = n.activeView === "symbols" ? "symbols" : "commands";
			n.activeView = e, i.find("[data-main-panel]").hide(), i.find(`[data-main-panel="${e}"]`).show(), i.find(".main-view-tab").removeClass("active"), i.find(`.main-view-tab[data-main-view="${e}"]`).addClass("active"), e === "symbols" ? h() : d();
		}, _ = () => {
			n.editingId = null, n.editorTags = [], i.find("#cmd-input-title").val(""), i.find("#cmd-input-text").val(""), i.find("#cmd-editor-panel").css("display", "none"), i.find("#cmd-toggle-editor-btn").text("➕ 新建"), i.find("#cmd-save-btn").text("保存指令"), d();
		};
		i.on("click", ".main-view-tab", function() {
			n.activeView = String(t(this).attr("data-main-view")) === "symbols" ? "symbols" : "commands", g();
		}), i.on("change", "#symbol-inline-toggle", function() {
			c.saveInlineSymbolBarEnabled(!!this.checked), c.register(), h();
		}), i.on("click", "#symbol-tabs-container [data-symbol-view]", function() {
			n.symbolView = String(t(this).attr("data-symbol-view")) === "edit" ? "edit" : "add", h();
		}), i.on("click", "#cmd-tabs-container .punct-tab", function() {
			if (i.find("#cmd-tabs-container .punct-tab").removeClass("active"), t(this).addClass("active"), n.activeTab = t(this).data("cat"), n.filterTags = [], n.searchText = "", i.find("#cmd-search-input").val(""), n.isTagManageMode = !1, i.find("#cmd-toggle-cat-btn").hasClass("active")) {
				let e = c.loadCategorySettings()[n.activeTab] || {
					prefix: "",
					suffix: ""
				};
				i.find("#cmd-cat-prefix").val(e.prefix), i.find("#cmd-cat-suffix").val(e.suffix);
			}
			n.editingId && (n.editingId = null, i.find("#cmd-save-btn").text("保存指令")), d();
		}), i.on("click", "#cmd-toggle-cat-btn", function() {
			if (t(this).hasClass("active")) t(this).removeClass("active"), d();
			else {
				_(), t(this).addClass("active");
				let e = c.loadCategorySettings()[n.activeTab] || {
					prefix: "",
					suffix: ""
				};
				i.find("#cmd-cat-prefix").val(e.prefix), i.find("#cmd-cat-suffix").val(e.suffix), d();
			}
		}), i.find("#cmd-cat-cancel-btn").on("click", () => {
			i.find("#cmd-toggle-cat-btn").removeClass("active"), d();
		}), i.find("#cmd-cat-save-btn").on("click", () => {
			let e = i.find("#cmd-cat-prefix").val(), t = i.find("#cmd-cat-suffix").val(), r = c.loadCategorySettings();
			r[n.activeTab] || (r[n.activeTab] = {}), r[n.activeTab].prefix = e, r[n.activeTab].suffix = t, c.saveCategorySettings(r), d(), window.toastr && toastr.success("格式保存成功");
		}), i.on("click", "#cmd-manage-tags-btn", () => {
			n.isTagManageMode = !n.isTagManageMode, n.isTagManageMode && (_(), i.find("#cmd-toggle-cat-btn").removeClass("active")), d();
		}), i.on("click", "#manage-add-tag-btn", function() {
			let e = i.find("#manage-new-tag-input").val().trim();
			if (!e) return;
			let t = c.loadGlobalTags();
			t.includes(e) ? l({
				msg: "标签已存在",
				isAlert: !0
			}) : (t.push(e), c.saveGlobalTags(t), d(), setTimeout(() => i.find("#manage-new-tag-input").focus(), 10));
		}), i.on("click", ".tag-edit-btn", function() {
			let e = String(t(this).attr("data-tag"));
			l({
				msg: `\u5C06\u6807\u7B7E [${e}] \u91CD\u547D\u540D\u4E3A:`,
				prompt: !0,
				defaultVal: e,
				onOk: (t) => {
					if (t && t.trim() && t.trim() !== e) {
						let r = t.trim(), i = c.loadCommands();
						i.forEach((t) => {
							t.tags && t.tags.includes(e) && (t.tags = t.tags.map((t) => t === e ? r : t));
						}), c.saveCommands(i);
						let a = c.loadGlobalTags();
						a.includes(e) && (a[a.indexOf(e)] = r, c.saveGlobalTags(a)), n.filterTags.includes(e) && (n.filterTags = n.filterTags.map((t) => t === e ? r : t)), d();
					}
				}
			});
		}), i.on("click", ".tag-del-btn", function() {
			let e = String(t(this).attr("data-tag"));
			l({
				msg: `\u786E\u5B9A\u8981\u5168\u5C40\u5220\u9664\u6807\u7B7E [${e}] \u5417\uFF1F\n\u5305\u542B\u6B64\u6807\u7B7E\u7684\u6307\u4EE4\u4E0D\u4F1A\u88AB\u5220\u9664\uFF0C\u53EA\u662F\u5931\u53BB\u8BE5\u6807\u7B7E\u3002`,
				onOk: () => {
					let t = c.loadCommands();
					t.forEach((t) => {
						t.tags && t.tags.includes(e) && (t.tags = t.tags.filter((t) => t !== e));
					}), c.saveCommands(t);
					let r = c.loadGlobalTags();
					r = r.filter((t) => t !== e), c.saveGlobalTags(r), n.filterTags.includes(e) && (n.filterTags = n.filterTags.filter((t) => t !== e)), d();
				}
			});
		}), i.on("click", ".editor-tag-btn", function() {
			let e = String(t(this).attr("data-tag"));
			n.editorTags.includes(e) ? n.editorTags = n.editorTags.filter((t) => t !== e) : n.editorTags.push(e), d();
		}), i.on("click", "#cmd-add-tag-btn", function(e) {
			e.preventDefault();
			let t = i.find("#cmd-new-tag-input").val().trim();
			if (t && !n.editorTags.includes(t)) {
				n.editorTags.push(t);
				let e = c.loadGlobalTags();
				e.includes(t) || (e.push(t), c.saveGlobalTags(e));
			}
			d(), setTimeout(() => i.find("#cmd-new-tag-input").focus(), 10);
		}), i.find("#cmd-search-input").on("input", function() {
			n.searchText = t(this).val().trim(), d();
		}), i.on("click", ".cmd-filter-bar .cmd-tag", function() {
			if (t(this).attr("id") === "cmd-clear-filter") n.filterTags = [];
			else {
				let e = String(t(this).attr("data-tag"));
				n.filterTags.includes(e) ? n.filterTags = n.filterTags.filter((t) => t !== e) : n.filterTags.push(e);
			}
			d();
		}), i.on("click", "#cmd-toggle-editor-btn", function() {
			let e = i.find("#cmd-editor-panel");
			e.css("display") === "none" ? (_(), i.find("#cmd-toggle-cat-btn").removeClass("active"), e.css("display", "block"), t(this).text("▲ 收起"), d()) : _();
		}), i.find("#cmd-cancel-btn").on("click", _), i.find("#cmd-save-btn").on("click", () => {
			let e = i.find("#cmd-input-text").val().trim();
			if (!e) return l({
				msg: "指令内容不能为空！",
				isAlert: !0
			});
			let t = i.find("#cmd-input-title").val().trim() || e.substring(0, 10), r = c.loadCommands();
			if (n.editingId) {
				let i = r.findIndex((e) => e.id === n.editingId);
				i !== -1 && (r[i].title = t, r[i].text = e, r[i].tags = [...n.editorTags]);
			} else r.push({
				id: c.generateId(),
				category: n.activeTab,
				title: t,
				text: e,
				isFavorite: !1,
				tags: [...n.editorTags],
				timestamp: Date.now()
			});
			c.saveCommands(r), _();
		}), i.on("click", ".copy-trigger", function() {
			let e = t(this).closest(".cmd-row").data("id"), n = c.loadCommands().find((t) => t.id === e);
			if (n) {
				let e = c.loadCategorySettings()[n.category] || {
					prefix: "",
					suffix: ""
				};
				c.copyToClipboard((e.prefix || "") + n.text + (e.suffix || ""));
			}
		}), i.on("click", ".fav-trigger", function(e) {
			e.stopPropagation();
			let n = t(this).closest(".cmd-row").data("id"), r = c.loadCommands(), i = r.findIndex((e) => e.id === n);
			i !== -1 && (r[i].isFavorite = !r[i].isFavorite, c.saveCommands(r), d());
		}), i.on("click", ".edit-trigger", function(e) {
			e.stopPropagation();
			let r = t(this).closest(".cmd-row").data("id"), a = c.loadCommands().find((e) => e.id === r);
			a && (n.editingId = a.id, n.editorTags = [...a.tags || []], i.find("#cmd-input-title").val(a.title || ""), i.find("#cmd-input-text").val(a.text), i.find("#cmd-toggle-cat-btn").removeClass("active"), i.find("#cmd-editor-panel").css("display", "block"), i.find("#cmd-toggle-editor-btn").text("▲ 收起"), i.find("#cmd-save-btn").text("保存修改"), d());
		}), i.on("click", ".del-trigger", function(e) {
			e.stopPropagation();
			let n = t(this).closest(".cmd-row").data("id"), r = c.loadCommands().find((e) => e.id === n);
			r && l({
				msg: `\u4F60\u786E\u5B9A\u5220\u9664 [${r.category}] \u4E0B\u9762\u7684 1 \u6761\u6307\u4EE4\u5417\uFF1F`,
				onOk: () => {
					let e = c.loadCommands().filter((e) => e.id !== n);
					c.saveCommands(e), d();
				}
			});
		}), g(), c.openPopup(i, {
			okButton: "关闭",
			forceCustom: !0
		});
	},
	openSettings: () => {
		c.openCommandPanel("symbols");
	},
	bindButton: (e, t) => {
		c.boundNames[e] || (window.eventOn(window.getButtonEvent(e), t), c.boundNames[e] = !0);
	},
	register: () => {
		c.buildInlineSymbolBar();
	}
};
setTimeout(c.register, 1e3), setTimeout(c.register, 3e3), window.addEventListener("resize", () => {
	let e = document.getElementById("monkey-tools-floating");
	if (e) {
		let t = e.getBoundingClientRect(), n = e.querySelector(".monkey-tools-floating-main"), r = n?.getBoundingClientRect().width || 64, i = n?.getBoundingClientRect().height || 64;
		e.style.left = `${Math.max(8, Math.min(window.innerWidth - r - 8, t.left))}px`, e.style.top = `${Math.max(8, Math.min(window.innerHeight - i - 8, t.top))}px`;
	}
	c.positionInlineSymbolBar();
}), window.addEventListener("scroll", () => c.positionInlineSymbolBar(), !0), window.addEventListener("monkey-tools:settings-changed", c.register);
//#endregion
