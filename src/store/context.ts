import { createContext } from 'react'
import type {
  AppData,
  ISODate,
  MuscleGroup,
  Routine,
  Settings,
  WorkoutSession,
} from '../types'

export interface AppContextValue {
  data: AppData
  loading: boolean
  /** 保存エラーなどの一時メッセージ */
  error: string | null
  sessions: WorkoutSession[]
  routines: Routine[]
  settings: Settings
  muscleGroups: MuscleGroup[]
  groupMap: Map<string, MuscleGroup>
  sessionsByDate: Map<ISODate, WorkoutSession[]>
  saveSession: (session: WorkoutSession) => Promise<void>
  saveSessions: (sessions: WorkoutSession[]) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  saveRoutine: (routine: Routine) => Promise<void>
  deleteRoutine: (routineId: string) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  importData: (raw: unknown) => Promise<void>
  clearAll: () => Promise<void>
  loadSampleData: () => Promise<void>
  dismissError: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
