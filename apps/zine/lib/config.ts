// 実行モード判定（ローカルSQLite / collectorプロキシ）
export const COLLECTOR_URL = (process.env.COLLECTOR_URL || "").replace(/\/$/, "");
export const WORKER_TOKEN = process.env.WORKER_TOKEN || "";
export const REMOTE = Boolean(COLLECTOR_URL);