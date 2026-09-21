import type {
  AppData,
  ExerciseEntry,
  MuscleGroup,
  Routine,
  RoutineExercise,
  Settings,
  WorkoutSession,
  WorkoutSet,
} from '../types'
import { DEFAULT_MUSCLE_GROUPS, DEFAULT_SETTINGS, SCHEMA_VERSION } from './constants'
import { isValidISODate, todayISO } from './date'
import { createId, nowIso } from './id'

/**
 * 外部（localStorage / インポートした JSON）から来たデータを
 * 現在のスキーマに合わせて検証・補完する。
 * 壊れた値は捨てて既定値に寄せることで、アプリが起動不能にならないようにする。
 */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const isHexColor = (v: unknown): v is string =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)

function normalizeMuscleGroups(input: unknown): MuscleGroup[] {
  if (!Array.isArray(input)) return DEFAULT_MUSCLE_GROUPS
  const groups = input.filter(isObject).map((g, i) => ({
    id: str(g.id) || createId(),
    name: str(g.name) || `部位${i + 1}`,
    color: isHexColor(g.color) ? g.color : '#64748b',
    order: typeof g.order === 'number' ? g.order : i,
  }))
  return groups.length > 0
    ? groups.sort((a, b) => a.order - b.order).map((g, i) => ({ ...g, order: i }))
    : DEFAULT_MUSCLE_GROUPS
}

function normalizeSets(input: unknown): WorkoutSet[] {
  if (!Array.isArray(input)) return []
  return input.filter(isObject).map((s) => ({
    id: str(s.id) || createId(),
    weight: numOrNull(s.weight),
    reps: numOrNull(s.reps),
  }))
}

function normalizeExercise(input: unknown): ExerciseEntry | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  return {
    id: str(input.id) || createId(),
    name,
    muscleGroupIds: Array.isArray(input.muscleGroupIds)
      ? input.muscleGroupIds.filter((v): v is string => typeof v === 'string')
      : [],
    sets: normalizeSets(input.sets),
    memo: str(input.memo),
  }
}

export function normalizeSession(input: unknown): WorkoutSession | null {
  if (!isObject(input)) return null
  if (!isValidISODate(input.date)) return null
  const date = input.date
  const exercises = Array.isArray(input.exercises)
    ? input.exercises.map(normalizeExercise).filter((e): e is ExerciseEntry => e !== null)
    : []
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    date,
    exercises,
    memo: str(input.memo),
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

function normalizeRoutineExercise(input: unknown): RoutineExercise | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  return {
    id: str(input.id) || createId(),
    name,
    muscleGroupIds: Array.isArray(input.muscleGroupIds)
      ? input.muscleGroupIds.filter((v): v is string => typeof v === 'string')
      : [],
    sets: Array.isArray(input.sets)
      ? input.sets
          .filter(isObject)
          .map((s) => ({ weight: numOrNull(s.weight), reps: numOrNull(s.reps) }))
      : [],
    memo: str(input.memo),
  }
}

export function normalizeRoutine(input: unknown): Routine | null {
  if (!isObject(input)) return null
  const name = str(input.name).trim()
  if (!name) return null
  const createdAt = str(input.createdAt) || nowIso()
  return {
    id: str(input.id) || createId(),
    name,
    description: str(input.description),
    exercises: Array.isArray(input.exercises)
      ? input.exercises
          .map(normalizeRoutineExercise)
          .filter((e): e is RoutineExercise => e !== null)
      : [],
    createdAt,
    updatedAt: str(input.updatedAt) || createdAt,
  }
}

function normalizeSettings(input: unknown): Settings {
  if (!isObject(input)) return DEFAULT_SETTINGS
  return {
    muscleGroups: normalizeMuscleGroups(input.muscleGroups),
    weightUnit: input.weightUnit === 'lb' ? 'lb' : 'kg',
    weekStartsOn: input.weekStartsOn === 0 ? 0 : 1,
  }
}

export function createEmptyAppData(): AppData {
  return {
    version: SCHEMA_VERSION,
    sessions: [],
    routines: [],
    settings: DEFAULT_SETTINGS,
  }
}

