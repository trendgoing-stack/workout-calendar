import type { MuscleGroup, WeightUnit, WorkoutSession } from '../types'
import { formatDateLabel } from '../lib/date'
import { sessionMuscleGroupIds, sessionSetCount, sessionVolume } from '../lib/selectors'
import { MuscleTag } from './MuscleTag'
import { resolveGroup } from '../lib/colors'

/** セット内容を「60kg × 10 / 65kg × 8」のような1行に整形する */
function formatSets(
  sets: WorkoutSession['exercises'][number]['sets'],
  unit: WeightUnit,
): string {
  if (sets.length === 0) return '記録なし'
  return sets
    .map((set) => {
      const weight = set.weight === null ? '' : `${set.weight}${unit}`
      const reps = set.reps === null ? '' : `${set.reps}回`
      if (weight && reps) return `${weight} × ${reps}`
      return weight || reps || '-'
    })
    .join(' / ')
}

export function SessionCard({
  session,
  groupMap,
  unit,
  showDate = false,
  onClick,
}: {
  session: WorkoutSession
  groupMap: Map<string, MuscleGroup>
  unit: WeightUnit
  showDate?: boolean
  onClick?: () => void
}) {
  const groupIds = sessionMuscleGroupIds(session)
  const volume = sessionVolume(session)

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {showDate && (
            <span className="text-sm font-semibold text-slate-700">
              {formatDateLabel(session.date)}
            </span>
          )}
          {groupIds.map((id) => (
            <MuscleTag key={id} group={resolveGroup(groupMap, id)} size="sm" />
          ))}
        </div>
        <span className="shrink-0 text-[11px] text-slate-400">
          {session.exercises.length}種目 / {sessionSetCount(session)}セット
        </span>
      </div>

      <ul className="mt-2 space-y-1.5">
        {session.exercises.map((exercise) => (
          <li key={exercise.id} className="text-sm">
            <span className="font-medium text-slate-700">{exercise.name}</span>
            <span className="ml-2 text-xs text-slate-500">
              {formatSets(exercise.sets, unit)}
            </span>
            {exercise.memo && (
              <span className="ml-2 text-xs text-slate-400">📝{exercise.memo}</span>
            )}
          </li>
        ))}
      </ul>

      {(session.memo || volume > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <span className="truncate text-xs text-slate-500">{session.memo}</span>
          {volume > 0 && (
            <span className="shrink-0 text-[11px] text-slate-400">
              総ボリューム {volume.toLocaleString()}
              {unit}
            </span>
          )}
        </div>
      )}
    </>
  )

  if (!onClick) {
    return <div className="rounded-xl bg-white p-3 shadow-sm">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white p-3 text-left shadow-sm transition-colors active:bg-slate-50"
    >
      {content}
    </button>
  )
}
