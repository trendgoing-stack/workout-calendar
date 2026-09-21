import { useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * 画面下からせり上がるモーダル（ボトムシート）。
 * iPhone での操作を想定して、全画面に近い高さで表示する。
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl">
        <header className="safe-top flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="閉じる"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer ? (
          <footer className="safe-bottom border-t border-slate-100 bg-white px-4 py-3">
            {footer}
          </footer>
        ) : (
          <div className="safe-bottom" />
        )}
      </div>
    </div>
  )
}

/** はい／いいえ の確認ダイアログ */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-slate-600">{message}</div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${
              destructive ? 'bg-red-500' : 'bg-indigo-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
