/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for portable deployment
  // This creates a self-contained build in .next/standalone
  output: 'standalone',

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
