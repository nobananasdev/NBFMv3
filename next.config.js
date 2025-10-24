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
    // Device sizes for responsive images (optimized for show cards)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for different use cases (optimized for posters)
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 180, 220, 256],
    // Cache optimized images for 7 days (longer cache for better performance)
    minimumCacheTTL: 604800,
    // Unoptimized false to use Next.js optimization
    unoptimized: false,
    // Disable image optimization in development for faster reload
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable gzip compression
  compress: true,
  // Use SWC for faster minification
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
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
            // 7 days cache, 30 days stale-while-revalidate
            value: 'public, max-age=604800, stale-while-revalidate=2592000, immutable',
          },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // Static assets cached for 1 year
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig