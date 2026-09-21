import type { MuscleGroup, Settings } from '../types'

/** localStorage のキー */
export const STORAGE_KEY = 'workout-calendar:data'

/** 現在のスキーマバージョン */
export const SCHEMA_VERSION = 1

/** 初期状態の部位タグ。色は設定画面から変更できる */
export const DEFAULT_MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: '胸', color: '#ef4444', order: 0 },
  { id: 'back', name: '背中', color: '#3b82f6', order: 1 },
  { id: 'shoulder', name: '肩', color: '#f59e0b', order: 2 },
  { id: 'arm', name: '腕', color: '#8b5cf6', order: 3 },
  { id: 'leg', name: '脚', color: '#10b981', order: 4 },
  { id: 'abs', name: '腹筋', color: '#ec4899', order: 5 },
  { id: 'cardio', name: '有酸素', color: '#06b6d4', order: 6 },
]

export const DEFAULT_SETTINGS: Settings = {
  muscleGroups: DEFAULT_MUSCLE_GROUPS,
  weightUnit: 'kg',
  weekStartsOn: 1,
}

/** 部位タグを追加するときに順番に使う色の候補 */
export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#78716c',
]
