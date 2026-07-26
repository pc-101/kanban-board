const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => {
  const isGithubActions = process.env.GITHUB_ACTIONS === "true";
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    output: "export",
    distDir: isDev ? ".next-dev" : ".next",
    assetPrefix: isGithubActions ? `/${repo}` : "",
    basePath: isGithubActions ? `/${repo}` : "",
    images: { unoptimized: true },
  };
};
