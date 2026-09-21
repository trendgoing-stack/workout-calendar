import { useState } from 'react'
import type { ISODate, Routine } from '../types'
import { useApp } from '../store/useApp'
import { formatFullDateLabel, todayISO } from '../lib/date'
import { sessionFromRoutine } from '../lib/factories'
import { MuscleTag } from '../components/MuscleTag'
import { resolveGroup } from '../lib/colors'
import { RoutineEditor } from '../components/RoutineEditor'
import { Sheet } from '../components/Sheet'

export function RoutinesPage() {
  const { routines, groupMap, settings, saveSession } = useApp()
  const [editor, setEditor] = useState<{ routine: Routine | null; key: string } | null>(
    null,
  )
  const [applying, setApplying] = useState<Routine | null>(null)
  const [applyDate, setApplyDate] = useState<ISODate>(todayISO)
  const [applied, setApplied] = useState<string | null>(null)

  const handleApply = async () => {
    if (!applying) return
    await saveSession(sessionFromRoutine(applying, applyDate))
    setApplied(`${formatFullDateLabel(applyDate)} に「${applying.name}」を登録しました`)
    setApplying(null)
    window.setTimeout(() => setApplied(null), 3000)
  }

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <header className="safe-top flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ルーティン</h1>
          <p className="mt-1 text-xs text-slate-500">
            よく行う種目の組み合わせをテンプレートにできます
          </p>
        </div>
      </header>

      {applied && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {applied}
        </p>
      )}

      {routines.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          ルーティンがまだありません
        </p>
      ) : (
        <ul className="space-y-2">
          {routines.map((routine) => {
            const groupIds = [
              ...new Set(routine.exercises.flatMap((e) => e.muscleGroupIds)),
            ]
            return (
              <li key={routine.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-800">{routine.name}</h2>
                    {routine.description && (
                      <p className="text-xs text-slate-500">{routine.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditor({ routine, key: routine.id })
                    }
                    className="shrink-0 text-xs font-medium text-slate-400"
                  >
                    編集
                  </button>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  {groupIds.map((id) => (
                    <MuscleTag key={id} group={resolveGroup(groupMap, id)} size="sm" />
                  ))}
                </div>

                <ul className="mt-2 space-y-0.5">
                  {routine.exercises.map((exercise) => (
                    <li key={exercise.id} className="text-sm text-slate-600">
                      {exercise.name}
                      <span className="ml-2 text-xs text-slate-400">
                        {exercise.sets.length}セット
                        {exercise.sets[0]?.weight != null &&
                          ` / ${exercise.sets[0].weight}${settings.weightUnit}`}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setApplyDate(todayISO())
                    setApplying(routine)
                  }}
                  className="mt-3 w-full rounded-lg bg-indigo-50 py-2 text-xs font-semibold text-indigo-600"
                >
                  この内容で記録する
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setEditor({ routine: null, key: `new-${Date.now()}` })}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm active:bg-indigo-700"
      >
        + ルーティンを作成
      </button>

      {editor && (
        <RoutineEditor
          key={editor.key}
          open
          routine={editor.routine}
          onClose={() => setEditor(null)}
        />
      )}

      <Sheet
        open={applying !== null}
        onClose={() => setApplying(null)}
        title={`「${applying?.name ?? ''}」を記録する`}
        footer={
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
          >
            この日に登録する
          </button>
        }
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">日付</span>
          <input
            type="date"
            value={applyDate}
            onChange={(e) => setApplyDate(e.target.value as ISODate)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
          />
        </label>
        <p className="mt-3 text-xs text-slate-500">
          {formatFullDateLabel(applyDate)} の記録として、
          {applying?.exercises.length ?? 0}種目をまとめて登録します。
          登録後はカレンダーから内容を編集できます。
        </p>
      </Sheet>
    </div>
  )
}
