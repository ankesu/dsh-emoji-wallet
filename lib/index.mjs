import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
//#region src/index.ts
/** DeepSeek balance endpoint. */
const BALANCE_URL = "https://api.deepseek.com/user/balance";
/** The harness credentials file (dsh stores API keys here). */
function credentialsPath() {
	const home = process.env.DSH_HOME ?? join(homedir(), ".dsh");
	return join(home, ".credentials.yaml");
}
/** Read DEEPSEEK_API_KEY from the credentials yaml (never log it). */
async function readApiKey() {
	const text = await readFile(credentialsPath(), "utf8");
	const m = /DEEPSEEK_API_KEY\s*:\s*(\S+)/.exec(text);
	if (!m) throw new Error("DEEPSEEK_API_KEY not found in credentials file");
	return m[1];
}
/** Query the DeepSeek balance endpoint. */
async function queryBalance() {
	const key = await readApiKey();
	const res = await fetch(BALANCE_URL, {
		headers: { Authorization: `Bearer ${key}` },
		signal: AbortSignal.timeout(15e3)
	});
	if (!res.ok) throw new Error(`DeepSeek balance API ${res.status}`);
	const data = await res.json();
	const info = data.balance_infos?.[0];
	if (!info) throw new Error("no balance info returned");
	return {
		ok: true,
		available: data.is_available ?? false,
		currency: info.currency,
		total: info.total_balance,
		granted: info.granted_balance,
		toppedUp: info.topped_up_balance,
		at: Date.now()
	};
}
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "wallet";
/** Services required before the plugin can mount its surfaces. */
const inject = ["webServer"];
function apply(ctx) {
	ctx.effect(() => {
		const dispose = ctx.webServer.register({
			kind: "exact",
			path: "/api/wallet/balance",
			handler: async (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405);
					res.end();
					return;
				}
				try {
					const body = JSON.stringify(await queryBalance());
					res.writeHead(200, {
						"content-type": "application/json; charset=utf-8",
						"content-length": String(Buffer.byteLength(body))
					});
					if (req.method === "HEAD") {
						res.end();
						return;
					}
					res.end(body);
				} catch (error) {
					const body = JSON.stringify({
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
					res.writeHead(502, {
						"content-type": "application/json; charset=utf-8",
						"content-length": String(Buffer.byteLength(body))
					});
					res.end(body);
				}
			}
		});
		return () => {
			dispose();
		};
	}, "wallet: balance route");
}
//#endregion
export { apply, inject, name };
