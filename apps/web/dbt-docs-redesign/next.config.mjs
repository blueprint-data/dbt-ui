/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack configuration
  // Turbopack (Next.js 16 default bundler) handles WebAssembly natively
  // The sql-wasm.wasm file is served from the public/ directory
  turbopack: {
    // No special configuration needed - Turbopack handles WASM automatically
  },
}

export default nextConfig;
