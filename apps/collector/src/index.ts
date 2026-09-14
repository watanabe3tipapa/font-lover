import { Hono } from "hono";
import { cors } from "hono/cors";
import scanRoute from "./routes/scan";
import collectRoute from "./routes/collect";
import fontsRoute from "./routes/fonts";
import sitesRoute from "./routes/sites";
import statsRoute from "./routes/stats";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// CORS（zine からの呼び出し用）
app.use("/api/*", cors({
  origin: ["http://localhost:3000", "https://font-lover.vercel.app"],
  allowMethods: ["GET", "POST", "OPTIONS"],
}));

// Bearer Token 認証（WORKER_TOKEN）
app.use("/api/*", async (c, next) => {
  const token = c.env.WORKER_TOKEN;
  if (!token) return next();

  const auth = c.req.header("Authorization") || "";
  if (auth !== `Bearer ${token}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// ヘルスチェック
app.get("/", (c) => c.json({ ok: true, service: "font-lover-collector" }));

// ルート登録
app.route("/api/scan", scanRoute);
app.route("/api/collect", collectRoute);
app.route("/api/fonts", fontsRoute);
app.route("/api/sites", sitesRoute);
app.route("/api/stats", statsRoute);

export default app;
