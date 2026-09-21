/**
 * Service Worker の登録。
 * 開発中（vite dev）は登録せず、本番ビルドでのみ有効にする。
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    // BASE_URL 起点にすることで、サブパスに配置しても正しい sw.js を登録できる
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Service Worker の登録に失敗しました', error)
    })
  })
}
