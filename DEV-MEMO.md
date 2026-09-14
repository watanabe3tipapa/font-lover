# DEV-MEMO

FONT-LOVER 実装に関する作業記録。実装内容を追録していくためのメモ。

## プロジェクト概要

Webサイトで実際に使われているフォントを検出・蓄積・展示する実験リポジトリ。

- **collector**（`apps/collector`）: Cloudflare Workers。FONT検出エンジン。軽量モード（HTML/CSS解析）と完全モード（Browser Run / Puppeteer）
- **zine**（`apps/zine`）: Next.js (App Router)。FONT図鑑UI（一覧・詳細・サイト別・ダッシュボード）
- **database**（`packages/database`）: Drizzle ORM スキーマ・マイグレーション
- **shared-types**（`packages/shared-types`）: API型・ドメイン型・定数
- **tooling**: cron-trigger（バッチ収集）/ mdn-sync（MDN知見同期）

## スタック

- pnpm workspaces + Turborepo（monorepo）
- TypeScript
- Cloudflare Workers（Hono）+ @cloudflare/puppeteer
- Next.js 14 + React 18
- Drizzle ORM（ローカル: better-sqlite3 / 本番: D1）

## 実装済みタスク

### リポジトリ構築（2026-09-14）

- `sample/font-lover-origin.zip` をベースに monorepo 一式を展開
- `.gitignore` を新規作成し、依存/ビルド成果物/env/DBファイルを除外
- README を現状に合わせて再整備

### 依存・設定の修正

- turbo v2系: `turbo.json` の `pipeline` → `tasks` に変更
- drizzle-kit 0.20系: `drizzle.config.ts` を `driver: "d1"` + `wranglerConfigPath` 形式に修正
- drizzle-kit 0.20系: コマンドを `generate:sqlite` / `up:sqlite` に変更
- collector: Honoのbearer認証を手動トークン検証に置き換え（型エラー回避）
- collector: `store.ts` の `sourceType` を `SourceType` 型にキャスト（drizzle enum型）
- shared-types / database に `tsconfig.json` を追加（`tsc` lint が動くように）
- zine: `better-sqlite3` を依存に追加（Next 14 は `experimental.serverComponentsExternalPackages` で外部化）
- zine: `.eslintrc.json` を `next/core-web-vitals` + `next/typescript` で作成

### APIルート補完（zine）

未実装だった以下のGETルートを新規実装。

- `GET /api/fonts/:family` — フォント詳細 + 採集記録（`app/api/fonts/[family]/route.ts`）
- `GET /api/sites/:domain` — サイト別フォント一覧（`app/api/sites/[domain]/route.ts`）
- `GET /api/stats` — ダッシュボード用統計（`app/api/stats/route.ts`）

注意: `GET /api/fonts`・`/api/stats` はビルド時に静的プリレンダリングされて古いDB値を返すため、`export const dynamic = "force-dynamic"` を付与。

### ローカルDB（SQLite）まわり

- `apps/zine/lib/db.ts` でテーブルを冪等に自動初期化（`CREATE TABLE IF NOT EXISTS` ✕ 4テーブル）
- ローカル開発用シード: `apps/zine/scripts/seed.mjs`（`pnpm --filter @font-lover/zine db:seed`）

### OKF v0.2 知識バンドルの JSON 表現（2026-09-14）

蓄積したフォント知見を **Open Knowledge Format v0.2** の機械可読 JSON として出力する仕組みを追加。
構成は okf-seedling（watanabe3tipapa/okf-seedling）の `pipeline/knowledge/` と同型。

- `apps/zine/lib/okf-builder.mjs` (+ `.d.mts`): ローカルSQLiteから OKF v0.2 バンドルを組み立てる共通ロジック
  - OKF frontmatter を `meta` にJSON化（`type`/`title`/`description`/`resource`/`tags`/`status`/`generated`/`verified`/`stale_after`/`sources`）
  - 本文相当を `sections[]`（`heading`/`level`/`blocks`）で構造化
  - 検出サイトは `sources[].usage_count`（信用シグナル）、鮮度は `stale_after = updated_at + 90日`（絶対時刻）
  - `status` は前回バンドルとのハッシュ差分で `new` / `updated` / `unchanged` を判定
- `apps/zine/scripts/gen-okf.mjs`（`pnpm --filter @font-lover/zine okf:build`）:
  - `apps/zine/pipeline/knowledge/index.json` + `apps/zine/pipeline/knowledge/concepts/fonts/<slug>.json` を生成
- `GET /api/okf`: DB の現状を同型の JSON でライブ返却（`okf_version: "0.2"` を返す）
- `/okf`（OKFビューワー）: total / byStatus バッジ + concept 別の折りたたみJSON表示（`force-dynamic`）
- ナビゲーションに「OKFビューワー」を追加

