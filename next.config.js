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
    // Serve modern formats when supported
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig