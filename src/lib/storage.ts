import type { AppData } from '../types'
import { STORAGE_KEY } from './constants'
import { createEmptyAppData, normalizeAppData } from './normalize'

/**
 * localStorage への読み書きだけを担当する薄いレイヤー。
 * ここを差し替えれば保存先（IndexedDB / Supabase など）を変更できる。
 */

const hasStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function readAppData(): AppData {
  if (!hasStorage()) return createEmptyAppData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyAppData()
    return normalizeAppData(JSON.parse(raw))
  } catch (error) {
    console.error('保存データの読み込みに失敗しました', error)
    return createEmptyAppData()
  }
}

export function writeAppData(data: AppData): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存に失敗しました（容量超過の可能性があります）', error)
    throw error
  }
}

export function clearAppData(): void {
  if (!hasStorage()) return
  window.localStorage.removeItem(STORAGE_KEY)
}
