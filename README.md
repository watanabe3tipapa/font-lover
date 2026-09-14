# FONT-LOVER

**Webフォントの生態は、図鑑として育てるもの。**

FONT-LOVER は、Web 上で実際に使われているフォントを自動検出し、観測データを蓄積・分類し、図鑑 UI で展示する実験リポジトリです。蓄積した知見は **OKF v0.2** 準拠の知識バンドルに自動整形して公開します。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#ライセンス)
[![Version](https://img.shields.io/badge/version-v0.1.0-blue.svg)](https://github.com/watanabe3tipapa/font-lover/releases)
[![OKF](https://img.shields.io/badge/OKF-v0.2-8b5cf6.svg)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
[![Vercel](https://img.shields.io/badge/Vercel-live-black.svg)](https://font-lover.vercel.app)
[![Cloudflare](https://img.shields.io/badge/Cloudflare%20Workers-live-orange.svg)](https://font-lover-collector.watanabe3ti.workers.dev)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-blue.svg)](https://watanabe3tipapa.github.io/font-lover/)
[![GitHub](https://img.shields.io/github/issues/watanabe3tipapa/font-lover.svg)](https://github.com/watanabe3tipapa/font-lover/issues)

[日本語](README.md) | [English](README_en.md)

---

## 概要

FONT-LOVER はフォントの生態を「図鑑」として観察するプロジェクトです。実サイトをスキャンして得た観測データを Cloudflare D1（本番）または SQLite（ローカル）に蓄積し、`/` や `/api/fonts` などの GET API で参照できるようにします。集約データから OKF v0.2 準拠の知識バンドル（`concepts/fonts/*.json`）を自動生成し、トレーサビリティを保ちます。

## コンセプト — なぜ「図鑑」か

図鑑は、フィールドで観察した生物を記録し、分類し、誰にでも見せられる形に整える道具です。固定された一覧表ではなく、観察記録を蓄積し続けるプロセスが本質です。FONT-LOVER も同様に、Web で"生活している"フォントをこまかく観察し、採集記録を重ねて図鑑を育てます。

| 図鑑の作業 | FONT-LOVER の対応 |
|---|---|
| 観察する | 実サイトを light モード（HTML パース）でこまめにスキャン |
| 採集する | `font_families` / `font_sightings` に蓄積、重複時にスコア加算 |
| 標本を取る | `font_faces` で `@font-face` の SRC 保存、source_type を自動分類 |
| 分類する | category（serif/sans-serif 等）・source_type（google-fonts/unknown 等）で整理 |
| 図鑑として見せる | zine UI（図鑑・統計・サイト別・OKF ビューワー・DB 検査） |
| 知識として公開する | OKF v0.2 バンドルを自動生成、hash 差分で new/updated/unchanged を判定 |

## 主な特徴

- 実サイトを **light モード**でスキャン — HTML パースのみ（無料枠で運用可能）
- D1（本番）/ SQLite（ローカル）に蓄積、Drizzle ORM でスキーマを共有
- `GET /api/fonts` `/api/stats` `/api/sites/:domain` 等の参照 API
- `lib/data.ts` のリモート切替レイヤ — `COLLECTOR_URL` の有無で本番プロキシ / ローカル SQLite を自動判定
- **OKF v0.2** 準拠の知識バンドルを自動生成（hash 差分による `new` / `updated` / `unchanged` 判定）
- zine UI（**Neo Brutalism** デザイン）— 図鑑・統計・サイト別・OKF ビューワー・DB インスペクタ
- GitHub Pages LP（アーキテクチャ図・チュートリアル・API リファレンス）

---

## 前提条件

| ツール | 必要バージョン | 確認コマンド |
|---|---|---|
| pnpm | >= 9 | `pnpm --version` |
| Node.js | >= 20 | `node --version` |
| Wrangler | >= 3 | `npx wrangler --version` |
| Git | 任意（デプロイ・貢献時） | `git --version` |

macOS では `brew install pnpm node` で両方導入できます。

---

## 開始手順（確認できる事実のみ）

1. リポジトリをクローンして依存をインストール:

```bash
git clone https://github.com/watanabe3tipapa/font-lover.git
cd font-lover
pnpm install
```

2. 環境変数を設定:

```bash
cp .env.example .env.local
cp apps/collector/.dev.vars.example apps/collector/.dev.vars
```

`apps/collector/.dev.vars` に `WORKER_TOKEN` を設定してください。

3. （任意）デモデータを投入:

```bash
pnpm --filter @font-lover/zine db:seed
```

4. collector と zine を並列起動:

```bash
pnpm dev
# collector → http://localhost:8787
# zine     → http://localhost:3000
```

5. サイトをスキャンしてフォントを観測:

```bash
curl -X POST http://localhost:8787/api/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","mode":"light"}'
```

6. 結果を図鑑 UI で確認:

```bash
open http://localhost:3000/api/fonts
```

---

## API（v0.1.0）

### Collector（Cloudflare Workers）— `WORKER_TOKEN` Bearer 認証必須

| メソッド | エンドポイント | 内容 |
|---|---|---|
| POST | `/api/scan` | 単発スキャン（`{ url, mode: "light" \| "full" }`） |
| POST | `/api/collect` | 複数 URL を一括スキャン（`{ urls: string[], mode }`） |
| GET | `/api/fonts` | 全フォントファミリ（人気順） |
| GET | `/api/fonts/:family` | フォント詳細 + 採集記録 |
| GET | `/api/sites/:domain` | サイト別フォント一覧 |
| GET | `/api/stats` | 統計情報（件数・ランキング等） |
| GET | `/` | ヘルスチェック |

### Zine（Vercel）— 本番は D1 プロキシ、ローカルは SQLite

| メソッド | エンドポイント | 内容 |
|---|---|---|
| GET | `/api/fonts` `/api/fonts/:family` `/api/sites/:domain` `/api/stats` | データ参照（プロキシ or SQLite） |
| GET | `/api/okf` | OKF v0.2 知識バンドル（コミット済み JSON or ライブ生成） |
| POST | `/api/scan` | collector へのプロキシ |

---

## デプロイ（2026-09-14 稼働開始）

| 対象 | 推進手段 | URL |
|---|---|---|
| Zine（フォント図鑑） | GitHub push → Vercel 自動デプロイ | <https://font-lover.vercel.app> |
| Collector（Worker） | `wrangler deploy` | <https://font-lover-collector.watanabe3ti.workers.dev> |
| LP（GitHub Pages） | GitHub push → Pages 自動ビルド（`/docs`） | <https://watanabe3tipapa.github.io/font-lover/> |

> 無料枠の注意: Browser Rendering（full スキャン）は Workers Paid が必要です。無料枠では light モード（HTML パース）で運用し、full スキャンは動的 import のみで読み込みます。

---

## ドキュメントと学習順序

1. GitHub Pages LP で**全体像を掴む**
2. [デモサイト](https://font-lover.vercel.app/) **[API](https://font-lover.vercel.app/api/fonts) に触れる**
3. 開始手順に従い**ローカル環境を構築**しスキャンを実行
4. `/okf` ビューワーで**知識バンドル**を閲覧
5. `DEV-MEMO.md` で実装背景を読む

---

## リポジトリ構成

```
font-lover/
├── apps/
│   ├── collector/       # Cloudflare Workers: フォント検出 + D1 プロキシ API
│   └── zine/            # Next.js: フォント図鑑 UI + API + OKF v0.2 バンドル
├── packages/
│   ├── database/        # Drizzle ORM スキーマ・マイグレーション
│   └── shared-types/    # 共有型・定数
├── tooling/
│   ├── cron-trigger/    # バッチ収集スクリプト
│   └── mdn-sync/        # MDN 知見同期スクリプト
├── docs/                # GitHub Pages LP（index.html）
└── DEV-MEMO.md
```

---

## 環境変数

| 変数名 | 用途 | 設定場所 |
|---|---|---|
| `WORKER_TOKEN` | collector API の Bearer 認証トークン | `apps/collector/.dev.vars` / Workers Secret / Vercel（Production） |
| `COLLECTOR_URL` | zine から collector を呼び出す URL（設定時 = リモートモード） | Vercel / ローカル dev |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID（D1 マイグレーション用） | `.env.local` |
| `CLOUDFLARE_D1_TOKEN` | D1 API トークン | `.env.local` |

---

## コントリビューション

コントリビューションは歓迎します。大きな変更は事前に issue を立ててください。

基本的なワークフロー:

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/your-feature`)
3. 変更をコミット (`git commit -m 'Add your change'`)
4. ブランチをプッシュし、Pull Request を作成

---

## 連絡先 / 公開サイト

| 名前 | URL |
|---|---|
| GitHub | <https://github.com/watanabe3tipapa/font-lover> |
| デモ（Vercel） | <https://font-lover.vercel.app> |
| Collector API | <https://font-lover-collector.watanabe3ti.workers.dev> |
| LP（GitHub Pages） | <https://watanabe3tipapa.github.io/font-lover/> |
| OKF ビューワー | <https://font-lover.vercel.app/okf> |

---

## ライセンス

MIT ライセンス — 詳細は LICENSE ファイルを参照してください。

---

## 開発・保守状態

- リポジトリはアーカイブされていません。
- v0.1.0（2026-09-14 初回本番リリース）
- 最終更新: 2026-09-14