/**
 * dsh-wallet client half — a 💰 button in the session header actions slot
 * (next to the preset selector / session log), one click fetches
 * /api/wallet/balance and pops a small wallet bubble. The API key never
 * touches the browser.
 * @module dsh-wallet/client
 */

import { useEffect, useRef, useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Balance endpoint (host half, same-origin). */
const BALANCE_URL = '/api/wallet/balance'

interface BalanceView {
  ok: boolean
  available?: boolean
  currency?: string
  total?: string
  granted?: string
  toppedUp?: string
  error?: string
}

const bubbleStyle: React.CSSProperties = {
  position: 'fixed',
  background: 'rgba(20,22,28,0.5)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  lineHeight: 1.7,
  boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
  zIndex: 2147483002,
}

const btnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '15px',
  background: 'transparent',
  opacity: 0.8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s, background 0.15s, opacity 0.15s',
  // Flex order -1: the utilities container renders Session log first, then
  // slot children; a negative order moves this button BEFORE Session log.
  order: -1,
}

function WalletButton(): JSX.Element {
  const [balance, setBalance] = useState<BalanceView | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const fetchBalance = async (): Promise<void> => {
    // Toggle: if the bubble is already open, close it; otherwise fetch + open.
    if (open) {
      setOpen(false)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(BALANCE_URL)
      const data = (await res.json()) as BalanceView
      setBalance(data)
      setOpen(true)
      // Position the bubble under the button.
      const r = btnRef.current?.getBoundingClientRect()
      setPos(r ? { x: r.left, y: r.bottom + 6 } : null)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setOpen(false), 8000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const content = balance !== null
    ? balance.ok && balance.total !== undefined
      ? (
          <>
            <div style={{ fontWeight: 700 }}>💰 {balance.currency ?? 'CNY'} {Number(balance.total).toFixed(2)}</div>
            <div style={{ opacity: 0.75, fontSize: '12px' }}>充值 {balance.toppedUp} · 赠送 {balance.granted}</div>
            <div style={{ opacity: 0.75, fontSize: '12px' }}>{balance.available ? '✅ 可用' : '⚠️ 不可用（可能欠费）'}</div>
          </>
        )
      : <div style={{ color: '#ff9d9d' }}>查询失败: {balance.error ?? '未知错误'}</div>
    : error !== null
      ? <div style={{ color: '#ff9d9d' }}>查询失败: {error}</div>
      : null

  return (
    <>
      {open && content !== null && pos !== null && (
        <div style={{ ...bubbleStyle, left: pos.x, top: pos.y }}>{content}</div>
      )}
      <button
        ref={btnRef}
        onClick={fetchBalance}
        disabled={loading}
        title="DeepSeek 余额"
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '0.8' }}
      >
        {loading ? '⏳' : '💰'}
      </button>
    </>
  )
}

/** Register the wallet button into the session header actions slot. */
export const inject = ['slots']

export function apply(ctx: { slots: { inject(name: string, register: () => unknown): void; register(spec: object, component: unknown): unknown } }): void {
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'wallet',
    order: 100,
  }, WalletButton))
}
