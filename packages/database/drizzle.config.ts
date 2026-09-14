import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  driver: "d1",
  dbCredentials: {
    wranglerConfigPath: "../../apps/collector/wrangler.toml",
    dbName: "font-lover-db",
  },
});