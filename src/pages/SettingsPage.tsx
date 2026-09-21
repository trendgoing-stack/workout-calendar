import { useRef, useState } from 'react'
import type { MuscleGroup, WeekStart, WeightUnit } from '../types'
import { useApp } from '../store/useApp'
import { COLOR_PALETTE } from '../lib/constants'
import { createId } from '../lib/id'
import { downloadJson, readJsonFile } from '../lib/backup'
import { looksLikeAppData } from '../lib/normalize'
import { ConfirmDialog } from '../components/Sheet'

export function SettingsPage() {
  const {
    data,
    muscleGroups,
    settings,
    sessions,
    routines,
    updateSettings,
    importData,
    clearAll,
    loadSampleData,
  } = useApp()

  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<unknown>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<MuscleGroup | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const notify = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 3000)
  }

  const patchGroup = (id: string, patch: Partial<MuscleGroup>) =>
    updateSettings({
      muscleGroups: muscleGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })

  const moveGroup = (id: string, delta: number) => {
    const index = muscleGroups.findIndex((g) => g.id === id)
    const next = index + delta
    if (index === -1 || next < 0 || next >= muscleGroups.length) return
    const reordered = [...muscleGroups]
    const [item] = reordered.splice(index, 1)
    reordered.splice(next, 0, item)
    updateSettings({ muscleGroups: reordered.map((g, i) => ({ ...g, order: i })) })
  }

  const addGroup = () =>
    updateSettings({
      muscleGroups: [
        ...muscleGroups,
        {
          id: createId(),
          name: '新しい部位',
          color: COLOR_PALETTE[muscleGroups.length % COLOR_PALETTE.length],
          order: muscleGroups.length,
        },
      ],
    })

  const handleFile = async (file: File) => {
    try {
      const parsed = await readJsonFile(file)
      if (!looksLikeAppData(parsed)) {
        notify('このファイルは読み込めませんでした')
        return
      }
      setPendingImport(parsed)
    } catch {
      notify('JSON の読み込みに失敗しました')
    }
  }

  return (
    <div className="space-y-4 px-4 pb-4 pt-4">
      <header className="safe-top">
        <h1 className="text-xl font-bold text-slate-800">設定</h1>
      </header>

      {message && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">部位タグ</h2>
        <ul className="space-y-2">
          {muscleGroups.map((group, index) => (
            <li key={group.id} className="flex items-center gap-2">
              <label className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200">
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundColor: group.color }}
                />
                <input
                  type="color"
                  value={group.color}
                  aria-label={`${group.name}の色`}
                  className="h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => patchGroup(group.id, { color: e.target.value })}
                />
              </label>
              <input
                type="text"
                value={group.name}
                aria-label="部位名"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                onChange={(e) => patchGroup(group.id, { name: e.target.value })}
              />
              <button
                type="button"
                aria-label="上へ"
                disabled={index === 0}
                onClick={() => moveGroup(group.id, -1)}
                className="rounded p-1 text-slate-300 disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="下へ"
                disabled={index === muscleGroups.length - 1}
                onClick={() => moveGroup(group.id, 1)}
                className="rounded p-1 text-slate-300 disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={`${group.name}を削除`}
                onClick={() => setConfirmDeleteGroup(group)}
                className="rounded p-1 text-slate-300 hover:text-red-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addGroup}
          className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500"
        >
          + 部位タグを追加
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">表示</h2>

        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-slate-600">重量の単位</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {(['kg', 'lb'] as WeightUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => updateSettings({ weightUnit: unit })}
                className={`rounded-md px-3 py-1 font-medium ${
                  settings.weightUnit === unit
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-slate-600">週の開始曜日</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            {([1, 0] as WeekStart[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ weekStartsOn: value })}
                className={`rounded-md px-3 py-1 font-medium ${
                  settings.weekStartsOn === value
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {value === 1 ? '月曜' : '日曜'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">データ</h2>
        <p className="mb-3 text-xs text-slate-400">
          記録 {sessions.length}件 ・ ルーティン {routines.length}件（この端末のブラウザに保存されています）
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              downloadJson(data)
              notify('JSON をダウンロードしました')
            }}
            className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700"
          >
            エクスポート（JSON）
          </button>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700"
          >
            インポート（JSON）
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleFile(file)
            }}
          />

          {sessions.length === 0 && (
            <button
              type="button"
              onClick={async () => {
                await loadSampleData()
                notify('サンプルデータを追加しました')
              }}
              className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-700"
            >
              サンプルデータを入れて試す
            </button>
          )}

          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="w-full rounded-lg bg-red-50 py-2.5 text-sm font-medium text-red-500"
          >
            全データを削除
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-slate-500 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">ホーム画面に追加</h2>
        iPhone の Safari でこのページを開き、共有ボタン →「ホーム画面に追加」を選ぶと、
        アプリのように全画面で使えます（オフラインでも起動します）。
      </section>

      <ConfirmDialog
        open={pendingImport !== null}
        title="データをインポートしますか？"
        message="現在のデータはすべて置き換わります。念のため先にエクスポートしておくことをおすすめします。"
        confirmLabel="インポート"
        destructive
        onConfirm={async () => {
          const payload = pendingImport
          setPendingImport(null)
          await importData(payload)
          notify('インポートしました')
        }}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="全データを削除しますか？"
        message="記録・ルーティン・設定がすべて消えます。元に戻せません。"
        confirmLabel="削除する"
        destructive
        onConfirm={async () => {
          setConfirmClear(false)
          await clearAll()
          notify('全データを削除しました')
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmDeleteGroup !== null}
        title={`「${confirmDeleteGroup?.name ?? ''}」を削除しますか？`}
        message="この部位を使っている過去の記録は残りますが、タグは「その他」と表示されます。"
        confirmLabel="削除する"
        destructive
        onConfirm={async () => {
          const target = confirmDeleteGroup
          setConfirmDeleteGroup(null)
          if (!target) return
          await updateSettings({
            muscleGroups: muscleGroups
              .filter((g) => g.id !== target.id)
              .map((g, i) => ({ ...g, order: i })),
          })
        }}
        onCancel={() => setConfirmDeleteGroup(null)}
      />
    </div>
  )
}
