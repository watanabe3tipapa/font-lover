import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { fontFamilies, fontFaces, fontSightings, fontMdnRefs } from "@font-lover/database";
import { REMOTE } from "@/lib/config";

// ============================================================
// ローカル開発用: better-sqlite3（遅延初期化）
//
// リモートモード（Vercel + collector プロキシ）では使わない。
// Vercel のサーバーレス領域は読み取り専用のため、`new Database()` を
// モジュール読み込み時に実行するとクラッシュする → getter 経由で遅延実行する。
// ============================================================
let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function init() {
  if (_sqlite) return;

  if (REMOTE) {
    throw new Error(
      "better-sqlite3 is not available in remote mode. Enable COLLECTOR_URL proxy or run locally.",
    );
  }

  _sqlite = new Database("./font-lover.db");

  // スキーマが未作成の状態でも起動できるよう、テーブルを冪等に初期化する
  //（本番では drizzle-kit / D1 マイグレーションで管理する）
  _sqlite.exec(`
    CREATE TABLE IF NOT EXISTS font_families (
      id INTEGER PRIMARY KEY,
      family_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'unknown',
      source_type TEXT NOT NULL DEFAULT 'unknown',
      popularity_score REAL,
      first_seen_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS font_faces (
      id INTEGER PRIMARY KEY,
      family_id INTEGER NOT NULL,
      weight TEXT,
      style TEXT,
      source_url TEXT,
      format TEXT
    );
    CREATE TABLE IF NOT EXISTS font_sightings (
      id INTEGER PRIMARY KEY,
      family_id INTEGER NOT NULL,
      site_url TEXT NOT NULL,
      site_domain TEXT NOT NULL,
      page_title TEXT,
      usage_count INTEGER,
      mode TEXT NOT NULL,
      detected_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS font_mdn_refs (
      id INTEGER PRIMARY KEY,
      family_id INTEGER NOT NULL,
      mdn_slug TEXT NOT NULL,
      description TEXT,
      compatibility_note TEXT
    );
  `);

  _db = drizzle(_sqlite, {
    schema: { fontFamilies, fontFaces, fontSightings, fontMdnRefs },
  });
}

export function getSqlite(): Database.Database {
  init();
  return _sqlite!;
}

export function getDb() {
  init();
  return _db!;
}

// ============================================================
// 本番（Vercel + Cloudflare D1）への切り替え方法:
//
// 1. collector（Cloudflare Workers）へ読み取りGET APIを追加済み
//    （/api/fonts, /api/fonts/:family, /api/sites/:domain, /api/stats）
// 2. Vercel 環境変数に COLLECTOR_URL / WORKER_TOKEN を設定
// 3. zine の API は lib/data.ts 経由でプロキシされる
// ============================================================