/** 任意の入力値を安全な AppData に変換する（将来のマイグレーションの入口も兼ねる） */
export function normalizeAppData(input: unknown): AppData {
  if (!isObject(input)) return createEmptyAppData()

  const sessions = Array.isArray(input.sessions)
    ? input.sessions
        .map(normalizeSession)
        .filter((s): s is WorkoutSession => s !== null)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    : []

  const routines = Array.isArray(input.routines)
    ? input.routines.map(normalizeRoutine).filter((r): r is Routine => r !== null)
    : []

  return {
    version: SCHEMA_VERSION,
    sessions,
    routines,
    settings: normalizeSettings(input.settings),
  }
}

/** インポートしたファイルがこのアプリのデータとして読めるかざっくり判定する */
export function looksLikeAppData(input: unknown): boolean {
  return (
    isObject(input) &&
    (Array.isArray(input.sessions) ||
      Array.isArray(input.routines) ||
      isObject(input.settings))
  )
}

/** デモ用のサンプルデータ（設定画面から投入できる） */
export function createSampleData(): Pick<AppData, 'sessions' | 'routines'> {
  const [y, m, d] = todayISO().split('-').map(Number)
  const dateBefore = (n: number) => {
    const dt = new Date(y, m - 1, d - n)
    const mm = `${dt.getMonth() + 1}`.padStart(2, '0')
    const dd = `${dt.getDate()}`.padStart(2, '0')
    return `${dt.getFullYear()}-${mm}-${dd}`
  }
  const session = (
    dateOffset: number,
    exercises: Array<[string, string[], Array<[number, number]>]>,
  ): WorkoutSession => ({
    id: createId(),
    date: dateBefore(dateOffset),
    exercises: exercises.map(([name, groups, sets]) => ({
      id: createId(),
      name,
      muscleGroupIds: groups,
      sets: sets.map(([weight, reps]) => ({ id: createId(), weight, reps })),
      memo: '',
    })),
    memo: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })

  return {
    sessions: [
      session(0, [
        ['ベンチプレス', ['chest'], [[60, 10], [65, 8], [65, 7]]],
        ['ダンベルフライ', ['chest'], [[16, 12], [16, 10]]],
      ]),
      session(2, [
        ['デッドリフト', ['back', 'leg'], [[100, 5], [110, 5], [110, 4]]],
        ['ラットプルダウン', ['back'], [[50, 12], [55, 10]]],
      ]),
      session(5, [
        ['スクワット', ['leg'], [[80, 10], [85, 8], [85, 8]]],
        ['レッグカール', ['leg'], [[40, 12], [40, 12]]],
      ]),
      session(7, [
        ['ベンチプレス', ['chest'], [[60, 9], [62.5, 8]]],
        ['ショルダープレス', ['shoulder'], [[20, 12], [22.5, 10]]],
      ]),
      session(9, [['ランニング', ['cardio'], [[0, 0]]]]),
      session(12, [['ベンチプレス', ['chest'], [[57.5, 10], [60, 8]]]]),
      session(14, [
        ['懸垂', ['back'], [[0, 8], [0, 7]]],
        ['アームカール', ['arm'], [[12, 12], [12, 10]]],
      ]),
    ],
    routines: [
      {
        id: createId(),
        name: '胸の日',
        description: 'プッシュ系のいつもの流れ',
        exercises: [
          {
            id: createId(),
            name: 'ベンチプレス',
            muscleGroupIds: ['chest'],
            sets: [
              { weight: 60, reps: 10 },
              { weight: 65, reps: 8 },
              { weight: 65, reps: 8 },
            ],
            memo: '',
          },
          {
            id: createId(),
            name: 'ダンベルフライ',
            muscleGroupIds: ['chest'],
            sets: [
              { weight: 16, reps: 12 },
              { weight: 16, reps: 12 },
            ],
            memo: '',
          },
          {
            id: createId(),
            name: 'トライセプスプレスダウン',
            muscleGroupIds: ['arm'],
            sets: [
              { weight: 25, reps: 15 },
              { weight: 25, reps: 15 },
            ],
            memo: '',
          },
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ],
  }
}
