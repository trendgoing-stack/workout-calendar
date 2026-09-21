import type { ISODate, WeekStart } from '../types'

/** Date -> 'YYYY-MM-DD'（ローカルタイム基準。UTC ずれを起こさない） */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' -> Date（ローカルの 0:00） */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function isValidISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = parseISODate(value)
  return toISODate(d) === value
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/** その週の開始日（weekStartsOn: 0=日曜, 1=月曜） */
export function startOfWeek(date: Date, weekStartsOn: WeekStart): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7
  const start = addDays(date, -diff)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate())
}

/** 週の識別キー（その週の開始日の ISO 日付） */
export function weekKey(iso: ISODate, weekStartsOn: WeekStart): string {
  return toISODate(startOfWeek(parseISODate(iso), weekStartsOn))
}

/** 月の識別キー 'YYYY-MM' */
export function monthKey(iso: ISODate): string {
  return iso.slice(0, 7)
}

export const WEEKDAY_LABELS_SUN = ['日', '月', '火', '水', '木', '金', '土']

/** 週の開始曜日に合わせた曜日ラベル */
export function weekdayLabels(weekStartsOn: WeekStart): string[] {
  return WEEKDAY_LABELS_SUN.slice(weekStartsOn).concat(
    WEEKDAY_LABELS_SUN.slice(0, weekStartsOn),
  )
}

export interface CalendarCell {
  date: ISODate
  day: number
  /** 表示中の月に属する日か（前後の月のはみ出し分は false） */
  inCurrentMonth: boolean
  /** 0=日曜 ... 6=土曜 */
  weekday: number
  isToday: boolean
}

/** 月表示カレンダーのマス目（6週=42日固定ではなく必要な週数だけ）を作る */
export function buildMonthGrid(
  year: number,
  month: number, // 0-11
  weekStartsOn: WeekStart,
): CalendarCell[] {
  const first = new Date(year, month, 1)
  const gridStart = startOfWeek(first, weekStartsOn)
  const lastDay = new Date(year, month + 1, 0)
  const gridEnd = addDays(startOfWeek(lastDay, weekStartsOn), 6)

  const cells: CalendarCell[] = []
  const today = todayISO()
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    const iso = toISODate(d)
    cells.push({
      date: iso,
      day: d.getDate(),
      inCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
      weekday: d.getDay(),
      isToday: iso === today,
    })
  }
  return cells
}

/** 'YYYY年M月' */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`
}

/** 'M月D日(木)' */
export function formatDateLabel(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAY_LABELS_SUN[d.getDay()]})`
}

/** 'YYYY年M月D日(木)' */
export function formatFullDateLabel(iso: ISODate): string {
  const d = parseISODate(iso)
  return `${d.getFullYear()}年${formatDateLabel(iso)}`
}

/** 日付差（日数）。iso が今日から何日前か */
export function daysAgo(iso: ISODate): number {
  const diff = parseISODate(todayISO()).getTime() - parseISODate(iso).getTime()
  return Math.round(diff / 86_400_000)
}
