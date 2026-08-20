/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        // Credentials cannot be used with a wildcard origin. Set NEXT_PUBLIC_APP_URL
        // to the deployed frontend URL for cross-origin REST clients.
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
      ],
    }];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'img.clerk.com' }],
  },
  serverExternalPackages: ['pdf-parse', 'better-sqlite3'],
};

export default nextConfig;
