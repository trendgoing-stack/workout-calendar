# 筋トレ記録カレンダー（PWA）

トレーニングをカレンダーで記録・振り返るための個人用アプリ。
React + Vite + TypeScript + Tailwind CSS、データはブラウザの localStorage に保存します（バックエンドなし）。

## 使い方

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:5173）
npm run build    # 本番ビルド（dist/）
npm run preview  # ビルド結果の確認（http://localhost:4173）
npm run lint     # oxlint
```

`npm run dev` は `--host` 付きで起動するので、同じ Wi-Fi の iPhone から
`http://<PCのIPアドレス>:5173` で開けます。

### iPhone のホーム画面に追加する

1. Safari でアプリを開く
2. 共有ボタン →「ホーム画面に追加」
3. 追加したアイコンから起動すると、全画面表示＋オフラインでも起動します

Service Worker は本番ビルド時のみ有効（`src/pwa.ts`）。開発中は登録しません。
なお **Service Worker は https か localhost でのみ動作する**ため、LAN の IP
（`http://192.168.x.x:5173`）で開いた場合はオフライン動作しません。実機で
ホーム画面追加まで試すなら、Vercel / Netlify / Cloudflare Pages などに
`dist/` をデプロイするのが簡単です。

## 画面

| タブ | 内容 |
| --- | --- |
| カレンダー | 月表示。記録した日は部位の色ドットを表示。日付をタップしてその日の記録を追加・編集 |
| 統計 | 週別／月別の部位ごとの頻度（積み上げ棒グラフ）、種目ごとの推移（折れ線）、直近の記録一覧 |
| ルーティン | よく行う種目の組み合わせをテンプレート化し、日付を選んで一括登録 |
| 設定 | 部位タグの色・名前・並び順、単位、週の開始曜日、JSON エクスポート／インポート、全削除 |

## ディレクトリ構成

```
src/
├── types/index.ts          # 保存スキーマの型定義（localStorage の中身そのもの）
├── lib/
│   ├── constants.ts        # localStorage キー、既定の部位タグ、スキーマバージョン
│   ├── storage.ts          # localStorage の読み書き（保存先を差し替えるならここ）
│   ├── repository.ts       # データ操作の窓口（すべて Promise。Supabase 移行の接続点）
│   ├── normalize.ts        # 外部データの検証・補完、サンプルデータ生成
│   ├── selectors.ts        # 集計・派生データ（純粋関数）
│   ├── factories.ts        # 空データの生成、ルーティン⇔記録の変換
│   ├── date.ts             # 日付ユーティリティ（カレンダーのマス目生成など）
│   ├── colors.ts           # 部位カラーのユーティリティ
│   └── backup.ts           # JSON エクスポート／インポート
├── store/
│   ├── context.ts          # Context の定義
│   ├── AppContext.tsx      # Provider（repository を呼んで state を更新）
│   └── useApp.ts           # useApp() フック
├── components/             # カレンダー、記録エディタ、グラフ、シートなど
└── pages/                  # 4つのタブに対応する画面
```

## データ設計

1レコード = 1トレーニングセッション（`WorkoutSession`）。

```ts
WorkoutSession {
  id: string
  date: 'YYYY-MM-DD'
  exercises: Array<{
    id: string
    name: string              // 種目名（自由入力・過去の入力をサジェスト）
    muscleGroupIds: string[]  // 部位タグ（複数可）
    sets: Array<{ id: string; weight: number | null; reps: number | null }>
    memo: string
  }>
  memo: string
  createdAt / updatedAt: ISO 8601
}
```

localStorage には `workout-calendar:data` キーで
`{ version, sessions[], routines[], settings }` をまとめて保存します。
`version` はスキーマ変更時のマイグレーション用（`SCHEMA_VERSION`）。

同じ日に複数セッションを登録でき、その日の部位タグは含まれる種目の部位の和集合として表示されます。

## バックエンドへの移行

UI は `lib/repository.ts` の `WorkoutRepository` インターフェースだけに依存しています。
Supabase などに移す場合は、同じインターフェースを実装したクラスを作り、
末尾の `export const repository` を差し替えれば UI 側の変更は不要です
（メソッドはすべて Promise を返す設計にしてあります）。

## 注意

- データはこの端末のブラウザにのみ保存されます。機種変更やブラウザのデータ削除で消えるので、
  設定画面から定期的に JSON をエクスポートしてください。
- iOS では、長期間アプリを開かないと Safari がストレージを消す場合があります（同上）。
