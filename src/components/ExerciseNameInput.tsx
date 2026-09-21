import { useMemo, useRef, useState } from 'react'

/**
 * 種目名の入力欄。
 * 過去に入力した種目名をサジェスト表示する（iOS Safari で datalist が
 * 期待通りに動かないため自前で実装）。
 */
export function ExerciseNameInput({
  value,
  suggestions,
  onChange,
  onPick,
}: {
  value: string
  suggestions: string[]
  onChange: (value: string) => void
  /** サジェストから選んだとき（部位の自動補完などに使う） */
  onPick: (value: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<number | undefined>(undefined)

  const matches = useMemo(() => {
    const keyword = value.trim().toLowerCase()
    const list = keyword
      ? suggestions.filter((name) => name.toLowerCase().includes(keyword))
      : suggestions
    return list.filter((name) => name !== value).slice(0, 6)
  }, [suggestions, value])

  const open = focused && matches.length > 0

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder="種目名（例: ベンチプレス）"
        enterKeyHint="done"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 font-medium outline-none focus:border-indigo-400"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          window.clearTimeout(blurTimer.current)
          setFocused(true)
        }}
        onBlur={() => {
          // 候補のタップを拾うために少し遅らせて閉じる
          blurTimer.current = window.setTimeout(() => setFocused(false), 150)
        }}
      />
      {open && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-700 active:bg-indigo-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(name)
                  setFocused(false)
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
