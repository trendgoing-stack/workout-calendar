import { useMemo, useState } from 'react'
import type { Routine, RoutineExercise } from '../types'
import { useApp } from '../store/useApp'
import { createRoutine, createRoutineExercise } from '../lib/factories'
import { exerciseNameSuggestions, lastMuscleGroupsByExercise } from '../lib/selectors'
import { ConfirmDialog, Sheet } from './Sheet'
import { MuscleTagPicker } from './MuscleTag'
import { ExerciseNameInput } from './ExerciseNameInput'

/** ルーティン（テンプレート）の作成・編集シート */
export function RoutineEditor({
  open,
  routine,
  onClose,
}: {
  open: boolean
  routine: Routine | null
  onClose: () => void
}) {
  const { muscleGroups, sessions, settings, saveRoutine, deleteRoutine } = useApp()
  const [draft, setDraft] = useState<Routine>(() => routine ?? createRoutine())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const suggestions = useMemo(() => exerciseNameSuggestions(sessions), [sessions])
  const lastGroups = useMemo(() => lastMuscleGroupsByExercise(sessions), [sessions])
  const unit = settings.weightUnit

  const updateExercise = (
    id: string,
    updater: (exercise: RoutineExercise) => RoutineExercise,
  ) =>
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === id ? updater(e) : e)),
    }))

  const canSave =
    draft.name.trim().length > 0 &&
    draft.exercises.some((e) => e.name.trim().length > 0)

  const handleSave = async () => {
    if (!canSave) return
    await saveRoutine({
      ...draft,
      name: draft.name.trim(),
      exercises: draft.exercises
        .map((e) => ({ ...e, name: e.name.trim() }))
        .filter((e) => e.name.length > 0),
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={routine ? 'ルーティンを編集' : 'ルーティンを作成'}
      footer={
        <div className="flex gap-2">
          {routine && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500"
            >
              削除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
          >
            保存
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">ルーティン名</span>
          <input
            type="text"
            value={draft.name}
            placeholder="例: 胸の日"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-medium outline-none focus:border-indigo-400"
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">メモ（任意）</span>
          <input
            type="text"
            value={draft.description}
            placeholder="例: ジムでのプッシュ系"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </label>

        {draft.exercises.map((exercise, index) => (
          <article
            key={exercise.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <ExerciseNameInput
                  value={exercise.name}
                  suggestions={suggestions}
                  onChange={(name) => updateExercise(exercise.id, (e) => ({ ...e, name }))}
                  onPick={(name) =>
                    updateExercise(exercise.id, (e) => ({
                      ...e,
                      name,
                      muscleGroupIds:
                        e.muscleGroupIds.length > 0
                          ? e.muscleGroupIds
                          : (lastGroups.get(name) ?? []),
                    }))
                  }
                />
              </div>
              {draft.exercises.length > 1 && (
                <button
                  type="button"
                  aria-label={`${index + 1}番目の種目を削除`}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      exercises: prev.exercises.filter((e) => e.id !== exercise.id),
                    }))
                  }
                  className="mt-1 rounded-full p-1.5 text-slate-300 hover:bg-slate-200 hover:text-slate-500"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <MuscleTagPicker
              groups={muscleGroups}
              selected={exercise.muscleGroupIds}
              onToggle={(id) =>
                updateExercise(exercise.id, (e) => ({
                  ...e,
                  muscleGroupIds: e.muscleGroupIds.includes(id)
                    ? e.muscleGroupIds.filter((v) => v !== id)
                    : [...e.muscleGroupIds, id],
                }))
              }
            />

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                <span className="w-6">セット</span>
                <span className="flex-1">重量({unit})</span>
                <span className="flex-1">回数</span>
                <span className="w-7" />
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-medium text-slate-400">
                    {setIndex + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={set.weight ?? ''}
                    placeholder="-"
                    className="w-full flex-1 rounded-lg border border-slate-200 px-2 py-2 text-center outline-none focus:border-indigo-400"
                    onChange={(e) =>
                      updateExercise(exercise.id, (ex) => ({
                        ...ex,
                        sets: ex.sets.map((s, i) =>
                          i === setIndex
                            ? { ...s, weight: e.target.value === '' ? null : Number(e.target.value) }
                            : s,
                        ),
                      }))
                    }
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    placeholder="-"
                    className="w-full flex-1 rounded-lg border border-slate-200 px-2 py-2 text-center outline-none focus:border-indigo-400"
                    onChange={(e) =>
                      updateExercise(exercise.id, (ex) => ({
                        ...ex,
                        sets: ex.sets.map((s, i) =>
                          i === setIndex
                            ? { ...s, reps: e.target.value === '' ? null : Number(e.target.value) }
                            : s,
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    aria-label={`${setIndex + 1}セット目を削除`}
                    onClick={() =>
                      updateExercise(exercise.id, (ex) => ({
                        ...ex,
                        sets: ex.sets.filter((_, i) => i !== setIndex),
                      }))
                    }
                    className="w-7 rounded-full py-2 text-slate-300 hover:text-red-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateExercise(exercise.id, (ex) => ({
                    ...ex,
                    sets: [...ex.sets, { ...(ex.sets.at(-1) ?? { weight: null, reps: null }) }],
                  }))
                }
                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500"
              >
                + セットを追加
              </button>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              exercises: [...prev.exercises, createRoutineExercise()],
            }))
          }
          className="w-full rounded-xl border border-dashed border-indigo-300 py-3 text-sm font-semibold text-indigo-600"
        >
          + 種目を追加
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="このルーティンを削除しますか？"
        message="過去の記録はそのまま残ります。"
        confirmLabel="削除する"
        destructive
        onConfirm={async () => {
          setConfirmDelete(false)
          if (routine) await deleteRoutine(routine.id)
          onClose()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  )
}
