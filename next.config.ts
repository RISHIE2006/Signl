/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'img.clerk.com' }],
  },
  serverExternalPackages: ['pdf-parse', 'better-sqlite3'],
};

export default nextConfig;
