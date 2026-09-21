import { useMemo, useState } from 'react'
import type { ExerciseEntry, ISODate, WorkoutSession } from '../types'
import { useApp } from '../store/useApp'
import {
  createExercise,
  createSession,
  createSet,
  isSessionEmpty,
  pruneSession,
  routineFromSession,
} from '../lib/factories'
import { exerciseNameSuggestions, lastMuscleGroupsByExercise } from '../lib/selectors'
import { ConfirmDialog, Sheet } from './Sheet'
import { MuscleTagPicker } from './MuscleTag'
import { ExerciseNameInput } from './ExerciseNameInput'

interface Props {
  open: boolean
  /** 新規作成する日付 */
  date: ISODate
  /** 編集対象。null なら新規作成 */
  session: WorkoutSession | null
  onClose: () => void
}

/** トレーニング記録の入力・編集画面 */
export function SessionEditor({ open, date, session, onClose }: Props) {
  const { muscleGroups, sessions, saveSession, deleteSession, saveRoutine, settings } =
    useApp()

  // シートを開くたびに初期値を作り直す（key で再マウントされる想定）
  const [draft, setDraft] = useState<WorkoutSession>(
    () => session ?? createSession(date),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveAsRoutine, setSaveAsRoutine] = useState(false)
  const [routineName, setRoutineName] = useState('')

  const suggestions = useMemo(() => exerciseNameSuggestions(sessions), [sessions])
  const lastGroups = useMemo(() => lastMuscleGroupsByExercise(sessions), [sessions])
  const unit = settings.weightUnit

  const updateExercise = (
    exerciseId: string,
    updater: (exercise: ExerciseEntry) => ExerciseEntry,
  ) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === exerciseId ? updater(e) : e)),
    }))
  }

  const canSave = !isSessionEmpty(draft)

  const handleSave = async () => {
    if (!canSave) return
    await saveSession(pruneSession(draft))
    onClose()
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    if (session) await deleteSession(session.id)
    onClose()
  }

  const handleSaveRoutine = async () => {
    const name = routineName.trim()
    if (!name) return
    await saveRoutine(routineFromSession(pruneSession(draft), name))
    setSaveAsRoutine(false)
    setRoutineName('')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={session ? '記録を編集' : '記録を追加'}
      footer={
        <div className="flex gap-2">
          {session && (
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
          <span className="mb-1 block text-xs font-medium text-slate-500">日付</span>
          <input
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, date: e.target.value as ISODate }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
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
                  onChange={(name) =>
                    updateExercise(exercise.id, (e) => ({ ...e, name }))
                  }
                  onPick={(name) =>
                    updateExercise(exercise.id, (e) => ({
                      ...e,
                      name,
                      // 部位が未選択なら、前回その種目に付けた部位を引き継ぐ
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
                <div key={set.id} className="flex items-center gap-2">
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
                        sets: ex.sets.map((s) =>
                          s.id === set.id
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
                        sets: ex.sets.map((s) =>
                          s.id === set.id
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
                        sets: ex.sets.filter((s) => s.id !== set.id),
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
                    sets: [...ex.sets, createSet(ex.sets.at(-1))],
                  }))
                }
                className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500"
              >
                + セットを追加
              </button>
            </div>

            <input
              type="text"
              value={exercise.memo}
              placeholder="この種目のメモ（任意）"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              onChange={(e) =>
                updateExercise(exercise.id, (ex) => ({ ...ex, memo: e.target.value }))
              }
            />
          </article>
        ))}

        <button
          type="button"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              exercises: [...prev.exercises, createExercise()],
            }))
          }
          className="w-full rounded-xl border border-dashed border-indigo-300 py-3 text-sm font-semibold text-indigo-600"
        >
          + 種目を追加
        </button>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">メモ</span>
          <textarea
            value={draft.memo}
            rows={3}
            placeholder="体調・調子など（任意）"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
            onChange={(e) => setDraft((prev) => ({ ...prev, memo: e.target.value }))}
          />
        </label>

        {canSave && (
          <div className="rounded-xl bg-slate-50 p-3">
            {saveAsRoutine ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={routineName}
                  placeholder="ルーティン名（例: 胸の日）"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400"
                  onChange={(e) => setRoutineName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveAsRoutine(false)}
                    className="flex-1 rounded-lg bg-white py-2 text-xs font-medium text-slate-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoutine}
                    disabled={!routineName.trim()}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    ルーティンに保存
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRoutineName(draft.memo.trim())
                  setSaveAsRoutine(true)
                }}
                className="w-full text-xs font-medium text-slate-500"
              >
                この内容をルーティンとして保存する
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="この記録を削除しますか？"
        message="削除すると元に戻せません。"
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Sheet>
  )
}
