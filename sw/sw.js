/**
 * Service Worker：キャッシュ優先で完全オフライン動作させる。
 *
 * このファイルはテンプレート。`npm run build` のときに vite.config.ts の
 * serviceWorker プラグインが下の3つの値を埋め込み、dist/sw.js として出力する。
 *   VERSION  … package.json の version（画面に表示するバージョン）
 *   BUILD_ID … ビルド結果の中身から計算したハッシュ。中身が変われば必ず変わる
 *   ASSETS   … キャッシュするファイルの一覧（ビルド結果から自動生成）
 *
 * 更新の流れ：
 *  1. 中身の違うビルドを公開すると BUILD_ID が変わり、sw.js 自体が変化する
 *  2. ブラウザがそれを検出すると、新しい SW がファイルを取り直してキャッシュする
 *     （HTTP キャッシュを使わず必ずサーバーから取る。古いファイルと新しいファイルが混ざらないように）
 *  3. 画面上部に「更新があります」を出し、タップされたら新しい SW に切り替えて再読み込みする
 *  4. 切り替わった SW が古いキャッシュを削除する
 *
 * パスはすべて「この sw.js が置かれている場所」からの相対で解決するので、
 * GitHub Pages のサブパス配信（/workout-calendar/）でもそのまま動く。
 */
const VERSION = '__APP_VERSION__'
const BUILD_ID = '__BUILD_ID__'
const ASSETS = [/* __ASSETS__ */]

const CACHE_PREFIX = 'workout-calendar-'
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}-${BUILD_ID}`

/** この Service Worker が担当する範囲のルート URL（例: https://user.github.io/repo/） */
const ROOT = new URL('./', self.location.href)
const INDEX_URL = new URL('index.html', ROOT).href

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          ASSETS.map((path) => new Request(new URL(path, ROOT), { cache: 'reload' })),
        ),
      ),
  )
  // すぐには切り替えない（画面側で「更新があります」をタップしてもらう）
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // アクセス解析など、別ドメインへの通信には手を出さない
  if (url.origin !== self.location.origin) return
  // 担当範囲の外（同一ドメインの別アプリなど）にも手を出さない
  if (!url.pathname.startsWith(ROOT.pathname)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // ページの表示は常にキャッシュ済みの index.html を返す
      const cached =
        request.mode === 'navigate'
          ? await cache.match(INDEX_URL)
          : await cache.match(request, { ignoreSearch: true })
      return cached ?? fetch(request)
    })(),
  )
})
