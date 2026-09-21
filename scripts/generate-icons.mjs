/**
 * PWA 用アイコン(PNG)を生成するスクリプト。外部ライブラリは使わない。
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = [79, 70, 229] // indigo-600
const FG = [255, 255, 255]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let offset = 0
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelAt(x / size, y / size)
      raw[offset++] = r
      raw[offset++] = g
      raw[offset++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** ダンベルの形（0..1 の正規化座標） */
function isDumbbell(x, y, scale) {
  const cx = 0.5
  const cy = 0.5
  const nx = (x - cx) / scale + cx
  const ny = (y - cy) / scale + cy
  const inRect = (x0, y0, x1, y1) => nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1
  return (
    inRect(0.3, 0.455, 0.7, 0.545) || // シャフト
    inRect(0.2, 0.33, 0.31, 0.67) || // 内側プレート(左)
    inRect(0.69, 0.33, 0.8, 0.67) || // 内側プレート(右)
    inRect(0.13, 0.4, 0.2, 0.6) || // 外側プレート(左)
    inRect(0.8, 0.4, 0.87, 0.6) // 外側プレート(右)
  )
}

function makeIcon(size, { maskable }) {
  const scale = maskable ? 0.72 : 1
  return encodePng(size, (x, y) => (isDumbbell(x, y, scale) ? FG : BG))
}

mkdirSync(OUT_DIR, { recursive: true })
const files = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: false }],
]
for (const [name, size, options] of files) {
  writeFileSync(join(OUT_DIR, name), makeIcon(size, options))
  console.log('generated', name)
}
