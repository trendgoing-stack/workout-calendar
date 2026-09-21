import type { ISODate, MuscleGroup, WeekStart, WorkoutSession } from '../types'
import {
  addDays,
  addMonths,
  parseISODate,
  startOfWeek,
  toISODate,
  todayISO,
} from './date'

/** 表示用の集計はすべてここ（純粋関数）にまとめる */

/** セッションに含まれる部位タグ（種目の部位の和集合、表示順を維持） */
export function sessionMuscleGroupIds(session: WorkoutSession): string[] {
  const seen = new Set<string>()
  for (const exercise of session.exercises) {
    for (const id of exercise.muscleGroupIds) seen.add(id)
  }
  return [...seen]
}

/** 日付をキーにしたセッションの索引 */
export function groupSessionsByDate(
  sessions: WorkoutSession[],
): Map<ISODate, WorkoutSession[]> {
  const map = new Map<ISODate, WorkoutSession[]>()
  for (const session of sessions) {
    const list = map.get(session.date)
    if (list) list.push(session)
    else map.set(session.date, [session])
  }
  return map
}

/** 1セッションの総ボリューム（重量 × 回数の合計） */
export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0,
  )
}

export function sessionSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((total, e) => total + e.sets.length, 0)
}

/**
 * 過去に入力した種目名を、よく使う順・新しい順で返す（サジェスト用）
 */
export function exerciseNameSuggestions(sessions: WorkoutSession[]): string[] {
  const stats = new Map<string, { count: number; lastDate: ISODate }>()
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const key = exercise.name.trim()
      if (!key) continue
      const current = stats.get(key)
      if (current) {
        current.count += 1
        if (session.date > current.lastDate) current.lastDate = session.date
      } else {
        stats.set(key, { count: 1, lastDate: session.date })
      }
    }
  }
  return [...stats.entries()]
    .sort((a, b) =>
      b[1].count - a[1].count || (a[1].lastDate < b[1].lastDate ? 1 : -1),
    )
    .map(([name]) => name)
}

/** 種目名 -> 直近で使った部位タグ（入力補助用） */
export function lastMuscleGroupsByExercise(
  sessions: WorkoutSession[],
): Map<string, string[]> {
  const map = new Map<string, string[]>()
  // sessions は新しい順に並んでいる前提。先に入ったものを優先する
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const key = exercise.name.trim()
      if (key && !map.has(key) && exercise.muscleGroupIds.length > 0) {
        map.set(key, exercise.muscleGroupIds)
      }
    }
  }
  return map
}

export interface PeriodBucket {
  key: string
  label: string
  start: ISODate
  end: ISODate
}

/** 直近 n 週 / n ヶ月分のバケットを古い順に作る */
export function buildBuckets(
  unit: 'week' | 'month',
  count: number,
  weekStartsOn: WeekStart,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = []
  const today = parseISODate(todayISO())

  if (unit === 'week') {
    const thisWeekStart = startOfWeek(today, weekStartsOn)
    for (let i = count - 1; i >= 0; i--) {
      const start = addDays(thisWeekStart, -7 * i)
      const end = addDays(start, 6)
      buckets.push({
        key: toISODate(start),
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        start: toISODate(start),
        end: toISODate(end),
      })
    }
    return buckets
  }

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  for (let i = count - 1; i >= 0; i--) {
    const start = addMonths(thisMonthStart, -i)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    buckets.push({
      key: toISODate(start).slice(0, 7),
      label: `${start.getMonth() + 1}月`,
      start: toISODate(start),
      end: toISODate(end),
    })
  }
  return buckets
}

export interface FrequencyRow {
  bucket: PeriodBucket
  /** 部位 ID -> その期間にその部位を鍛えた日数 */
  countsByGroup: Record<string, number>
  /** その期間のトレーニング日数 */
  totalDays: number
}

/**
 * 期間ごと・部位ごとのトレーニング頻度（＝その部位を鍛えた「日数」）を集計する
 */
