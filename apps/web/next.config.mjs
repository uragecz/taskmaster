import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for a small production Docker image.
  output: "standalone",
  // In a monorepo, trace dependencies from the repo root.
  outputFileTracingRoot: path.join(__dirname, "../../"),
}

export default nextConfig
