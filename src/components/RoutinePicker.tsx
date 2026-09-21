import { useState } from 'react'
import type { ISODate } from '../types'
import { useApp } from '../store/useApp'
import { formatFullDateLabel } from '../lib/date'
import { sessionFromRoutine } from '../lib/factories'
import { MuscleTag } from './MuscleTag'
import { resolveGroup } from '../lib/colors'
import { Sheet } from './Sheet'

/** 日付を選んで、ルーティンをその日の記録として一括登録するシート */
export function RoutinePicker({
  open,
  date,
  onClose,
}: {
  open: boolean
  date: ISODate
  onClose: () => void
}) {
  const { routines, groupMap, saveSession } = useApp()
  const [targetDate, setTargetDate] = useState<ISODate>(date)

  const apply = async (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId)
    if (!routine) return
    await saveSession(sessionFromRoutine(routine, targetDate))
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="ルーティンから記録">
      <label className="mb-4 block">
        <span className="mb-1 block text-xs font-medium text-slate-500">登録する日</span>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value as ISODate)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
        />
        <span className="mt-1 block text-xs text-slate-400">
          {formatFullDateLabel(targetDate)} に登録します
        </span>
      </label>

      {routines.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
          ルーティンがまだありません。
          <br />
          「ルーティン」タブから作成できます。
        </p>
      ) : (
        <ul className="space-y-2">
          {routines.map((routine) => {
            const groupIds = [
              ...new Set(routine.exercises.flatMap((e) => e.muscleGroupIds)),
            ]
            return (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => apply(routine.id)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-left active:bg-indigo-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{routine.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {routine.exercises.length}種目
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {groupIds.map((id) => (
                      <MuscleTag key={id} group={resolveGroup(groupMap, id)} size="sm" />
                    ))}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {routine.exercises.map((e) => e.name).join(' / ')}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
