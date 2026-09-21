/**
 * シンプルな Service Worker。
 * - ページ遷移(navigate)はネットワーク優先＋オフライン時はキャッシュした index.html
 * - JS/CSS/画像などはキャッシュ優先＋裏で更新（stale-while-revalidate）
 *
 * パスはすべて「この sw.js が置かれている場所」からの相対で解決する。
 * そのためドメイン直下でも、GitHub Pages のサブパス配信でもそのまま動く。
 */
const CACHE_NAME = 'workout-calendar-v2'

/** この Service Worker が担当する範囲のルート URL（例: https://user.github.io/repo/） */
const ROOT = new URL('./', self.location.href)
const INDEX_URL = new URL('index.html', ROOT).href
const APP_SHELL = [ROOT.href, INDEX_URL, new URL('manifest.webmanifest', ROOT).href]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // 担当範囲の外（同一ドメインの別アプリなど）には手を出さない
  if (!url.pathname.startsWith(ROOT.pathname)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_URL, copy))
          return response
        })
        .catch(() =>
          caches.match(INDEX_URL).then((cached) => cached || Response.error()),
        ),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetching = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || fetching
    }),
  )
})
