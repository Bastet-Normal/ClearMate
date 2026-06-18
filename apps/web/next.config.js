/** @type {import('next').NextConfig} */

// GitHub Pages 部署需要 basePath = /<repo-name>
// 本地开发时为空字符串
const isProd = process.env.NODE_ENV === "production";
const repoName = "ClearMate";

const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
