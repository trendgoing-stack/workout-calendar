import type { AppData, ExportFile } from '../types'
import { todayISO } from './date'
import { nowIso } from './id'

/** エクスポート用の JSON を組み立てる */
export function buildExportFile(data: AppData): ExportFile {
  return { ...data, app: 'workout-calendar', exportedAt: nowIso() }
}

/** JSON ファイルとしてダウンロードさせる */
export function downloadJson(data: AppData): void {
  const content = JSON.stringify(buildExportFile(data), null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `workout-calendar-${todayISO()}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // 少し待ってから解放する（Safari 対策）
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 選択されたファイルを読み込んで JSON に変換する */
export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
