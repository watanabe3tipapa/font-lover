import Database from "better-sqlite3";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildOkfKnowledge } from "../lib/okf-builder.mjs";

const sqlite = new Database("./font-lover.db");
const OUT_DIR = "pipeline/knowledge";
const CONCEPTS_DIR = join(OUT_DIR, "concepts");

// 前回のバンドル(存在すれば)から id -> hash を集め、status 差分を判定する
let previousHashes = {};
try {
  const files = await readdir(CONCEPTS_DIR, { recursive: true });
  for (const f of files) {
    if (!String(f).endsWith(".json")) continue;
    const j = JSON.parse(await readFile(join(CONCEPTS_DIR, f), "utf8"));
    previousHashes[j.id] = j.hash;
  }
} catch {
  // 初回生成時は previous なし -> 全て new 扱い
}

const { index, concepts } = buildOkfKnowledge(sqlite, { previousHashes });

await mkdir(CONCEPTS_DIR, { recursive: true });
for (const c of concepts) {
  // ランレベルの status は index.json 側だけに持ち、concept 定義本体には含めない
  // (okf-seedling の pipeline/knowledge/concepts/*.json と同じ形)
  const { status: _runStatus, ...concept } = c;
  const path = join(CONCEPTS_DIR, `${c.id}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(concept, null, 2) + "\n");
}
await writeFile(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");

console.log(
  `OKF v0.2 knowledge bundle: ${index.total} concepts (${Object.entries(index.byStatus)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ")}) -> ${OUT_DIR}/`,
);