# FONT-LOVER 🔤

Web上で実際に使われているフォントを自動検出・蓄積・展示する実験プロジェクト。
収集した観測データを **OKF v0.2** 準拠の知識バンドルに自動整形して公開します。

- **collector**（`apps/collector`）: Cloudflare Workers + D1 のフォント検出エンジン（無料枠で稼働中）
- **zine**（`apps/zine`）: Next.js のフォント図鑑UI（Vercel 本番稼働中）
- **database**（`packages/database`）: Drizzle ORM でスキーマを D1/SQLite 間で共有
- **shared-types**（`packages/shared-types`）: API型・ドメイン型・定数

## リンク

| 対象 | URL |
| --- | --- |
| Zine（フォント図鑑） | <https://font-lover.vercel.app> |
| Collector API（Worker） | <https://font-lover-collector.watanabe3ti.workers.dev> |
| GitHub Pages LP | <https://watanabe3tipapa.github.io/font-lover/> |
| OKF ビューワー | <https://font-lover.vercel.app/okf> |

## アーキテクチャ

```
GitHub (monorepo)
 ├── push ──► Vercel (zine: Next.js UI + APIプロキシ) ──┐
 │                    ▲                                │ COLLECTOR_URL + Bearer
 │                    └──────── /api/fonts 等 ─────────┘
 └── wrangler deploy ──► Cloudflare Workers (collector)
                          └──► D1 (font-lover-db: font_families / font_faces / font_sightings / font_mdn_refs)
```

- 本番では zine の GET API が `COLLECTOR_URL` 経由で D1 をプロキシ、OKF 画面はコミット済み `pipeline/knowledge/*.json` を表示
- ローカル開発では `COLLECTOR_URL` 未設定にすると `better-sqlite3`（`apps/zine/font-lover.db`）を直接参照
- 切替判定は `apps/zine/lib/config.ts` の `REMOTE`、振り分けは `apps/zine/lib/data.ts`

## スタック

- pnpm workspaces + Turborepo（monorepo）
- Next.js 14 (App Router) / React 18 — Vercel
- Cloudflare Workers（Hono）+ @cloudflare/puppeteer — 無料枠
- Cloudflare D1（SQLiteベース、APAC）
- Drizzle ORM（ローカル: better-sqlite3 / 本番: D1）
- OKF v0.2 準拠の知識バンドル生成

## クイックスタート（ローカル）

```bash
# 1. インストール
pnpm install

# 2. 環境変数
cp .env.example .env.local
cp apps/collector/.dev.vars.example apps/collector/.dev.vars  # WORKER_TOKEN を設定

# 3. デモデータ投入（初回のみ・任意）
pnpm --filter @font-lover/zine db:seed

# 4. 起動（collector:8787 / zine:3000）
pnpm dev
```

D1 のスキーマをローカルで使う場合：

```bash
# statement-breakpoint コメントを除いたプレーンSQLに変換して適用
grep -v -- '-->' packages/database/drizzle/0000_unusual_nextwave.sql > /tmp/schema.sql
npx wrangler d1 execute font-lover-db --local --file=/tmp/schema.sql
```

## API

### Collector（Cloudflare Workers）— `WORKER_TOKEN` Bearer 認証必須

| メソッド | エンドポイント | 内容 |
| --- | --- | --- |
| POST | `/api/scan` | 単発スキャン `{ url, mode: "light" \| "full" }` |
| POST | `/api/collect` | 複数URLを一括スキャン |
| GET | `/api/fonts` | 全フォント一覧（人気順） |
| GET | `/api/fonts/:family` | フォント詳細 + 採集記録 |
| GET | `/api/sites/:domain` | サイト別フォント一覧 |
| GET | `/api/stats` | 統計 |
| GET | `/` | ヘルスチェック |

### Zine（Vercel）— 本番は D1 へプロキシ / ローカルは SQLite

| メソッド | エンドポイント | 内容 |
| --- | --- | --- |
| GET | `/api/fonts` `/api/fonts/:family` `/api/sites/:domain` `/api/stats` | データ参照（プロキシ） |
| GET | `/api/okf` | OKF v0.2 知識バンドル（コミット済みJSON or ライブ生成） |
| POST | `/api/scan` | collector へのプロキシ |

## OKF v0.2

蓄積データから `apps/zine/scripts/gen-okf.mjs`（`pnpm --filter @font-lover/zine okf:build`）が
`index.json` + `concepts/fonts/<slug>.json` を生成。`status`（new/updated/unchanged）は前回バンドルとのハッシュ差分で判定し、
トップレベルの `status` は `index.json` 側のみに持つ仕様です。

## 環境変数

| 変数名 | 用途 | 場所 |
| --- | --- | --- |
| `WORKER_TOKEN` | collector の Bearer 認証トークン | `apps/collector/.dev.vars` / Workers Secret / Vercel（Production） |
| `COLLECTOR_URL` | zine から collector を呼び出す URL（設定時 = リモートモード） | Vercel / ローカル dev |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_D1_TOKEN` | D1 マイグレーション用 | `.env.local` |

## デプロイ

- **Vercel**: プロジェクト `font-lover`、Root Directory = `apps/zine`。GitHub push で自動デプロイ（CLI `vercel --prod` は monorepo 直上がりだと install に失敗するため使用しない）
- **Cloudflare**: `wrangler.toml` に `nodejs_compat` + `database_id` を設定済み。`wrangler deploy` で更新
- **GitHub Pages**: source = `main` の `/docs`（`docs/index.html`）。LP は `section.replace(...)` 不要の静的な Neo Brutalism デザイン

> 無料枠の注意: Browser Rendering（full スキャン）は Workers Paid が必要。無料枠では light モード（HTML パース）で運用し、full スキャンは動的 import のみで読み込む。

## ディレクトリ構成

```
font-lover/
├── apps/
│   ├── collector/      # Cloudflare Workers: フォント検出 + D1 プロキシ API
│   └── zine/           # Next.js: フォント図鑑UI + API + OKF v0.2 バンドル
├── packages/
│   ├── database/       # Drizzle ORM スキーマ・マイグレーション
│   ├── shared-types/   # 共有型・定数
│   └── eslint-config/
├── tooling/
│   ├── cron-trigger/   # バッチ収集スクリプト
│   └── mdn-sync/       # MDN知見同期スクリプト
├── docs/               # GitHub Pages LP（index.html）
└── turbo.json
```

## スクリプト

```bash
pnpm build            # turbo run build
pnpm lint             # turbo run lint
pnpm dev              # collector + zine 並列起動
pnpm db:generate      # drizzle-kit generate:sqlite（D1向けSQL生成）
pnpm db:migrate       # drizzle-kit up:sqlite（要 Cloudflare 認証）
pnpm --filter @font-lover/zine db:seed    # ローカルSQLiteへシード投入
pnpm --filter @font-lover/zine okf:build  # OKF v0.2 知識バンドルを生成
```

## ライセンス

MIT