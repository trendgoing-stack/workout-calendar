import { useContext } from 'react'
import { AppContext } from './context'
import type { AppContextValue } from './context'

/** アプリ全体のデータと操作関数にアクセスするフック */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp は AppProvider の内側で使ってください')
  return ctx
}
