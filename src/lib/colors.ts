import type { MuscleGroup } from '../types'
import { UNKNOWN_GROUP } from './selectors'

/** 16進カラーを rgba に変換（薄い背景色を作るため） */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 削除済みの部位 ID を参照していてもフォールバックして返す */
export function resolveGroup(
  groupMap: Map<string, MuscleGroup>,
  id: string,
): MuscleGroup {
  return groupMap.get(id) ?? { ...UNKNOWN_GROUP, id }
}
