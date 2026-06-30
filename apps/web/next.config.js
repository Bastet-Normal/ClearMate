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
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
