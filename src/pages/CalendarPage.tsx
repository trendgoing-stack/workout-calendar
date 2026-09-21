import { useMemo, useState } from 'react'
import type { ISODate, WorkoutSession } from '../types'
import { useApp } from '../store/useApp'
import { formatFullDateLabel, parseISODate, todayISO } from '../lib/date'
import { summarize } from '../lib/selectors'
import { MonthCalendar } from '../components/MonthCalendar'
import { SessionCard } from '../components/SessionCard'
import { SessionEditor } from '../components/SessionEditor'
import { RoutinePicker } from '../components/RoutinePicker'
import { MuscleTag } from '../components/MuscleTag'

interface EditorState {
  date: ISODate
  session: WorkoutSession | null
  /** 開くたびにエディタを作り直すためのキー */
  key: string
}

export function CalendarPage() {
  const { sessionsByDate, groupMap, muscleGroups, settings, sessions } = useApp()
  const [selectedDate, setSelectedDate] = useState<ISODate>(todayISO)
  const [viewDate, setViewDate] = useState(() => {
    const today = parseISODate(todayISO())
    return { year: today.getFullYear(), month: today.getMonth() }
  })
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [routineOpen, setRoutineOpen] = useState(false)

  const daySessions = sessionsByDate.get(selectedDate) ?? []
  const stats = useMemo(
    () => summarize(sessions, settings.weekStartsOn),
    [sessions, settings.weekStartsOn],
  )

  const shiftMonth = (delta: number) => {
    setViewDate(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const goToday = () => {
    const today = parseISODate(todayISO())
    setViewDate({ year: today.getFullYear(), month: today.getMonth() })
    setSelectedDate(todayISO())
  }

  const openNew = () =>
    setEditor({ date: selectedDate, session: null, key: `new-${Date.now()}` })

  const openEdit = (session: WorkoutSession) =>
    setEditor({ date: session.date, session, key: session.id })

  const selectDate = (date: ISODate) => {
    setSelectedDate(date)
    const parsed = parseISODate(date)
    if (parsed.getMonth() !== viewDate.month || parsed.getFullYear() !== viewDate.year) {
      setViewDate({ year: parsed.getFullYear(), month: parsed.getMonth() })
    }
  }

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <header className="safe-top">
        <h1 className="text-xl font-bold text-slate-800">トレーニング記録</h1>
        <p className="mt-1 text-xs text-slate-500">
          今週 {stats.thisWeekDays}日 ・ 今月 {stats.thisMonthDays}日 ・ 連続{' '}
          {stats.currentStreak}日
        </p>
      </header>

      <MonthCalendar
        year={viewDate.year}
        month={viewDate.month}
        weekStartsOn={settings.weekStartsOn}
        sessionsByDate={sessionsByDate}
        groupMap={groupMap}
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        onToday={goToday}
      />

      <div className="flex flex-wrap gap-1.5 px-1">
        {muscleGroups.map((group) => (
          <MuscleTag key={group.id} group={group} size="sm" />
        ))}
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-700">
            {formatFullDateLabel(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={() => setRoutineOpen(true)}
            className="text-xs font-medium text-indigo-600"
          >
            ルーティンから追加
          </button>
        </div>

        {daySessions.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            この日の記録はまだありません
          </p>
        ) : (
          <div className="space-y-2">
            {daySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                groupMap={groupMap}
                unit={settings.weightUnit}
                onClick={() => openEdit(session)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openNew}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm active:bg-indigo-700"
        >
          + この日に記録を追加
        </button>
      </section>

      {editor && (
        <SessionEditor
          key={editor.key}
          open
          date={editor.date}
          session={editor.session}
          onClose={() => setEditor(null)}
        />
      )}

      {routineOpen && (
        <RoutinePicker
          open
          date={selectedDate}
          onClose={() => setRoutineOpen(false)}
        />
      )}
    </div>
  )
}
