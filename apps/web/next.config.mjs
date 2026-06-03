import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for a small production Docker image.
  output: "standalone",
  // In a monorepo, trace dependencies from the repo root.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // In dev there is no Caddy, so mirror it: strip /api and proxy to the API.
  // (In production Caddy handles /api/* before it ever reaches Next.)
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return []
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:4000"
    return [{ source: "/api/:path*", destination: `${target}/:path*` }]
  },
}

export default nextConfig
