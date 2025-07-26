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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to fix a build error for 'async_hooks' which is a nodejs only module
    // It's used by opentelemetry, a dependency of genkit.
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            'async_hooks': false,
            'handlebars': false,
        };
    }
    return config;
  },
};

export default nextConfig;
