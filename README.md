# FONT-LOVER

WebサイトのFONT情報を検出・蓄積・展示する実験リポジトリ。

- **collector**（`apps/collector`）: Cloudflare Workers + Browser Run でFONT検出エンジン
- **zine**（`apps/zine`）: Next.js on Vercel でFONT図鑑UI
- **database**（`packages/database`）: Drizzle ORM + D1 スキーマ（共有）
- **shared-types**（`packages/shared-types`）: API型・ドメイン型・定数（共有）

## クイックスタート

```bash
# 1. 依存のインストール
pnpm install

# 2. 環境変数（必要に応じて）
cp .env.example .env.local
cp apps/collector/.dev.vars.example apps/collector/.dev.vars

# 3. ローカル開発用SQLiteにシードデータ投入（開発初期は任意）
pnpm --filter @font-lover/zine db:seed

# 4. collector + zine を並列起動
pnpm dev
# collector: http://localhost:8787   zine: http://localhost:3000
```

## DB

- ローカル開発は `better-sqlite3`（`apps/zine/font-lover.db`）。スキーマは
  `apps/zine/lib/db.ts` が初回起動時に自動でテーブルを作成します。
- 本番（Cloudflare D1）向けマイグレーション素材は `packages/database` で管理。

```bash
pnpm db:generate   # drizzle-kit generate:sqlite（D1向けSQL生成）
pnpm db:migrate    # drizzle-kit up:sqlite（要 Cloudflare 認証情報）
```

## スクリプト

```bash
pnpm build   # turbo run build（collector: tsc / zine: next build）
pnpm lint    # turbo run lint（collector/database/shared-types: tsc / zine: next lint）
pnpm dev     # collector + zine を並列起動
```

## API（collector）

| エンドポイント | 内容 |
| --- | --- |
| `POST /api/scan` | 単発スキャン。`{ url, mode: "light" \| "full" }` |
| `POST /api/collect` | バッチ収集。`{ urls: string[], mode }` |

認証は `WORKER_TOKEN` による Bearer Token。CORSは zine のオリジンのみ許可。

## API（zine）

| エンドポイント | 内容 |
| --- | --- |
| `GET /api/fonts` | フォント一覧（人気順） |
| `GET /api/fonts/:family` | フォント詳細 + 採集記録 |
| `GET /api/sites/:domain` | サイト別フォント一覧 |
| `GET /api/stats` | ダッシュボード用統計 |
| `POST /api/scan` | collector へのプロキシ |

## ディレクトリ構成

```
font-lover/
├── apps/
│   ├── collector/     # Cloudflare Workers: FONT検出エンジン
│   └── zine/          # Next.js: FONT図鑑UI
├── packages/
│   ├── database/      # Drizzle ORM スキーマ
│   └── shared-types/  # 共有型・定数
├── tooling/
│   ├── cron-trigger/  # バッチ収集スクリプト
│   └── mdn-sync/      # MDN知見同期スクリプト
└── turbo.json
```

## 環境変数

| 変数名 | 用途 | 管理場所 |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID（D1 API用） | `.env.local` |
| `CLOUDFLARE_DATABASE_ID` | D1データベースID | `.env.local` |
| `CLOUDFLARE_D1_TOKEN` | D1 APIトークン | `.env.local` |
| `WORKER_TOKEN` | collector API の認証トークン | `apps/collector/.dev.vars` / Workers Secret |
| `COLLECTOR_URL` | zine から collector を呼び出すURL | Vercel / ローカル開発 |

## ライセンス

MIT