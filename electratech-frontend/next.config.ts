import type { NextConfig } from "next";

const getRemotePatterns = () => {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
      protocol: 'https',
      hostname: 'api.qrserver.com',
    },
  ];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  if (apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      patterns.push({
        protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
        pathname: '/uploads/**',
      });
    } catch {
      // Abaikan jika URL tidak valid
    }
  }

  // Tetap sediakan localhost sebagai fallback pengembangan lokal
  patterns.push({
    protocol: 'http',
    hostname: 'localhost',
    port: '4000',
    pathname: '/uploads/**',
  });

  return patterns;
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getRemotePatterns(),
  },
};

export default nextConfig;