注意:
- ローカル実行は `node` 単体ではなく `pnpm exec node`（または `pnpm okf:build`）を使う。
  better-sqlite3 の Native バイナリが Node v25（NODE_MODULE_VERSION 141）でビルドされており、
  Volta の node v22 では `ERR_DLOPEN_FAILED` になる。
- concept JSON にはランレベルの `status` を持たせず、`index.json` 側にのみ持つ（okf-seedling と同型）。

### UI

- ヘッダーにナビゲーション（図鑑トップ / 統計ダッシュボード / サイト別ビュー）を追加

## 検証結果（2026-09-14）

- `pnpm build`: collector（tsc）・zine（next build）ともに成功
- `pnpm lint`: collector/database/shared-types（tsc）・zine（next lint）ともに成功
- `pnpm db:generate`: D1向けSQL生成OK（`packages/database/drizzle/0000_unusual_nextwave.sql`）
- zine 実機確認（`next start` + curl）:
  - `/api/fonts` / `/api/stats` / `/api/fonts/:family` / `/api/sites/:domain` すべて 200
  - seed 投入後、一覧・統計・詳細・サイト別にデータが反映されることを確認

## 起動方法

```bash
pnpm install
pnpm --filter @font-lover/zine db:seed   # デモデータ投入（初回のみ、任意）
pnpm dev                                  # collector:8787 / zine:3000
```

## 残タスク・未着手 / 注意点

- **完全モード（Browser Run）は無料枠では使えない**。スキャンは light モード（HTMLパース）で運用。full スキャンは動的 import にしているが `MYBROWSER` バインディングなしのため実行不可（有料枠にする際は `[browser]` バインディングを wrangler.toml へ追加）
- **light スキャンのノイズ**: CSS変数(`var(--…)`)/`inherit`/`sans-serif` なども取得する。ニーズに応じフィルタ追加が望ましい
- **`tooling/mdn-sync`** は `pnpm --filter @font-lover/zine mdn:sync`（node 25 推奨）で実行可能。font_mdn_refs への保存済み（ローカル SQLite）。**D1 にも反映済み**（production 6ファミリー × 8スラグ = 48件、`wrangler d1 execute --file` で投入）
- **`tooling/cron-trigger`** は CLI 実行可能な状態。`collect-batch.ts light|full [tech|government|all]` で対象切替（government = 中央省庁・機関39サイト）。Cron Trigger 設定は未実施
- **eslint-config**（`packages/eslint-config`）は現状 zine から未参照。参照する場合は prettier/型スクリプト系プラグインの導入が必要

## デプロイ（2026-09-14 実施）

- **GitHub**: 公開リポジトリ `watanabe3tipapa/font-lover`（main）で管理
- **Vercel**: プロジェクト `font-lover`（Root Directory = `apps/zine`, Next.js）を GitHub 連動の自動デプロイで運用。
  - 本番: https://font-lover.vercel.app
  - 環境変数（Production）: `COLLECTOR_URL` = `https://font-lover-collector.watanabe3ti.workers.dev` / `WORKER_TOKEN` = worker のシークレットと同じ
  - `/api/fonts` 等は D1 へプロキシ。`/api/okf` はコミット済み `pipeline/knowledge/*.json`（OKF v0.2）を返す
  - 設定変更は GitHub へ push すると自動で反映される（CLI `vercel --prod` は monorepo 直上がりだと install に失敗するため使わない）
- **Cloudflare（無料枠）**: worker `font-lover-collector` + D1 `font-lover-db`（APAC）デプロイ済み。
  - URL: https://font-lover-collector.watanabe3ti.workers.dev（`/` は公開, `/api/*` は `WORKER_TOKEN` Bearer 必須）
  - `wrangler.toml`: `compatibility_flags = ["nodejs_compat"]`（puppeteer の `node:buffer` 混入回避。無料枠でも利用可）。[browser] バインディングは無し
  - シークレット: `wrangler secret put WORKER_TOKEN` で設定（`apps/collector/.dev.vars` はローカル用・gitignore 済み）
  - ローカル D1 は `wrangler d1 execute font-lover-db --local --file=<clean.sql>`（破 `--> statement-breakpoint` を除いたプレーンSQL）で再現可能
- **ローカル/リモート切替**: `apps/zine/lib/config.ts` の `REMOTE`（= `COLLECTOR_URL` の有無）で判定。
  `apps/zine/lib/data.ts` が SQLite（ローカル）または collector GET（本番）に振り分ける

## コマンドメモ

```bash
pnpm build            # turbo run build
pnpm lint             # turbo run lint
pnpm dev              # collector + zine 並列起動
pnpm db:generate      # drizzle-kit generate:sqlite
pnpm db:migrate       # drizzle-kit up:sqlite（要 Cloudflare 認証）
pnpm --filter @font-lover/zine db:seed   # ローカルSQLiteへシード
pnpm --filter @font-lover/zine okf:build # OKF v0.2 知識バンドル(JSON)を生成
```