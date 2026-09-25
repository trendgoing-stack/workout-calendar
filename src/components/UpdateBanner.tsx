import { useSyncExternalStore } from 'react'
import { applyUpdate, getUpdateState, subscribeUpdate } from '../pwa'

/**
 * 新しいバージョンがあるときに画面上部に出るバナー。タップで更新して再読み込みする。
 * 記録の入力中に誤って押して入力内容が消えないよう、シート（z-50）より下に置いている。
 */
export function UpdateBanner() {
  const { available, applying } = useSyncExternalStore(subscribeUpdate, getUpdateState)
  if (!available) return null

  return (
    <button
      type="button"
      onClick={applyUpdate}
      disabled={applying}
      className="sticky top-0 z-40 block w-full bg-indigo-600 px-4 pb-3 text-center text-[15px] font-bold text-white shadow-md active:bg-indigo-700 disabled:opacity-80"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      {applying ? '更新しています…' : '更新があります（タップで再読み込み）'}
    </button>
  )
}
