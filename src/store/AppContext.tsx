import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  Routine,
  Settings,
  WorkoutSession,
} from '../types'
import { repository } from '../lib/repository'
import { createEmptyAppData, createSampleData, normalizeAppData } from '../lib/normalize'
import { groupSessionsByDate, muscleGroupMap } from '../lib/selectors'
import { AppContext } from './context'
import type { AppContextValue } from './context'

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(createEmptyAppData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    repository
      .getAll()
      .then((loaded) => {
        if (!cancelled) setData(loaded)
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) setError('データの読み込みに失敗しました')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** repository 呼び出しの共通ラッパー（結果を state に反映し、失敗はメッセージ化する） */
  const run = useCallback(async (task: () => Promise<AppData>) => {
    try {
      const next = await task()
      setData(next)
      setError(null)
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。空き容量をご確認ください。')
    }
  }, [])

  const saveSession = useCallback(
    (session: WorkoutSession) => run(() => repository.saveSession(session)),
    [run],
  )
  const saveSessions = useCallback(
    (sessions: WorkoutSession[]) => run(() => repository.saveSessions(sessions)),
    [run],
  )
  const deleteSession = useCallback(
    (sessionId: string) => run(() => repository.deleteSession(sessionId)),
    [run],
  )
  const saveRoutine = useCallback(
    (routine: Routine) => run(() => repository.saveRoutine(routine)),
    [run],
  )
  const deleteRoutine = useCallback(
    (routineId: string) => run(() => repository.deleteRoutine(routineId)),
    [run],
  )
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => run(() => repository.updateSettings(patch)),
    [run],
  )
  const importData = useCallback(
    (raw: unknown) => run(() => repository.replaceAll(normalizeAppData(raw))),
    [run],
  )
  const clearAll = useCallback(() => run(() => repository.clearAll()), [run])

  const loadSampleData = useCallback(
    () =>
      run(async () => {
        const current = await repository.getAll()
        const sample = createSampleData()
        return repository.replaceAll({
          ...current,
          sessions: [...sample.sessions, ...current.sessions],
          routines: [...current.routines, ...sample.routines],
        })
      }),
    [run],
  )

  const muscleGroups = useMemo(
    () => [...data.settings.muscleGroups].sort((a, b) => a.order - b.order),
    [data.settings.muscleGroups],
  )
  const groupMap = useMemo(() => muscleGroupMap(muscleGroups), [muscleGroups])
  const sessionsByDate = useMemo(() => groupSessionsByDate(data.sessions), [data.sessions])

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      loading,
      error,
      sessions: data.sessions,
      routines: data.routines,
      settings: data.settings,
      muscleGroups,
      groupMap,
      sessionsByDate,
      saveSession,
      saveSessions,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      updateSettings,
      importData,
      clearAll,
      loadSampleData,
      dismissError: () => setError(null),
    }),
    [
      data,
      loading,
      error,
      muscleGroups,
      groupMap,
      sessionsByDate,
      saveSession,
      saveSessions,
      deleteSession,
      saveRoutine,
      deleteRoutine,
      updateSettings,
      importData,
      clearAll,
      loadSampleData,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
