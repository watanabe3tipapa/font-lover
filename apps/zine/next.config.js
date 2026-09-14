/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ネイティブモジュール（better-sqlite3）をサーバー側でのみ利用し、
  // webpack バンドル対象から除外する（ローカル開発用SQLite）
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  // Vercel デプロイ時に apps/zine をルートとして認識させる設定
  // 必要に応じて output: 'export' を有効化
};

module.exports = nextConfig;
