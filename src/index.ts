/**
 * dsh-wallet host half — a /api/wallet/balance endpoint that reads the
 * DEEPSEEK_API_KEY from the harness credentials file and queries the
 * DeepSeek balance API. The key never leaves the host; the client only ever
 * sees the balance numbers.
 * @module dsh-wallet
 */

import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

/** DeepSeek balance endpoint. */
const BALANCE_URL = 'https://api.deepseek.com/user/balance'

/** The harness credentials file (dsh stores API keys here). */
function credentialsPath(): string {
  const custom = process.env.DSH_HOME
  const home = custom ?? join(homedir(), '.dsh')
  return join(home, '.credentials.yaml')
}

/** Read DEEPSEEK_API_KEY from the credentials yaml (never log it). */
async function readApiKey(): Promise<string> {
  const text = await readFile(credentialsPath(), 'utf8')
  const m = /DEEPSEEK_API_KEY\s*:\s*(\S+)/.exec(text)
  if (!m) throw new Error('DEEPSEEK_API_KEY not found in credentials file')
  return m[1]
}

/** Query the DeepSeek balance endpoint. */
async function queryBalance(): Promise<unknown> {
  const key = await readApiKey()
  const res = await fetch(BALANCE_URL, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`DeepSeek balance API ${res.status}`)
  const data = (await res.json()) as { is_available?: boolean; balance_infos?: Array<{ currency: string; total_balance: string; granted_balance: string; topped_up_balance: string }> }
  const info = data.balance_infos?.[0]
  if (!info) throw new Error('no balance info returned')
  return {
    ok: true,
    available: data.is_available ?? false,
    currency: info.currency,
    total: info.total_balance,
    granted: info.granted_balance,
    toppedUp: info.topped_up_balance,
    at: Date.now(),
  }
}

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'wallet'

/** Services required before the plugin can mount its surfaces. */
export const inject = ['webServer']

export function apply(ctx: Context): void {
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'exact',
      path: '/api/wallet/balance',
      handler: async (req, res): Promise<void> => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405)
          res.end()
          return
        }
        try {
          const body = JSON.stringify(await queryBalance())
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': String(Buffer.byteLength(body)) })
          if (req.method === 'HEAD') {
            res.end()
            return
          }
          res.end(body)
        } catch (error) {
          const body = JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })
          res.writeHead(502, { 'content-type': 'application/json; charset=utf-8', 'content-length': String(Buffer.byteLength(body)) })
          res.end(body)
        }
      },
    })
    return () => { dispose() }
  }, 'wallet: balance route')
}
