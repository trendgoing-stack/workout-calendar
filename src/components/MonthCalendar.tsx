import { useMemo } from 'react'
import type { ISODate, MuscleGroup, WeekStart, WorkoutSession } from '../types'
import { buildMonthGrid, formatMonthLabel, weekdayLabels } from '../lib/date'
import { sessionMuscleGroupIds } from '../lib/selectors'
import { resolveGroup, withAlpha } from '../lib/colors'

interface Props {
  year: number
  month: number // 0-11
  weekStartsOn: WeekStart
  sessionsByDate: Map<ISODate, WorkoutSession[]>
  groupMap: Map<string, MuscleGroup>
  selectedDate: ISODate | null
  onSelectDate: (date: ISODate) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

/** 月表示カレンダー（ライブラリ不使用の自作） */
export function MonthCalendar({
  year,
  month,
  weekStartsOn,
  sessionsByDate,
  groupMap,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) {
  const cells = useMemo(
    () => buildMonthGrid(year, month, weekStartsOn),
    [year, month, weekStartsOn],
  )
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn])

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="前の月"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onToday}
          className="text-lg font-semibold text-slate-800"
        >
          {formatMonthLabel(year, month)}
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="次の月"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </header>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
        {labels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell) => {
          const sessions = sessionsByDate.get(cell.date) ?? []
          const groupIds = [...new Set(sessions.flatMap(sessionMuscleGroupIds))]
          const isSelected = cell.date === selectedDate
          const hasRecord = sessions.length > 0

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`flex h-14 flex-col items-center justify-start gap-1 rounded-lg pt-1.5 transition-colors ${
                isSelected ? 'bg-indigo-50 ring-1 ring-indigo-300' : ''
              } ${cell.inCurrentMonth ? '' : 'opacity-35'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                  cell.isToday
                    ? 'bg-indigo-600 font-bold text-white'
                    : cell.weekday === 0
                      ? 'text-red-400'
                      : cell.weekday === 6
                        ? 'text-blue-400'
                        : 'text-slate-700'
                }`}
              >
                {cell.day}
              </span>

              <span className="flex min-h-[10px] flex-wrap items-center justify-center gap-[3px] px-0.5">
                {groupIds.slice(0, 4).map((id) => {
                  const group = resolveGroup(groupMap, id)
                  return (
                    <span
                      key={id}
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                  )
                })}
                {groupIds.length === 0 && hasRecord && (
                  <span
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ backgroundColor: withAlpha('#94a3b8', 0.9) }}
                  />
                )}
                {groupIds.length > 4 && (
                  <span className="text-[8px] leading-none text-slate-400">+</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
