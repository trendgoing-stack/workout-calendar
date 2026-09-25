/**
 * Service Worker の登録と、新しいバージョンの検出。
 *
 * 新しいバージョンの sw.js が見つかるとインストールまで済ませて待機させ、
 * 画面上部の「更新があります」をタップされたら切り替えて再読み込みする。
 * 画面側は useSyncExternalStore で subscribeUpdate / getUpdateState を購読する。
 */

export interface UpdateState {
  /** 新しいバージョンが待機している */
  available: boolean
  /** 切り替え中（タップ済み） */
  applying: boolean
}

let state: UpdateState = { available: false, applying: false }
let waitingWorker: ServiceWorker | null = null
const listeners = new Set<() => void>()

function setState(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export function subscribeUpdate(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getUpdateState(): UpdateState {
  return state
}

/** 待機中の新しいバージョンに切り替える（切り替わると controllerchange で再読み込みされる） */
export function applyUpdate(): void {
  if (!waitingWorker) {
    window.location.reload()
    return
  }
  setState({ applying: true })
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}

function markWaiting(worker: ServiceWorker): void {
  waitingWorker = worker
  setState({ available: true })
}

export function registerServiceWorker(): void {
  // 開発中（vite dev）は登録しない
  if (import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return
  // localhost 以外の http では SW が使えない（iPhone 実機は GitHub Pages の https で確認する）
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 初回インストール時にも発火するので、更新が待機していたときだけ再読み込みする
    // （別のタブで更新された場合も、ここで新しいバージョンに揃う）
    if (!state.available || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    // BASE_URL 起点にすることで、サブパスに配置しても正しい sw.js を登録できる
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        // すでに待機中の新バージョンがある（前回開いたときに取得済み）
        if (registration.waiting && navigator.serviceWorker.controller) {
          markWaiting(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            // controller がある＝初回インストールではなく更新
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              markWaiting(worker)
            }
          })
        })

        // ホーム画面から起動したアプリは開きっぱなしになりやすいため、表示のたびに更新を確認する
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => {})
        })
      })
      .catch((error) => {
        // 登録できなくてもアプリは使える
        console.error('Service Worker の登録に失敗しました', error)
      })
  })
}
