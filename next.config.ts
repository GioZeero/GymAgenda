import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Applica header di Cache-Control al nuovo service worker statico
        source: '/custom-firebase-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            // 'no-cache' dice al browser di ricontrollare sempre con il server (validazione ETag/Last-Modified)
            // 'max-age=0' è simile ma alcuni proxy potrebbero cachare.
            // 'must-revalidate' assicura che la cache non venga usata se scaduta.
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
