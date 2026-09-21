import type { MuscleGroup } from '../types'
import type { FrequencyRow } from '../lib/selectors'
import { resolveGroup, withAlpha } from '../lib/colors'

/**
 * グラフはライブラリを使わず SVG で自作する（依存を増やさないため）。
 */

/** 部位ごとの積み上げ棒グラフ（週別 / 月別のトレーニング頻度） */
export function StackedBarChart({
  rows,
  groups,
  groupMap,
  height = 160,
}: {
  rows: FrequencyRow[]
  /** 凡例・積み上げ順に使う部位一覧 */
  groups: MuscleGroup[]
  groupMap: Map<string, MuscleGroup>
  height?: number
}) {
  const totals = rows.map((row) =>
    Object.values(row.countsByGroup).reduce((sum, n) => sum + n, 0),
  )
  const max = Math.max(1, ...totals)
  const barAreaHeight = height - 22

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {rows.map((row, index) => {
          const stack = groups
            .map((group) => ({ group, count: row.countsByGroup[group.id] ?? 0 }))
            .filter((item) => item.count > 0)
          // 設定に無い（削除済みの）部位も拾う
          for (const [id, count] of Object.entries(row.countsByGroup)) {
            if (!groups.some((g) => g.id === id) && count > 0) {
              stack.push({ group: resolveGroup(groupMap, id), count })
            }
          }
          const total = totals[index]

          return (
            <div key={row.bucket.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="flex w-full flex-col-reverse justify-start rounded-md"
                style={{ height: barAreaHeight }}
              >
                {stack.map((item) => (
                  <div
                    key={item.group.id}
                    title={`${item.group.name} ${item.count}日`}
                    style={{
                      height: `${(item.count / max) * 100}%`,
                      backgroundColor: item.group.color,
                    }}
                    className="w-full first:rounded-t-md"
                  />
                ))}
                {total === 0 && (
                  <div className="h-[3px] w-full rounded bg-slate-100" />
                )}
              </div>
              <span className="text-[10px] text-slate-400">{row.bucket.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface LinePoint {
  label: string
  value: number
}

/** 折れ線グラフ（種目ごとの重量推移） */
export function LineChart({
  points,
  color = '#4f46e5',
  unitLabel = '',
  height = 180,
}: {
  points: LinePoint[]
  color?: string
  unitLabel?: string
  height?: number
}) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">データがありません</p>
    )
  }

  const width = 320
  const padding = { top: 16, right: 22, bottom: 22, left: 34 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const values = points.map((p) => p.value)
  const rawMax = Math.max(...values)
  const rawMin = Math.min(...values)
  const max = rawMax === rawMin ? rawMax + 1 : rawMax
  const min = rawMax === rawMin ? Math.max(0, rawMax - 1) : Math.max(0, rawMin - (rawMax - rawMin) * 0.15)

  const x = (i: number) =>
    padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (value: number) =>
    padding.top + innerH - ((value - min) / (max - min)) * innerH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${path} L${x(points.length - 1)},${padding.top + innerH} L${x(0)},${padding.top + innerH} Z`
  const gridValues = [max, (max + min) / 2, min]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="重量の推移グラフ"
    >
      {gridValues.map((value) => (
        <g key={value}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y(value)}
            y2={y(value)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <text x={2} y={y(value) + 3} fontSize="9" fill="#94a3b8">
            {Math.round(value * 10) / 10}
          </text>
        </g>
      ))}

      <path d={area} fill={withAlpha(color, 0.12)} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {points.map((point, i) => (
        <g key={`${point.label}-${i}`}>
          <circle cx={x(i)} cy={y(point.value)} r="3" fill="#fff" stroke={color} strokeWidth="2" />
          {(points.length <= 8 || i % Math.ceil(points.length / 6) === 0) && (
            <text
              x={x(i)}
              y={height - 6}
              fontSize="9"
              fill="#94a3b8"
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            >
              {point.label}
            </text>
          )}
        </g>
      ))}

      {unitLabel && (
        <text x={width - 2} y={9} fontSize="9" fill="#94a3b8" textAnchor="end">
          {unitLabel}
        </text>
      )}
    </svg>
  )
}
