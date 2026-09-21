import { useMemo, useState } from 'react'
import { useApp } from '../store/useApp'
import {
  buildBuckets,
  exerciseNameSuggestions,
  exerciseProgress,
  frequencyByPeriod,
  summarize,
} from '../lib/selectors'
import { LineChart, StackedBarChart } from '../components/Charts'
import { SessionCard } from '../components/SessionCard'
import { MuscleTag } from '../components/MuscleTag'
import { formatDateLabel } from '../lib/date'

type Period = 'week' | 'month'
type Metric = 'maxWeight' | 'estimated1RM' | 'volume'

const METRIC_LABELS: Record<Metric, string> = {
  maxWeight: '最大重量',
  estimated1RM: '推定1RM',
  volume: 'ボリューム',
}

export function StatsPage() {
  const { sessions, muscleGroups, groupMap, settings } = useApp()
  const [period, setPeriod] = useState<Period>('week')
  const [metric, setMetric] = useState<Metric>('maxWeight')
  const [selectedExercise, setSelectedExercise] = useState('')

  const exerciseNames = useMemo(() => exerciseNameSuggestions(sessions), [sessions])
  // 未選択、または選択中の種目が消えた場合は、いちばんよく行っている種目を表示する
  const exercise =
    selectedExercise && exerciseNames.includes(selectedExercise)
      ? selectedExercise
      : (exerciseNames[0] ?? '')

  const rows = useMemo(() => {
    const buckets = buildBuckets(
      period,
      period === 'week' ? 12 : 6,
      settings.weekStartsOn,
    )
    return frequencyByPeriod(sessions, buckets)
  }, [sessions, period, settings.weekStartsOn])

  const totalsByGroup = useMemo(() => {
    const totals = new Map<string, number>()
    for (const row of rows) {
      for (const [id, count] of Object.entries(row.countsByGroup)) {
        totals.set(id, (totals.get(id) ?? 0) + count)
      }
    }
    return totals
  }, [rows])

  const progress = useMemo(
    () => (exercise ? exerciseProgress(sessions, exercise) : []),
    [sessions, exercise],
  )

  const points = useMemo(
    () =>
      progress
        .filter((p) => p[metric] > 0)
        .map((p) => ({ label: formatDateLabel(p.date).replace(/\(.\)$/, ''), value: p[metric] })),
    [progress, metric],
  )

  const stats = useMemo(
    () => summarize(sessions, settings.weekStartsOn),
    [sessions, settings.weekStartsOn],
  )

  const recent = sessions.slice(0, 10)
  const best = progress.reduce(
    (acc, p) => (p[metric] > acc ? p[metric] : acc),
    0,
  )

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <header className="safe-top">
        <h1 className="text-xl font-bold text-slate-800">統計</h1>
      </header>

      <section className="grid grid-cols-4 gap-2">
        {[
          ['今週', stats.thisWeekDays],
          ['今月', stats.thisMonthDays],
          ['連続', stats.currentStreak],
          ['通算', stats.totalDays],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-2 text-center shadow-sm">
            <div className="text-[11px] text-slate-400">{label}</div>
            <div className="text-lg font-bold text-slate-800">
              {value}
              <span className="ml-0.5 text-[11px] font-normal text-slate-400">日</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">部位ごとの頻度</h2>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {(['week', 'month'] as Period[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-md px-3 py-1 font-medium ${
                  period === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {key === 'week' ? '週別' : '月別'}
              </button>
            ))}
          </div>
        </div>

        <StackedBarChart rows={rows} groups={muscleGroups} groupMap={groupMap} />

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
          {muscleGroups.map((group) => (
            <li key={group.id} className="flex items-center gap-1">
              <MuscleTag group={group} size="sm" />
              <span className="text-[11px] text-slate-500">
                {totalsByGroup.get(group.id) ?? 0}日
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">種目ごとの推移</h2>

        {exerciseNames.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            記録を追加するとグラフが表示されます
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <select
                value={exercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {(Object.keys(METRIC_LABELS) as Metric[]).map((key) => (
                  <option key={key} value={key}>
                    {METRIC_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 text-xs text-slate-400">
              最高 {(Math.round(best * 10) / 10).toLocaleString()}
              {metric === 'volume' ? '' : settings.weightUnit} ・ 記録 {progress.length}回
            </div>

            <LineChart
              points={points}
              unitLabel={metric === 'volume' ? '' : settings.weightUnit}
            />
          </>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-slate-700">直近のトレーニング</h2>
        {recent.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            まだ記録がありません
          </p>
        ) : (
          recent.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              groupMap={groupMap}
              unit={settings.weightUnit}
              showDate
            />
          ))
        )}
      </section>
    </div>
  )
}
