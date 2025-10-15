/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";

module.exports = {
  output: "export",
  assetPrefix: isGithubActions ? `/${repo}` : "",
  basePath: isGithubActions ? `/${repo}` : "",
  images: { unoptimized: true },
};
