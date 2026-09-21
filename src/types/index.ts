/**
 * アプリ全体のデータ型定義。
 * localStorage に保存されるスキーマそのものなので、変更する場合は
 * src/lib/migrate.ts のマイグレーション処理も合わせて更新すること。
 */

/** 'YYYY-MM-DD' 形式のローカル日付 */
export type ISODate = string

/** ISO 8601 のタイムスタンプ（例: '2026-09-09T12:34:56.789Z'） */
export type Timestamp = string

/** 部位タグ（胸・背中 など）。ユーザーが追加・色変更できる */
export interface MuscleGroup {
  id: string
  name: string
  /** #rrggbb 形式のカラーコード */
  color: string
  /** 表示順（小さいほど先） */
  order: number
}

/** 1セット分の記録 */
export interface WorkoutSet {
  id: string
  /** 重量（kg / lb）。自重種目などでは null */
  weight: number | null
  /** 回数。時間で管理する種目などでは null */
  reps: number | null
}

/** セッション内の1種目 */
export interface ExerciseEntry {
  id: string
  /** 種目名（自由入力） */
  name: string
  /** 鍛えた部位（MuscleGroup.id の配列・複数選択可） */
  muscleGroupIds: string[]
  sets: WorkoutSet[]
  /** 種目ごとのメモ */
  memo: string
}

/** 1レコード = 1日のトレーニングセッション */
export interface WorkoutSession {
  id: string
  date: ISODate
  exercises: ExerciseEntry[]
  /** セッション全体のメモ */
  memo: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** ルーティン（テンプレート）に登録する種目 */
export interface RoutineExercise {
  id: string
  name: string
  muscleGroupIds: string[]
  /** テンプレートの想定セット（重量・回数は未定なら null） */
  sets: Array<{ weight: number | null; reps: number | null }>
  memo: string
}

/** よく行う種目の組み合わせ */
export interface Routine {
  id: string
  name: string
  description: string
  exercises: RoutineExercise[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type WeightUnit = 'kg' | 'lb'

/** 0 = 日曜始まり, 1 = 月曜始まり */
export type WeekStart = 0 | 1

export interface Settings {
  muscleGroups: MuscleGroup[]
  weightUnit: WeightUnit
  weekStartsOn: WeekStart
}

/** localStorage に入る最上位のオブジェクト */
export interface AppData {
  /** スキーマバージョン。マイグレーション判定に使う */
  version: number
  sessions: WorkoutSession[]
  routines: Routine[]
  settings: Settings
}

/** エクスポート／インポートで受け渡す JSON の形 */
export interface ExportFile extends AppData {
  exportedAt: Timestamp
  app: 'workout-calendar'
}
