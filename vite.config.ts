import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相対パスで出力する。こうすると GitHub Pages のような
  // サブパス配信（https://user.github.io/repo/）でも、
  // Netlify のようなドメイン直下でも、同じビルドがそのまま動く。
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // iPhone から LAN 経由で開けるように
  },
})
