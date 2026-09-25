import { useState } from 'react'
import { AppProvider } from './store/AppContext'
import { useApp } from './store/useApp'
import { TabBar } from './components/TabBar'
import { UpdateBanner } from './components/UpdateBanner'
import type { TabKey } from './components/TabBar'
import { CalendarPage } from './pages/CalendarPage'
import { StatsPage } from './pages/StatsPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { SettingsPage } from './pages/SettingsPage'

function Shell() {
  const [tab, setTab] = useState<TabKey>('calendar')
  const { loading, error, dismissError } = useApp()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        読み込み中…
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-20">
      <UpdateBanner />
      <main className="mx-auto max-w-lg">
        {tab === 'calendar' && <CalendarPage />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'routines' && <RoutinesPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>

      {error && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-sm px-4">
          <button
            type="button"
            onClick={dismissError}
            className="w-full rounded-xl bg-red-500 px-4 py-3 text-left text-sm text-white shadow-lg"
          >
            {error}
            <span className="ml-2 opacity-70">（タップで閉じる）</span>
          </button>
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
