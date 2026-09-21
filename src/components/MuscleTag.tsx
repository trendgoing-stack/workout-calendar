import type { MuscleGroup } from '../types'
import { withAlpha } from '../lib/colors'

/** 部位タグの表示用チップ */
export function MuscleTag({
  group,
  size = 'md',
}: {
  group: MuscleGroup
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
      style={{ backgroundColor: withAlpha(group.color, 0.14), color: group.color }}
    >
      {group.name}
    </span>
  )
}

/** 部位タグの選択ボタン（複数選択可） */
export function MuscleTagPicker({
  groups,
  selected,
  onToggle,
}: {
  groups: MuscleGroup[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((group) => {
        const isOn = selected.includes(group.id)
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onToggle(group.id)}
            aria-pressed={isOn}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              isOn
                ? {
                    backgroundColor: group.color,
                    borderColor: group.color,
                    color: '#fff',
                  }
                : {
                    backgroundColor: '#fff',
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                  }
            }
          >
            {group.name}
          </button>
        )
      })}
    </div>
  )
}
