window.__ModuleLoader__.load({
	id: "dsh-emoji-wallet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		/**
		* dsh-emoji-wallet client half — a 💰 button in the session header actions slot
		* (next to the preset selector / session log), one click fetches
		* /api/wallet/balance and pops a small wallet bubble. The API key never
		* touches the browser.
		* @module dsh-emoji-wallet/client
		*/
		/** Balance endpoint (host half, same-origin). */
		const BALANCE_URL = "/api/wallet/balance";
		const bubbleStyle = {
			position: "fixed",
			background: "rgba(20,22,28,0.5)",
			color: "#fff",
			border: "1px solid rgba(255,255,255,0.15)",
			borderRadius: "10px",
			padding: "10px 14px",
			fontSize: "13px",
			lineHeight: 1.7,
			boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
			zIndex: 2147483002
		};
		const btnStyle = {
			width: "30px",
			height: "30px",
			borderRadius: "8px",
			border: "none",
			cursor: "pointer",
			fontSize: "15px",
			background: "transparent",
			opacity: .8,
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			transition: "transform 0.15s, background 0.15s, opacity 0.15s",
			order: -1
		};
		function WalletButton() {
			const [balance, setBalance] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [loading, setLoading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [pos, setPos] = (0, react.useState)(null);
			const btnRef = (0, react.useRef)(null);
			const timerRef = (0, react.useRef)(null);
			const fetchBalance = async () => {
				if (open) {
					setOpen(false);
					if (timerRef.current !== null) window.clearTimeout(timerRef.current);
					return;
				}
				setLoading(true);
				setError(null);
				try {
					const data = await (await fetch(BALANCE_URL)).json();
					setBalance(data);
					setOpen(true);
					const r = btnRef.current?.getBoundingClientRect();
					setPos(r ? {
						x: r.left,
						y: r.bottom + 6
					} : null);
					if (timerRef.current !== null) window.clearTimeout(timerRef.current);
					timerRef.current = window.setTimeout(() => setOpen(false), 8e3);
				} catch (e) {
					setError(e instanceof Error ? e.message : String(e));
					setOpen(true);
				} finally {
					setLoading(false);
				}
			};
			(0, react.useEffect)(() => () => {
				if (timerRef.current !== null) window.clearTimeout(timerRef.current);
			}, []);
			const content = balance !== null ? balance.ok && balance.total !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { fontWeight: 700 },
					children: [
						"💰 ",
						balance.currency ?? "CNY",
						" ",
						Number(balance.total).toFixed(2)
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						opacity: .75,
						fontSize: "12px"
					},
					children: [
						"充值 ",
						balance.toppedUp,
						" · 赠送 ",
						balance.granted
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: {
						opacity: .75,
						fontSize: "12px"
					},
					children: balance.available ? "✅ 可用" : "⚠️ 不可用（可能欠费）"
				})
			] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { color: "#ff9d9d" },
				children: ["查询失败: ", balance.error ?? "未知错误"]
			}) : error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: { color: "#ff9d9d" },
				children: ["查询失败: ", error]
			}) : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [open && content !== null && pos !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					...bubbleStyle,
					left: pos.x,
					top: pos.y
				},
				children: content
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				ref: btnRef,
				onClick: fetchBalance,
				disabled: loading,
				title: "DeepSeek 余额",
				style: btnStyle,
				onMouseEnter: (e) => {
					e.currentTarget.style.background = "rgba(255,255,255,0.08)";
					e.currentTarget.style.transform = "scale(1.1)";
					e.currentTarget.style.opacity = "1";
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.background = "transparent";
					e.currentTarget.style.transform = "scale(1)";
					e.currentTarget.style.opacity = "0.8";
				},
				children: loading ? "⏳" : "💰"
			})] });
		}
		/** Register the wallet button into the session header actions slot. */
		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "wallet",
				order: 100
			}, WalletButton));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map