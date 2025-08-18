/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow both "object" and "render/image" Supabase Storage endpoints
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tluyjrjdwtskuconslaj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'tluyjrjdwtskuconslaj.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
      // Fallback to TMDB if some records still use TMDB poster paths
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/**',
      },
    ],
    // Serve modern formats when supported (AVIF first for best compression)
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 24 hours
    minimumCacheTTL: 86400,
    // Unoptimized false to use Next.js optimization
    unoptimized: false,
  },
  // Enable gzip compression
  compress: true,
  // Use SWC for faster minification
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    // Enable modern bundling
    esmExternals: true,
  },
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig