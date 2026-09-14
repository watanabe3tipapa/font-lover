import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { fontFamilies, fontFaces, fontSightings, fontMdnRefs } from "@font-lover/database";

// ============================================================
// ローカル開発用: better-sqlite3
// ============================================================
export const sqlite = new Database("./font-lover.db");

// スキーマが未作成の状態でも起動できるよう、テーブルを冪等に初期化する
//（本番では drizzle-kit / D1 マイグレーションで管理する）
sqlite.exec(`
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

export const db = drizzle(sqlite, {
  schema: { fontFamilies, fontFaces, fontSightings, fontMdnRefs },
});

// ============================================================
// 本番（Vercel + D1）への切り替え方法:
//
// 1. Vercel プロジェクトに D1 バインディングを設定
// 2. 以下のように書き換え:
//
// import { drizzle } from "drizzle-orm/d1";
// export const db = drizzle(process.env.DB as any);
//
// ※ Vercel では現在 D1 直接接続は非対応のため、
//   Cloudflare Pages へのデプロイを検討するか、
//   Supabase PostgreSQL に切り替える選択肢もあります。
// ============================================================