export function frequencyByPeriod(
  sessions: WorkoutSession[],
  buckets: PeriodBucket[],
): FrequencyRow[] {
  return buckets.map((bucket) => {
    const inRange = sessions.filter(
      (s) => s.date >= bucket.start && s.date <= bucket.end,
    )
    const countsByGroup: Record<string, number> = {}
    const daysByGroup = new Map<string, Set<ISODate>>()
    const days = new Set<ISODate>()

    for (const session of inRange) {
      days.add(session.date)
      for (const groupId of sessionMuscleGroupIds(session)) {
        const set = daysByGroup.get(groupId) ?? new Set<ISODate>()
        set.add(session.date)
        daysByGroup.set(groupId, set)
      }
    }
    for (const [groupId, dates] of daysByGroup) {
      countsByGroup[groupId] = dates.size
    }
    return { bucket, countsByGroup, totalDays: days.size }
  })
}

export interface ExerciseProgressPoint {
  date: ISODate
  /** その日の最大重量 */
  maxWeight: number
  /** その日の総ボリューム（重量 × 回数） */
  volume: number
  /** 推定1RM（Epley 式）。重量が無い種目では 0 */
  estimated1RM: number
  totalReps: number
  setCount: number
}

/** ある種目の推移（日付の古い順） */
export function exerciseProgress(
  sessions: WorkoutSession[],
  exerciseName: string,
): ExerciseProgressPoint[] {
  const byDate = new Map<ISODate, ExerciseProgressPoint>()

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.name.trim() !== exerciseName) continue
      const point =
        byDate.get(session.date) ??
        {
          date: session.date,
          maxWeight: 0,
          volume: 0,
          estimated1RM: 0,
          totalReps: 0,
          setCount: 0,
        }
      for (const set of exercise.sets) {
        const weight = set.weight ?? 0
        const reps = set.reps ?? 0
        point.maxWeight = Math.max(point.maxWeight, weight)
        point.volume += weight * reps
        point.totalReps += reps
        point.setCount += 1
        if (weight > 0 && reps > 0) {
          point.estimated1RM = Math.max(
            point.estimated1RM,
            Math.round(weight * (1 + reps / 30) * 10) / 10,
          )
        }
      }
      byDate.set(session.date, point)
    }
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** 部位 ID -> MuscleGroup の索引 */
export function muscleGroupMap(groups: MuscleGroup[]): Map<string, MuscleGroup> {
  return new Map(groups.map((g) => [g.id, g]))
}

/** 削除済みの部位タグを参照していても落ちないようにするフォールバック */
export const UNKNOWN_GROUP: MuscleGroup = {
  id: '__unknown__',
  name: 'その他',
  color: '#94a3b8',
  order: 999,
}

export interface StreakInfo {
  /** 今週のトレーニング日数 */
  thisWeekDays: number
  /** 今月のトレーニング日数 */
  thisMonthDays: number
  /** 連続でトレーニングしている日数（今日または昨日から遡る） */
  currentStreak: number
  /** 全期間のトレーニング日数 */
  totalDays: number
}

export function summarize(
  sessions: WorkoutSession[],
  weekStartsOn: WeekStart,
): StreakInfo {
  const dates = new Set(sessions.map((s) => s.date))
  const today = parseISODate(todayISO())
  const weekStart = toISODate(startOfWeek(today, weekStartsOn))
  const weekEnd = toISODate(addDays(startOfWeek(today, weekStartsOn), 6))
  const monthPrefix = todayISO().slice(0, 7)

  let thisWeekDays = 0
  let thisMonthDays = 0
  for (const date of dates) {
    if (date >= weekStart && date <= weekEnd) thisWeekDays += 1
    if (date.startsWith(monthPrefix)) thisMonthDays += 1
  }

  let currentStreak = 0
  let cursor = today
  if (!dates.has(toISODate(cursor))) cursor = addDays(cursor, -1)
  while (dates.has(toISODate(cursor))) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  return { thisWeekDays, thisMonthDays, currentStreak, totalDays: dates.size }
}
