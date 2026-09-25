import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

/** 画面に表示するバージョン。上げるときは `npm version patch --no-git-tag-version` など */
const APP_VERSION: string = JSON.parse(readFileSync('package.json', 'utf8')).version

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/**
 * sw/sw.js をテンプレートとして、ビルド結果に合わせた dist/sw.js を作る。
 * - キャッシュするファイル一覧をビルド結果から自動で作る（手で書くと漏れるため）
 * - ビルド結果の中身からハッシュを作って埋め込む。中身が変わると sw.js も必ず変わるので、
 *   バージョンを上げ忘れても、公開すればアプリ側で「更新があります」が出る
 */
function serviceWorker(): Plugin {
  let root = ''
  let outDir = ''
  return {
    name: 'workout-calendar:service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = listFiles(outDir)
        .map((path) => relative(outDir, path).replaceAll('\\', '/'))
        // sw.js 自身と、.nojekyll のような隠しファイルはキャッシュしない
        .filter((path) => path !== 'sw.js' && !path.split('/').some((p) => p.startsWith('.')))
        .sort()

      const hash = createHash('sha256')
      for (const path of files) {
        hash.update(path)
        hash.update(readFileSync(join(outDir, path)))
      }
      const buildId = hash.digest('hex').slice(0, 12)

      const template = readFileSync(resolve(root, 'sw/sw.js'), 'utf8')
      const replacements: Array<[string, string]> = [
        [`'__APP_VERSION__'`, JSON.stringify(APP_VERSION)],
        [`'__BUILD_ID__'`, JSON.stringify(buildId)],
        ['[/* __ASSETS__ */]', JSON.stringify(files.map((path) => `./${path}`), null, 2)],
      ]
      let code = template
      for (const [placeholder, value] of replacements) {
        if (!code.includes(placeholder)) {
          throw new Error(`sw/sw.js に ${placeholder} が見つかりません`)
        }
        code = code.replace(placeholder, value)
      }
      writeFileSync(join(outDir, 'sw.js'), code)
      console.log(`sw.js: バージョン ${APP_VERSION}（${buildId}）、キャッシュ対象 ${files.length} 件`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // 相対パスで出力する。こうすると GitHub Pages のような
  // サブパス配信（https://user.github.io/repo/）でも、
  // Netlify のようなドメイン直下でも、同じビルドがそのまま動く。
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [react(), tailwindcss(), serviceWorker()],
  server: {
    host: true, // iPhone から LAN 経由で開けるように
  },
})
